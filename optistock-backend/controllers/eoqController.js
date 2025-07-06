const pool = require('../models/db');

// Calcular EOQ para un producto
const calcularEOQ = async (req, res) => {
  try {
    const { producto_id } = req.params;

    // Obtener datos del producto
    const result = await pool.query(
      `SELECT * FROM productos WHERE id = $1`,
      [producto_id]
    );

    const producto = result.rows[0];
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { demanda_anual: D, costo_pedido: S, costo_mantenimiento: H } = producto;

    if (D <= 0 || S <= 0 || H <= 0) {
      return res.status(400).json({ error: 'Datos inválidos para cálculo EOQ' });
    }

    const eoq = Math.sqrt((2 * D * S) / H);
    const costo_total_estimado = ((D / eoq) * S) + ((eoq / 2) * H);

    // Guardar en historial
    const insert = await pool.query(
      `INSERT INTO calculos_eoq (producto_id, eoq_resultado, costo_total_estimado)
       VALUES ($1, $2, $3) RETURNING *`,
      [producto_id, eoq, costo_total_estimado]
    );

    res.status(200).json({
      producto: producto.nombre,
      eoq: Math.round(eoq),
      costo_total_estimado: parseFloat(costo_total_estimado.toFixed(2)),
      calculo_id: insert.rows[0].id
    });

  } catch (error) {
    console.error('Error al calcular EOQ:', error.message);
    res.status(500).json({ error: 'Error al calcular EOQ' });
  }
};

// Obtener historial de cálculos EOQ de un producto
const obtenerHistorialEOQ = async (req, res) => {
  try {
    const { producto_id } = req.params;

    const historial = await pool.query(
      `SELECT ce.id, ce.fecha, ce.eoq_resultado, ce.costo_total_estimado, p.nombre AS nombre_producto
       FROM calculos_eoq ce
       JOIN productos p ON ce.producto_id = p.id
       WHERE ce.producto_id = $1
       ORDER BY ce.fecha DESC`,
      [producto_id]
    );

    res.status(200).json(historial.rows);
  } catch (error) {
    console.error('Error al obtener historial EOQ:', error.message);
    res.status(500).json({ error: 'Error al obtener historial EOQ' });
  }
};

