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

// Generar reporte EOQ en PDF con formato estructurado
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
    const frecuencia_pedidos = D / EOQ;
    const dias_entre_pedidos = Math.round(365 / frecuencia_pedidos);
    const demanda_diaria = D / 365;

    // Crear PDF con estructura específica
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    const safeFilename = encodeURIComponent(`reporte_eoq_${nombre.replace(/\s+/g, '_')}.pdf`);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    doc.pipe(res);

    // Encabezado del documento
    doc.fontSize(20).fillColor('#2563eb').text('📄 REPORTE DE CÁLCULO EOQ', { align: 'center', underline: true });
    doc.fontSize(12).fillColor('#6B7280').text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    doc.moveDown(2);

    // 1. DATOS GENERALES DEL PRODUCTO
    doc.fontSize(16).fillColor('#1F2937').text('1. DATOS GENERALES DEL PRODUCTO', { underline: true });
    doc.moveDown(0.5);
    
    doc.roundedRect(60, doc.y, doc.page.width - 120, 100, 8).fillAndStroke('#F9FAFB', '#E5E7EB');
    doc.fillColor('#374151').fontSize(11);
    doc.text(`• Nombre del producto: ${nombre}`, 75, doc.y + 15);
    doc.text(`• Código/SKU: PRD-${producto_id.toString().padStart(4, '0')}`);
    doc.text(`• Categoría: ${categoria || 'No especificada'}`);
    doc.text(`• Precio unitario: $${costo_unitario}`);
    doc.text(`• Stock actual: ${producto.stock_actual} unidades`);
    doc.moveDown(6);

    // 2. OBJETIVO DEL CÁLCULO
    doc.fontSize(16).fillColor('#1F2937').text('2. OBJETIVO DEL CÁLCULO', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#374151');
    doc.text(`Optimizar la gestión del inventario del producto "${nombre}" para reducir costos logísticos, ` +
             'minimizar el costo total de inventario y determinar la cantidad óptima de pedido que equilibre ' +
             'los costos de almacenamiento con los costos de realizar pedidos.');
    doc.moveDown(1);

    // 3. PARÁMETROS UTILIZADOS
    doc.fontSize(16).fillColor('#1F2937').text('3. PARÁMETROS UTILIZADOS', { underline: true });
    doc.moveDown(0.5);
    
    doc.roundedRect(60, doc.y, doc.page.width - 120, 85, 8).fillAndStroke('#EFF6FF', '#DBEAFE');
    doc.fillColor('#1E40AF').fontSize(11);
    doc.text(`• Demanda anual (D): ${D} unidades`, 75, doc.y + 15);
    doc.text(`• Costo por pedido (S): $${S}`);
    doc.text(`• Costo de mantenimiento por unidad al año (H): $${H}`);
    doc.text(`• Precio de compra unitario: $${costo_unitario}`);
    doc.text(`• Demanda diaria promedio: ${demanda_diaria.toFixed(2)} unidades/día`);
    doc.moveDown(5.5);

    // 4. FÓRMULA APLICADA
    doc.fontSize(16).fillColor('#1F2937').text('4. FÓRMULA APLICADA', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#374151');
    doc.text('Se utiliza la fórmula estándar del Lote Económico de Compra (EOQ):');
    doc.moveDown(0.5);
    
    // Fórmula destacada
    doc.roundedRect(60, doc.y, doc.page.width - 120, 40, 8).fillAndStroke('#FEF3C7', '#F59E0B');
    doc.fillColor('#92400E').fontSize(14).font('Helvetica-Bold');
    doc.text('EOQ = √(2 × D × S / H)', 0, doc.y + 12, { align: 'center' });
    doc.font('Helvetica').moveDown(3);

    // 5. CÁLCULO PASO A PASO
    doc.fontSize(16).fillColor('#1F2937').text('5. CÁLCULO EOQ PASO A PASO', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#374151');
    
    doc.text('Sustitución de valores en la fórmula:');
    doc.moveDown(0.3);
    doc.text(`EOQ = √(2 × ${D} × ${S} / ${H})`);
    doc.text(`EOQ = √(${2 * D * S} / ${H})`);
    doc.text(`EOQ = √(${(2 * D * S) / H})`);
    
    doc.roundedRect(60, doc.y + 5, doc.page.width - 120, 30, 8).fillAndStroke('#DCFCE7', '#16A34A');
    doc.fillColor('#15803D').fontSize(12).font('Helvetica-Bold');
    doc.text(`Resultado final: EOQ = ${Math.round(EOQ)} unidades`, 0, doc.y + 15, { align: 'center' });
    doc.font('Helvetica').moveDown(2.5);

    // 6. INTERPRETACIÓN DEL RESULTADO
    doc.fontSize(16).fillColor('#1F2937').text('6. INTERPRETACIÓN DEL RESULTADO', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#374151');
    
    doc.text(`• Cantidad óptima a pedir: ${Math.round(EOQ)} unidades cada vez`);
    doc.text(`• Frecuencia de pedidos: ${frecuencia_pedidos.toFixed(1)} pedidos por año`);
    doc.text(`• Tiempo entre pedidos: ${dias_entre_pedidos} días aproximadamente`);
    doc.text(`• Costo total anual estimado: $${costo_total_estimado.toFixed(2)}`);
    doc.moveDown(1);

    // Nueva página si es necesario
    if (doc.y > 650) {
      doc.addPage();
    }

    // 7. RECOMENDACIONES
    doc.fontSize(16).fillColor('#1F2937').text('7. RECOMENDACIONES', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#374151');
    
    doc.text('• Ajustar la política de compras para realizar pedidos cada ' + dias_entre_pedidos + ' días');
    doc.text('• Establecer punto de reorden considerando el tiempo de entrega del proveedor');
    doc.text('• Monitorear regularmente la demanda para ajustar los cálculos si es necesario');
    doc.text('• Revisar periódicamente los costos de pedido y mantenimiento');
    doc.text('• Considerar descuentos por volumen que puedan afectar la cantidad óptima');
    doc.moveDown(1);

    // 8. ANÁLISIS COMPARATIVO
    doc.fontSize(16).fillColor('#1F2937').text('8. ANÁLISIS COMPARATIVO', { underline: true });
    doc.moveDown(0.5);
    
    // Comparación con stock actual
    const costo_actual = producto.stock_actual > 0 ? 
      ((D / producto.stock_actual) * S) + ((producto.stock_actual / 2) * H) : 0;
    const ahorro_potencial = costo_actual - costo_total_estimado;
    
    doc.fontSize(11).fillColor('#374151');
    doc.text(`• Costo con política actual: $${costo_actual.toFixed(2)}/año`);
    doc.text(`• Costo con EOQ optimizado: $${costo_total_estimado.toFixed(2)}/año`);
    if (ahorro_potencial > 0) {
      doc.fillColor('#15803D');
      doc.text(`• Ahorro potencial: $${ahorro_potencial.toFixed(2)}/año (${((ahorro_potencial/costo_actual)*100).toFixed(1)}%)`);
    }
    doc.fillColor('#374151');
    doc.moveDown(1);

    // 9. CONCLUSIÓN DESTACADA
    doc.fontSize(16).fillColor('#1F2937').text('9. CONCLUSIÓN', { underline: true });
    doc.moveDown(0.5);
    doc.roundedRect(60, doc.y, doc.page.width - 120, 80, 8).fillAndStroke('#FEF2F2', '#EF4444');
    doc.fillColor('#DC2626').fontSize(12).font('Helvetica-Bold');
    doc.text('💡 CONCLUSIÓN PRINCIPAL:', 75, doc.y + 15);
    doc.font('Helvetica').fontSize(11);
    doc.text(`Se recomienda realizar pedidos de ${Math.round(EOQ)} unidades del producto "${nombre}" ` +
             `cada ${dias_entre_pedidos} días aproximadamente. Esto permitirá reducir los costos de ` +
             'almacenamiento y los costos administrativos de realizar pedidos con frecuencia, optimizando ' +
             'el flujo de caja y minimizando el riesgo de quiebre de stock.', 75, doc.y + 5, {
               width: doc.page.width - 150,
               align: 'justify'
             });
    doc.moveDown(5);

    // Pie de página
    doc.fontSize(10).fillColor('#6B7280');
    doc.text('Reporte generado automáticamente por OPTISTOCK - Sistema de Gestión de Inventario', 0, doc.page.height - 60, { 
      align: 'center' 
    });
    doc.text(`Página 1 de 1 | ${new Date().toLocaleString('es-ES')}`, 0, doc.page.height - 45, { 
      align: 'center' 
    });

    doc.end();

  } catch (error) {
    console.error('Error al generar reporte EOQ:', error.message);
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



