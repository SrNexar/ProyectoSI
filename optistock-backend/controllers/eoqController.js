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
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    const safeFilename = encodeURIComponent(`reporte_eoq_${producto_id}.pdf`);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);


    doc.pipe(res);

    doc.fontSize(20).text('Reporte EOQ - OPTISTOCK', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Producto: ${nombre}`);
    doc.text(`Categoría: ${categoria}`);
    doc.text(`Costo unitario: $${costo_unitario}`);
    doc.text(`Demanda anual (D): ${D}`);
    doc.text(`Costo por pedido (S): $${S}`);
    doc.text(`Costo de mantenimiento (H): $${H}`);
    doc.moveDown();

   doc.fontSize(14).text(`EOQ (Cantidad óptima): ${Math.round(EOQ)} unidades`);
   doc.text(`Costo total estimado: $${costo_total_estimado.toFixed(2)}`);
   doc.text(`Recomendación: realizar un pedido cada ${Math.round(dias_entre_pedidos)} días`);


    doc.moveDown();

    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`);

    doc.end();
  } catch (error) {
    console.error('Error al generar reporte PDF:', error.message);
    res.status(500).json({ error: 'Error al generar el reporte EOQ' });
  }
};

module.exports = {
  calcularEOQ,
  obtenerHistorialEOQ,
  obtenerRecomendacionEOQ,
  generarReporteEOQ
};