// Recomendación de cuándo y cuánto pedir
const obtenerRecomendacionEOQ = async (req, res) => {
  try {
    const { producto_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM productos WHERE id = $1`,
      [producto_id]
    );

    const producto = result.rows[0];

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { nombre, demanda_anual: D, costo_pedido: S, costo_mantenimiento: H } = producto;

    if (D <= 0 || S <= 0 || H <= 0) {
      return res.status(400).json({ error: 'Datos inválidos para recomendación' });
    }

    const EOQ = Math.sqrt((2 * D * S) / H);
    const frecuencia = D / EOQ;
    const diasEntrePedidos = 365 / frecuencia;

    res.status(200).json({
      producto: nombre,
      cantidad_a_pedir: parseFloat(EOQ.toFixed(2)),
      pedidos_al_anio: parseFloat(frecuencia.toFixed(1)),
      dias_entre_pedidos: Math.round(diasEntrePedidos),
      sugerencia: `Realizar un pedido de aproximadamente ${EOQ.toFixed(2)} unidades cada ${Math.round(diasEntrePedidos)} días.`
    });

  } catch (error) {
    console.error('Error al generar recomendación EOQ:', error.message);
    res.status(500).json({ error: 'Error al generar recomendación EOQ' });
  }
};

const PDFDocument = require('pdfkit');

// Generar reporte EOQ en PDF
const generarReporteEOQ = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM productos WHERE id = $1`,
      [producto_id]
    );
    const producto = result.rows[0];
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const { nombre, categoria, costo_unitario, demanda_anual: D, costo_pedido: S, costo_mantenimiento: H } = producto;
    const EOQ = Math.sqrt((2 * D * S) / H);
    const costo_total_estimado = ((D / EOQ) * S) + ((EOQ / 2) * H);
    const dias_entre_pedidos = Math.round((365 * EOQ) / D);

    // Crear PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    const safeFilename = encodeURIComponent(`reporte_eoq_${producto_id}.pdf`);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);


    doc.pipe(res);

    // Título
    doc.fontSize(24).fillColor('#2563eb').text('Reporte EOQ - OPTISTOCK', { align: 'center', underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#4B5563').text(`Fecha de generación: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    // Línea divisoria
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#2563eb');
    doc.moveDown(1.5);

    // Bloque de datos del producto
    doc.roundedRect(60, doc.y, doc.page.width - 120, 110, 8).fillAndStroke('#F3F4F6', '#2563eb');
    doc.fillColor('#111827').fontSize(13).text(`Producto: ${nombre}`, 75, doc.y + 10);
    doc.text(`Categoría: ${categoria}`);
    doc.text(`Costo unitario: $${costo_unitario}`);
    doc.text(`Demanda anual (D): ${D}`);
    doc.text(`Costo por pedido (S): $${S}`);
    doc.text(`Costo de mantenimiento (H): $${H}`);
    doc.moveDown(6);

    // Resultados EOQ destacados
    const yResultados = doc.y;
    doc.rect(60, yResultados, doc.page.width - 120, 60).fillAndStroke('#DBEAFE', '#2563eb');
    doc.fillColor('#1D4ED8').fontSize(15).text(`EOQ (Cantidad óptima): ${Math.round(EOQ)} unidades`, 75, yResultados + 10);
    doc.text(`Costo total estimado: $${costo_total_estimado.toFixed(2)}`);
    doc.text(`Recomendación: realizar un pedido cada ${Math.round(dias_entre_pedidos)} días`);
    doc.moveDown(5);

    // Pie de página
    doc.fontSize(10).fillColor('#6b7280').text('Reporte generado automáticamente por OPTISTOCK', 0, doc.page.height - 60, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error al generar reporte PDF:', error.message);
    res.status(500).json({ error: 'Error al generar el reporte EOQ' });
  }
};

// Generar reporte EOQ masivo en PDF para todos los productos críticos
const generarReporteEOQMasivo = async (req, res) => {
  try {
    // Seleccionar productos críticos (stock_actual <= stock_minimo)
    const result = await pool.query(
      `SELECT * FROM productos WHERE stock_actual <= stock_minimo ORDER BY categoria, nombre`
    );
    const productos = result.rows;
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_eoq_masivo.pdf"');
    doc.pipe(res);
    // Título
    doc.fontSize(24).fillColor('#2563eb').text('Reporte EOQ Masivo - OPTISTOCK', { align: 'center', underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#4B5563').text(`Fecha de generación: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);
    // Línea divisoria
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#2563eb');
    doc.moveDown(1.5);
    if (productos.length === 0) {
      doc.fontSize(14).fillColor('#b91c1c').text('No hay productos críticos para mostrar.', { align: 'center' });
    } else {
      productos.forEach((p, idx) => {
        const EOQ = Math.sqrt((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento);
        const costo_total_estimado = ((p.demanda_anual / EOQ) * p.costo_pedido) + ((EOQ / 2) * p.costo_mantenimiento);
        const dias_entre_pedidos = Math.round((365 * EOQ) / p.demanda_anual);
        // Bloque de datos
        doc.roundedRect(60, doc.y, doc.page.width - 120, 110, 8).fillAndStroke('#F3F4F6', '#2563eb');
        doc.fillColor('#111827').fontSize(13).text(`Producto: ${p.nombre}`, 75, doc.y + 10);
        doc.text(`Categoría: ${p.categoria}`);
        doc.text(`Costo unitario: $${p.costo_unitario}`);
        doc.text(`Demanda anual (D): ${p.demanda_anual}`);
        doc.text(`Costo por pedido (S): $${p.costo_pedido}`);
        doc.text(`Costo de mantenimiento (H): $${p.costo_mantenimiento}`);
        doc.moveDown(6);
        // Resultados EOQ destacados
        const yResultados = doc.y;
        doc.rect(60, yResultados, doc.page.width - 120, 60).fillAndStroke('#DBEAFE', '#2563eb');
        doc.fillColor('#1D4ED8').fontSize(15).text(`EOQ (Cantidad óptima): ${Math.round(EOQ)} unidades`, 75, yResultados + 10);
        doc.text(`Costo total estimado: $${costo_total_estimado.toFixed(2)}`);
        doc.text(`Recomendación: realizar un pedido cada ${Math.round(dias_entre_pedidos)} días`);
        doc.moveDown(5);
        // Separador entre productos
        if (idx < productos.length - 1) {
          doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke('#9CA3AF');
          doc.moveDown(1.5);
        }
      });
    }
    // Pie de página
    doc.fontSize(10).fillColor('#6b7280').text('Reporte generado automáticamente por OPTISTOCK', 0, doc.page.height - 60, { align: 'center' });
    doc.end();
  } catch (error) {
    console.error('Error al generar reporte EOQ masivo:', error.message);
    res.status(500).json({ error: 'Error al generar el reporte EOQ masivo' });
  }
};

module.exports = {
  calcularEOQ,
  obtenerHistorialEOQ,
  obtenerRecomendacionEOQ,
  generarReporteEOQ,
  generarReporteEOQMasivo
};



