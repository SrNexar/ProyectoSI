const pool = require('../models/db');
const PDFDocument = require('pdfkit');
const path = require('path');

// Calcular EOQ para un producto específico
const calcularEOQ = async (req, res) => {
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

    const { demanda_anual: D, costo_pedido: S, costo_mantenimiento: H } = producto;

    if (!D || !S || !H || D <= 0 || S <= 0 || H <= 0) {
      return res.status(400).json({ 
        error: 'Los valores de demanda anual, costo de pedido y costo de mantenimiento deben ser positivos' 
      });
    }

    const EOQ = Math.sqrt((2 * D * S) / H);
    const costo_total_estimado = ((D / EOQ) * S) + ((EOQ / 2) * H);
    const frecuencia_pedidos = D / EOQ;
    const dias_entre_pedidos = Math.round(365 / frecuencia_pedidos);
    const demanda_diaria = D / 365;

    res.status(200).json({
      producto_id: parseInt(producto_id),
      nombre: producto.nombre,
      eoq: Math.round(EOQ),
      costo_total_estimado: Math.round(costo_total_estimado * 100) / 100,
      frecuencia_pedidos: Math.round(frecuencia_pedidos * 10) / 10,
      dias_entre_pedidos: dias_entre_pedidos,
      demanda_diaria: Math.round(demanda_diaria * 100) / 100,
      stock_actual: producto.stock_actual,
      recomendacion: producto.stock_actual < EOQ ? 
        `Se recomienda pedir ${Math.round(EOQ - producto.stock_actual)} unidades` :
        'Stock suficiente por ahora'
    });

  } catch (error) {
    console.error('Error al calcular EOQ:', error.message);
    res.status(500).json({ error: 'Error al calcular EOQ' });
  }
};

// Obtener historial de EOQ para un producto
const obtenerHistorialEOQ = async (req, res) => {
  try {
    const { producto_id } = req.params;

    // Verificar que el producto existe
    const productoResult = await pool.query(
      `SELECT nombre FROM productos WHERE id = $1`,
      [producto_id]
    );

    if (productoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Por ahora retornamos un historial simulado ya que no hay tabla de historial
    // En una implementación real, tendrías una tabla de historial de EOQ
    const historial = [
      {
        fecha: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        eoq: 150,
        demanda_anual: 1800,
        costo_total: 2250
      },
      {
        fecha: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        eoq: 145,
        demanda_anual: 1750,
        costo_total: 2180
      }
    ];

    res.status(200).json({
      producto_id: parseInt(producto_id),
      nombre: productoResult.rows[0].nombre,
      historial: historial
    });

  } catch (error) {
    console.error('Error al obtener historial EOQ:', error.message);
    res.status(500).json({ error: 'Error al obtener historial EOQ' });
  }
};

// Obtener recomendación EOQ para un producto específico
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

    const { demanda_anual: D, costo_pedido: S, costo_mantenimiento: H, stock_actual } = producto;

    if (!D || !S || !H || D <= 0 || S <= 0 || H <= 0) {
      return res.status(400).json({ 
        error: 'Los valores de demanda anual, costo de pedido y costo de mantenimiento deben ser positivos' 
      });
    }

    const EOQ = Math.sqrt((2 * D * S) / H);
    const diferencia = stock_actual - EOQ;
    const dias_hasta_reorden = Math.max(0, Math.round(diferencia / (D / 365)));

    let recomendacion = '';
    let prioridad = 'BAJA';

    if (stock_actual <= producto.stock_minimo) {
      recomendacion = `¡URGENTE! Stock crítico. Pedir ${Math.round(EOQ)} unidades inmediatamente.`;
      prioridad = 'ALTA';
    } else if (diferencia < 0) {
      recomendacion = `Pedir ${Math.round(Math.abs(diferencia))} unidades en los próximos ${dias_hasta_reorden} días.`;
      prioridad = diferencia < -EOQ * 0.5 ? 'MEDIA' : 'BAJA';
    } else {
      recomendacion = `Stock suficiente. Próximo pedido en aproximadamente ${dias_hasta_reorden} días.`;
    }

    res.status(200).json({
      producto_id: parseInt(producto_id),
      nombre: producto.nombre,
      eoq_optimo: Math.round(EOQ),
      stock_actual: stock_actual,
      diferencia: Math.round(diferencia),
      dias_hasta_reorden: dias_hasta_reorden,
      recomendacion: recomendacion,
      prioridad: prioridad,
      cantidad_sugerida: Math.round(EOQ)
    });

  } catch (error) {
    console.error('Error al obtener recomendación EOQ:', error.message);
    res.status(500).json({ error: 'Error al obtener recomendación EOQ' });
  }
};

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

    const { nombre, categoria, costo_unitario, stock_actual, demanda_anual: D, costo_pedido: S, costo_mantenimiento: H } = producto;

    const EOQ = Math.sqrt((2 * D * S) / H);
    const costo_total_estimado = ((D / EOQ) * S) + ((EOQ / 2) * H);
    const frecuencia_pedidos = D / EOQ;
    const dias_entre_pedidos = Math.round(365 / frecuencia_pedidos);
    const demanda_diaria = D / 365;

    const doc = new PDFDocument({ margin: 60, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    const safeFilename = encodeURIComponent(`reporte_eoq_${nombre.replace(/\s+/g, '_')}.pdf`);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    doc.pipe(res);

    // Configuración de layout
    const pageWidth = 535; // Ancho de página menos márgenes
    const leftMargin = 60;
    const labelCol = leftMargin + 20; // Columna de etiquetas
    const valueCol = leftMargin + 300; // Columna de valores (bien separada)

    // Encabezado principal
    doc.fontSize(24).fillColor('#1a202c').font('Helvetica-Bold')
      .text('REPORTE DE ANÁLISIS EOQ', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor('#4a5568').font('Helvetica')
      .text('(Economic Order Quantity)', { align: 'center' });
    
    // Línea separadora
    doc.moveTo(leftMargin, doc.y + 20).lineTo(leftMargin + pageWidth - 60, doc.y + 20).stroke();
    doc.moveDown(2);

    // Información del reporte
    doc.fontSize(10).fillColor('#718096').font('Helvetica')
      .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, { align: 'right' });
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, { align: 'right' });
    doc.moveDown(2);

    // SECCIÓN 1: INFORMACIÓN DEL PRODUCTO
    // Definir columnas y altura de fila solo una vez al inicio
    const colLabel = 120;
    const colValue = 290;
    const rowH = 16;
    doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
      .text('1. INFORMACIÓN DEL PRODUCTO', colLabel, doc.y, { underline: true });
    doc.moveDown(0.5);
    let y = doc.y;
    doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
    doc.text('Nombre del Producto:', colLabel, y);
    doc.font('Helvetica-Bold').text(nombre, colValue, y);
    y += rowH;
    doc.font('Helvetica').text('Categoría:', colLabel, y);
    doc.font('Helvetica-Bold').text(categoria || 'No especificada', colValue, y);
    y += rowH;
    doc.font('Helvetica').text('Costo Unitario:', colLabel, y);
    doc.font('Helvetica-Bold').text(`$${costo_unitario.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, colValue, y);
    y += rowH;
    doc.font('Helvetica').text('Stock Actual:', colLabel, y);
    doc.font('Helvetica-Bold').text(`${stock_actual.toLocaleString('es-ES')} unidades`, colValue, y);
    doc.y = y + 18;

    // SECCIÓN 2: PARÁMETROS DE CÁLCULO EOQ
    doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
      .text('2. PARÁMETROS DE CÁLCULO EOQ', colLabel, doc.y, { underline: true });
    doc.moveDown(0.5);
    y = doc.y;
    doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
    doc.text('Demanda Anual (D):', colLabel, y);
    doc.font('Helvetica-Bold').text(`${D.toLocaleString('es-ES')} unidades/año`, colValue, y);
    y += rowH;
    doc.font('Helvetica').text('Costo por Pedido (S):', colLabel, y);
    doc.font('Helvetica-Bold').text(`$${S.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, colValue, y);
    y += rowH;
    doc.font('Helvetica').text('Costo de Mantenimiento (H):', colLabel, y);
    doc.font('Helvetica-Bold').text(`$${H.toLocaleString('es-ES', { minimumFractionDigits: 2 })} por unidad/año`, colValue, y);
    doc.y = y + 18;

    // SECCIÓN 3: RESULTADOS DEL ANÁLISIS EOQ
    doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
      .text('3. RESULTADOS DEL ANÁLISIS EOQ', colLabel, doc.y, { underline: true });
    doc.moveDown(0.5);
    // Rectángulo destacado para EOQ principal
    const eoqBoxY = doc.y;
    doc.rect(colLabel, eoqBoxY, 250, 38).fillAndStroke('#f0f9ff', '#0369a1');
    doc.fontSize(13).fillColor('#0369a1').font('Helvetica-Bold')
      .text('CANTIDAD ECONÓMICA DE PEDIDO (EOQ)', colLabel + 8, eoqBoxY + 6);
    doc.fontSize(18).fillColor('#1e40af').font('Helvetica-Bold')
      .text(`${Math.round(EOQ).toLocaleString('es-ES')} unidades`, colLabel + 8, eoqBoxY + 20);
    doc.y = eoqBoxY + 44;
    y = doc.y;
    doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
    doc.text('Costo Total Anual Estimado:', colLabel, y);
    doc.font('Helvetica-Bold').text(`$${costo_total_estimado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, colValue, y);
    y += rowH;
    doc.font('Helvetica').text('Frecuencia de Pedidos:', colLabel, y);
    doc.font('Helvetica-Bold').text(`${frecuencia_pedidos.toFixed(1)} veces por año`, colValue, y);
    y += rowH;
    doc.font('Helvetica').text('Días entre Pedidos:', colLabel, y);
    doc.font('Helvetica-Bold').text(`${dias_entre_pedidos} días`, colValue, y);
    y += rowH;
    doc.font('Helvetica').text('Demanda Diaria Promedio:', colLabel, y);
    doc.font('Helvetica-Bold').text(`${demanda_diaria.toFixed(2)} unidades/día`, colValue, y);
    doc.y = y + 18;

    // SECCIÓN 4: ANÁLISIS Y RECOMENDACIONES
    doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
      .text('4. ANÁLISIS Y RECOMENDACIONES', colLabel, doc.y, { underline: true });
    doc.moveDown(1);
    
    // Análisis de situación actual
    const diferencia = stock_actual - Math.round(EOQ);
    let estadoInventario = '';
    let recomendacion = '';
    let colorEstado = '#059669'; // Verde por defecto
    
    if (diferencia > EOQ * 0.5) {
      estadoInventario = 'EXCESO DE INVENTARIO';
      colorEstado = '#dc2626'; // Rojo
      recomendacion = `Se recomienda reducir el inventario en ${Math.abs(diferencia).toLocaleString('es-ES')} unidades para optimizar costos de almacenamiento.`;
    } else if (diferencia < -EOQ * 0.3) {
      estadoInventario = 'DÉFICIT DE INVENTARIO';
      colorEstado = '#d97706'; // Naranja
      recomendacion = `Se recomienda aumentar el inventario en ${Math.abs(diferencia).toLocaleString('es-ES')} unidades para evitar roturas de stock.`;
    } else {
      estadoInventario = 'NIVEL ÓPTIMO';
      colorEstado = '#059669'; // Verde
      recomendacion = 'El nivel actual de inventario se encuentra dentro del rango óptimo recomendado.';
    }
    
    // Mostrar estado con color
    doc.fontSize(14).fillColor(colorEstado).font('Helvetica-Bold')
      .text(`Estado del Inventario: ${estadoInventario}`, labelCol);
    doc.moveDown(1);
    
    // Mostrar recomendación
    doc.fontSize(11).fillColor('#4a5568').font('Helvetica')
      .text(recomendacion, labelCol, doc.y, { width: 400, align: 'justify' });
    doc.moveDown(2);
    
    // Beneficios esperados
    doc.fontSize(14).fillColor('#2d3748').font('Helvetica-Bold')
      .text('Beneficios Esperados al Implementar EOQ:', labelCol);
    doc.moveDown(1);
    
    const beneficios = [
      'Reducción de costos de almacenamiento y mantenimiento',
      'Optimización del flujo de caja y capital de trabajo',
      'Mejora en la planificación de compras',
      'Reducción del riesgo de obsolescencia',
      'Mayor eficiencia en el uso del espacio'
    ];
    
    doc.fontSize(10).fillColor('#4a5568').font('Helvetica');
    beneficios.forEach(beneficio => {
      doc.text(`• ${beneficio}`, labelCol + 15, doc.y);
      doc.moveDown(0.3);
    });

    doc.moveDown(2);

    // Pie de página
    doc.fontSize(8).fillColor('#a0aec0').font('Helvetica')
      .text('Este reporte ha sido generado automáticamente por el Sistema de Gestión de Inventarios OptiStock', 
            { align: 'center' });
    doc.text('Para mayor información, consulte con el departamento de logística y almacén', 
            { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error al generar reporte EOQ:', error.message);
    res.status(500).json({ error: 'Error al generar el reporte EOQ' });
  }
};

// Generar reporte EOQ masivo
const generarReporteEOQMasivo = async (req, res) => {
  try {
    const productos = await pool.query(`
      SELECT * FROM productos 
      WHERE demanda_anual > 0 AND costo_pedido > 0 AND costo_mantenimiento > 0
      ORDER BY nombre
    `);

    const doc = new PDFDocument({ margin: 60, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_eoq_masivo.pdf"');
    doc.pipe(res);

    // Encabezado principal
    doc.fontSize(24).fillColor('#1a202c').font('Helvetica-Bold')
      .text('REPORTE CONSOLIDADO DE ANÁLISIS EOQ', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor('#4a5568').font('Helvetica')
      .text('Análisis Masivo de Inventarios', { align: 'center' });
    
    // Línea separadora
    doc.moveTo(60, doc.y + 20).lineTo(535, doc.y + 20).stroke();
    doc.moveDown(2);

    // Información del reporte
    doc.fontSize(10).fillColor('#718096').font('Helvetica')
      .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, { align: 'right' });
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, { align: 'right' });
    doc.text(`Total de productos analizados: ${productos.rows.length}`, { align: 'right' });
    doc.moveDown(2);

    // RESUMEN EJECUTIVO
    doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
      .text('RESUMEN EJECUTIVO', { underline: true });
    doc.moveDown(1);
    
    // Calcular estadísticas generales
    let totalEOQ = 0;
    let totalDemandaAnual = 0;
    let totalValorInventario = 0;
    
    productos.rows.forEach(producto => {
      const { demanda_anual: D, costo_pedido: S, costo_mantenimiento: H, stock_actual, costo_unitario } = producto;
      const EOQ = Math.sqrt((2 * D * S) / H);
      totalEOQ += Math.round(EOQ);
      totalDemandaAnual += D;
      totalValorInventario += (stock_actual * costo_unitario);
    });
    
    doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
    doc.text(`Total de productos con EOQ calculado: ${productos.rows.length} productos`);
    doc.text(`Demanda anual total: ${totalDemandaAnual.toLocaleString('es-ES')} unidades`);
    doc.text(`Valor total del inventario analizado: $${totalValorInventario.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
    doc.text(`EOQ total recomendado: ${totalEOQ.toLocaleString('es-ES')} unidades`);
    doc.moveDown(2);

    // DETALLE POR PRODUCTO
    doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
      .text('DETALLE POR PRODUCTO', { underline: true });
    doc.moveDown(1);

    // Encabezados de tabla
    const tableTop = doc.y;
    const col1 = 60;
    const col2 = 200;
    const col3 = 280;
    const col4 = 360;
    const col5 = 440;
    const col6 = 500;
    
    doc.fontSize(9).fillColor('#2d3748').font('Helvetica-Bold');
    doc.text('PRODUCTO', col1, tableTop);
    doc.text('DEMANDA', col2, tableTop);
    doc.text('EOQ', col3, tableTop);
    doc.text('STOCK', col4, tableTop);
    doc.text('ESTADO', col5, tableTop);
    
    // Línea bajo encabezados
    doc.moveTo(col1, tableTop + 15).lineTo(535, tableTop + 15).stroke();
    
    let currentY = tableTop + 25;
    doc.fontSize(8).fillColor('#4a5568').font('Helvetica');

    productos.rows.forEach((producto, index) => {
      // Verificar si necesitamos nueva página
      if (currentY > 720) {
        doc.addPage();
        currentY = 80;
        
        // Repetir encabezados
        doc.fontSize(9).fillColor('#2d3748').font('Helvetica-Bold');
        doc.text('PRODUCTO', col1, currentY - 20);
        doc.text('DEMANDA', col2, currentY - 20);
        doc.text('EOQ', col3, currentY - 20);
        doc.text('STOCK', col4, currentY - 20);
        doc.text('ESTADO', col5, currentY - 20);
        doc.moveTo(col1, currentY - 5).lineTo(535, currentY - 5).stroke();
        doc.fontSize(8).fillColor('#4a5568').font('Helvetica');
      }
      
      const { nombre, demanda_anual: D, costo_pedido: S, costo_mantenimiento: H, stock_actual } = producto;
      const EOQ = Math.sqrt((2 * D * S) / H);
      const diferencia = stock_actual - Math.round(EOQ);
      
      let estado = '';
      if (diferencia > EOQ * 0.3) estado = 'EXCESO';
      else if (diferencia < -EOQ * 0.3) estado = 'DÉFICIT';
      else estado = 'ÓPTIMO';
      
      // Truncar nombre si es muy largo
      const nombreCorto = nombre.length > 25 ? nombre.substring(0, 22) + '...' : nombre;
      
      doc.text(nombreCorto, col1, currentY);
      doc.text(`${D.toLocaleString('es-ES')}`, col2, currentY);
      doc.text(`${Math.round(EOQ).toLocaleString('es-ES')}`, col3, currentY);
      doc.text(`${stock_actual.toLocaleString('es-ES')}`, col4, currentY);
      
      // Color según estado
      if (estado === 'EXCESO') doc.fillColor('#dc2626');
      else if (estado === 'DÉFICIT') doc.fillColor('#ea580c');
      else doc.fillColor('#059669');
      
      doc.text(estado, col5, currentY);
      doc.fillColor('#4a5568'); // Restaurar color
      
      currentY += 15;
      
      // Línea separadora cada 5 productos
      if ((index + 1) % 5 === 0) {
        doc.moveTo(col1, currentY).lineTo(535, currentY).strokeOpacity(0.3).stroke().strokeOpacity(1);
        currentY += 5;
      }
    });

    // Nueva página para recomendaciones
    doc.addPage();
    
    // RECOMENDACIONES GENERALES
    doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
      .text('RECOMENDACIONES GENERALES', { underline: true });
    doc.moveDown(1);
    
    doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
    doc.text('Basado en el análisis EOQ realizado, se recomienda:', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10);
    doc.text('1. PRODUCTOS CON EXCESO DE INVENTARIO:');
    doc.text('   • Implementar estrategias de reducción gradual de stock');
    doc.text('   • Revisar políticas de compras para evitar sobreabastecimiento');
    doc.text('   • Considerar promociones o descuentos para acelerar rotación');
    doc.moveDown(0.5);
    
    doc.text('2. PRODUCTOS CON DÉFICIT DE INVENTARIO:');
    doc.text('   • Incrementar pedidos para alcanzar niveles EOQ recomendados');
    doc.text('   • Revisar lead times con proveedores para mejorar planificación');
    doc.text('   • Establecer stock de seguridad adecuado');
    doc.moveDown(0.5);
    
    doc.text('3. PRODUCTOS EN NIVEL ÓPTIMO:');
    doc.text('   • Mantener políticas actuales de inventario');
    doc.text('   • Monitorear cambios en demanda y costos');
    doc.text('   • Revisar periódicamente los cálculos EOQ');
    doc.moveDown(1);
    
    // METODOLOGÍA
    doc.fontSize(14).fillColor('#2d3748').font('Helvetica-Bold')
      .text('METODOLOGÍA DE CÁLCULO', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10).fillColor('#4a5568').font('Helvetica');
    doc.text('Fórmula EOQ utilizada: EOQ = √(2 × D × S / H)');
    doc.moveDown(0.3);
    doc.text('Donde:');
    doc.text('D = Demanda anual (unidades)');
    doc.text('S = Costo por pedido ($)');
    doc.text('H = Costo de mantenimiento por unidad por año ($)');
    doc.moveDown(1);
    
    // Pie de página
    doc.fontSize(8).fillColor('#a0aec0').font('Helvetica')
      .text('Este reporte ha sido generado automáticamente por el Sistema de Gestión de Inventarios OptiStock', 
            { align: 'center' });
    doc.text('Para mayor información, consulte con el departamento de logística y almacén', 
            { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error al generar reporte EOQ masivo:', error.message);
    res.status(500).json({ error: 'Error al generar el reporte EOQ masivo' });
  }
};

// Generar alertas de stock alto
const generarAlertasStockAlto = async (req, res) => {
  try {
    // Obtener productos con stock alto (más de 2 veces el EOQ óptimo)
    const alertas = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        p.categoria,
        p.stock_actual,
        p.demanda_anual,
        p.costo_pedido,
        p.costo_mantenimiento,
        p.costo_unitario,
        SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) as eoq_optimo,
        p.stock_actual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) as ratio_stock_eoq,
        (p.stock_actual * p.costo_unitario) as valor_inventario_actual,
        (SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) * p.costo_unitario) as valor_inventario_optimo
      FROM productos p
      WHERE p.demanda_anual > 0 
        AND p.costo_pedido > 0 
        AND p.costo_mantenimiento > 0
        AND p.stock_actual > (2 * SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento))
      ORDER BY 
        (p.stock_actual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento)) DESC
    `);

    const alertasFormateadas = alertas.rows.map(alerta => {
      const exceso = alerta.stock_actual - Math.round(alerta.eoq_optimo);
      const valorExceso = exceso * alerta.costo_unitario;
      const porcentajeExceso = ((alerta.ratio_stock_eoq - 1) * 100);
      
      let nivelSeveridad = 'BAJO';
      if (alerta.ratio_stock_eoq > 5) nivelSeveridad = 'CRÍTICO';
      else if (alerta.ratio_stock_eoq > 3) nivelSeveridad = 'ALTO';
      else if (alerta.ratio_stock_eoq > 2) nivelSeveridad = 'MEDIO';

      return {
        id: alerta.id,
        nombre: alerta.nombre,
        categoria: alerta.categoria,
        stock_actual: alerta.stock_actual,
        eoq_optimo: Math.round(alerta.eoq_optimo),
        exceso_unidades: exceso,
        valor_exceso: Math.round(valorExceso),
        porcentaje_exceso: Math.round(porcentajeExceso * 100) / 100,
        nivel_severidad: nivelSeveridad,
        valor_inventario_actual: Math.round(alerta.valor_inventario_actual),
        valor_inventario_optimo: Math.round(alerta.valor_inventario_optimo),
        ahorro_potencial: Math.round(valorExceso)
      };
    });

    // Estadísticas resumen
    const totalProductos = alertasFormateadas.length;
    const valorTotalExceso = alertasFormateadas.reduce((sum, a) => sum + a.valor_exceso, 0);
    const ahorroTotalPotencial = alertasFormateadas.reduce((sum, a) => sum + a.ahorro_potencial, 0);
    
    const alertasPorSeveridad = {
      CRÍTICO: alertasFormateadas.filter(a => a.nivel_severidad === 'CRÍTICO'),
      ALTO: alertasFormateadas.filter(a => a.nivel_severidad === 'ALTO'),
      MEDIO: alertasFormateadas.filter(a => a.nivel_severidad === 'MEDIO'),
      BAJO: alertasFormateadas.filter(a => a.nivel_severidad === 'BAJO')
    };

    res.status(200).json({
      resumen: {
        total_productos: totalProductos,
        valor_total_exceso: valorTotalExceso,
        ahorro_total_potencial: ahorroTotalPotencial,
        productos_por_severidad: {
          CRÍTICO: alertasPorSeveridad.CRÍTICO.length,
          ALTO: alertasPorSeveridad.ALTO.length,
          MEDIO: alertasPorSeveridad.MEDIO.length,
          BAJO: alertasPorSeveridad.BAJO.length
        }
      },
      alertas_por_severidad: alertasPorSeveridad,
      alertas: alertasFormateadas
    });

  } catch (error) {
    console.error('Error al generar alertas de stock alto:', error.message);
    res.status(500).json({ error: 'Error al generar alertas de stock alto' });
  }
};

// Obtener recomendaciones de optimización
const obtenerRecomendacionesOptimizacion = async (req, res) => {
  try {
    // Obtener productos con oportunidades de optimización
    const recomendaciones = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        p.categoria,
        p.stock_actual,
        p.stock_minimo,
        p.demanda_anual,
        p.costo_pedido,
        p.costo_mantenimiento,
        p.costo_unitario,
        SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) as eoq_optimo,
        ((p.demanda_anual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento)) * p.costo_pedido) + 
        ((SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) / 2) * p.costo_mantenimiento) as costo_total_optimo,
        (p.demanda_anual / 365.0) as demanda_diaria,
        (365 / (p.demanda_anual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento))) as dias_entre_pedidos
      FROM productos p
      WHERE p.demanda_anual > 0 
        AND p.costo_pedido > 0 
        AND p.costo_mantenimiento > 0
      ORDER BY p.nombre
    `);

    const recomendacionesFormateadas = recomendaciones.rows.map(rec => {
      const eoqOptimo = Math.round(rec.eoq_optimo);
      const diferencia = rec.stock_actual - eoqOptimo;
      const demandaDiaria = Math.round(rec.demanda_diaria * 100) / 100;
      const diasEntrePedidos = Math.round(rec.dias_entre_pedidos);
      
      let prioridad = 'BAJA';
      let accionRecomendada = '';
      let impactoFinanciero = 0;
      
      if (rec.stock_actual <= rec.stock_minimo) {
        prioridad = 'ALTA';
        accionRecomendada = `¡URGENTE! Stock crítico. Pedir ${eoqOptimo} unidades inmediatamente.`;
        impactoFinanciero = (rec.stock_minimo - rec.stock_actual) * rec.costo_unitario;
      } else if (diferencia > eoqOptimo) {
        prioridad = 'MEDIA';
        accionRecomendada = `Reducir inventario. Exceso de ${Math.abs(diferencia)} unidades.`;
        impactoFinanciero = Math.abs(diferencia) * rec.costo_unitario * 0.1; // 10% del valor en costos de mantenimiento
      } else if (diferencia < -eoqOptimo * 0.5) {
        prioridad = 'MEDIA';
        accionRecomendada = `Aumentar inventario. Déficit de ${Math.abs(diferencia)} unidades.`;
        impactoFinanciero = Math.abs(diferencia) * rec.costo_unitario * 0.05; // 5% del valor en costos de oportunidad
      } else {
        accionRecomendada = `Nivel óptimo. Mantener entre ${Math.round(eoqOptimo * 0.8)} y ${Math.round(eoqOptimo * 1.2)} unidades.`;
      }

      return {
        id: rec.id,
        nombre: rec.nombre,
        categoria: rec.categoria,
        stock_actual: rec.stock_actual,
        stock_minimo: rec.stock_minimo,
        eoq_optimo: eoqOptimo,
        diferencia_eoq: diferencia,
        prioridad: prioridad,
        accion_recomendada: accionRecomendada,
        impacto_financiero: Math.round(impactoFinanciero),
        demanda_diaria: demandaDiaria,
        dias_entre_pedidos: diasEntrePedidos,
        costo_total_optimo: Math.round(rec.costo_total_optimo),
        valor_inventario_actual: Math.round(rec.stock_actual * rec.costo_unitario)
      };
    });

    // Agrupar por prioridad
    const recomendacionesPorPrioridad = {
      ALTA: recomendacionesFormateadas.filter(r => r.prioridad === 'ALTA'),
      MEDIA: recomendacionesFormateadas.filter(r => r.prioridad === 'MEDIA'),
      BAJA: recomendacionesFormateadas.filter(r => r.prioridad === 'BAJA')
    };

    // Estadísticas
    const impactoTotalFinanciero = recomendacionesFormateadas.reduce((sum, r) => sum + r.impacto_financiero, 0);
    const valorTotalInventario = recomendacionesFormateadas.reduce((sum, r) => sum + r.valor_inventario_actual, 0);

    res.status(200).json({
      resumen: {
        total_productos: recomendacionesFormateadas.length,
        productos_por_prioridad: {
          ALTA: recomendacionesPorPrioridad.ALTA.length,
          MEDIA: recomendacionesPorPrioridad.MEDIA.length,
          BAJA: recomendacionesPorPrioridad.BAJA.length
        },
        impacto_total_financiero: impactoTotalFinanciero,
        valor_total_inventario: valorTotalInventario
      },
      recomendaciones_por_prioridad: recomendacionesPorPrioridad,
      recomendaciones: recomendacionesFormateadas
    });

  } catch (error) {
    console.error('Error al obtener recomendaciones:', error.message);
    res.status(500).json({ error: 'Error al obtener recomendaciones de optimización' });
  }
};

// Análisis completo del inventario
const analisisInventarioCompleto = async (req, res) => {
  try {
    // Obtener todos los productos con datos completos
    const productos = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        p.categoria,
        p.stock_actual,
        p.stock_minimo,
        p.demanda_anual,
        p.costo_pedido,
        p.costo_mantenimiento,
        p.costo_unitario,
        SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) as eoq_optimo,
        (p.stock_actual * p.costo_unitario) as valor_inventario,
        ((p.demanda_anual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento)) * p.costo_pedido) + 
        ((SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) / 2) * p.costo_mantenimiento) as costo_total_optimo
      FROM productos p
      WHERE p.demanda_anual > 0 
        AND p.costo_pedido > 0 
        AND p.costo_mantenimiento > 0
      ORDER BY (p.stock_actual * p.costo_unitario) DESC
    `);

    if (productos.rows.length === 0) {
      return res.status(200).json({
        mensaje: 'No hay productos con datos suficientes para el análisis',
        analisis_abc: { A: [], B: [], C: [] },
        metricas_generales: {
          total_productos: 0,
          valor_total_inventario: 0,
          productos_criticos: 0,
          productos_optimos: 0
        }
      });
    }

    // Calcular valor total del inventario
    const valorTotalInventario = productos.rows.reduce((sum, p) => sum + parseFloat(p.valor_inventario), 0);
    
    // Análisis ABC (por valor de inventario)
    const productosOrdenados = productos.rows.map(p => ({
      ...p,
      eoq_optimo: Math.round(p.eoq_optimo),
      valor_inventario: Math.round(p.valor_inventario),
      costo_total_optimo: Math.round(p.costo_total_optimo),
      porcentaje_valor: (parseFloat(p.valor_inventario) / valorTotalInventario) * 100
    }));

    let acumulado = 0;
    const analisisABC = { A: [], B: [], C: [] };
    
    productosOrdenados.forEach(producto => {
      acumulado += producto.porcentaje_valor;
      
      if (acumulado <= 80) {
        analisisABC.A.push(producto);
      } else if (acumulado <= 95) {
        analisisABC.B.push(producto);
      } else {
        analisisABC.C.push(producto);
      }
    });

    // Métricas generales
    const productosCriticos = productos.rows.filter(p => p.stock_actual <= p.stock_minimo).length;
    const productosConExceso = productos.rows.filter(p => p.stock_actual > (2 * Math.round(p.eoq_optimo))).length;
    const productosOptimos = productos.rows.filter(p => {
      const eoq = Math.round(p.eoq_optimo);
      return p.stock_actual > p.stock_minimo && p.stock_actual <= (2 * eoq);
    }).length;

    // Estadísticas por categoría
    const categorias = [...new Set(productos.rows.map(p => p.categoria))].filter(Boolean);
    const estadisticasCategorias = categorias.map(categoria => {
      const productosCategoria = productos.rows.filter(p => p.categoria === categoria);
      const valorCategoria = productosCategoria.reduce((sum, p) => sum + parseFloat(p.valor_inventario), 0);
      
      return {
        categoria: categoria,
        cantidad_productos: productosCategoria.length,
        valor_inventario: Math.round(valorCategoria),
        porcentaje_total: Math.round((valorCategoria / valorTotalInventario) * 100 * 100) / 100
      };
    });

    // Calcular rotación promedio del inventario
    const rotacionPromedio = productos.rows.reduce((sum, p) => {
      const rotacion = p.stock_actual > 0 ? p.demanda_anual / p.stock_actual : 0;
      return sum + rotacion;
    }, 0) / productos.rows.length;

    res.status(200).json({
      analisis_abc: analisisABC,
      metricas_generales: {
        total_productos: productos.rows.length,
        valor_total_inventario: Math.round(valorTotalInventario),
        productos_criticos: productosCriticos,
        productos_con_exceso: productosConExceso,
        productos_optimos: productosOptimos,
        rotacion_promedio: Math.round(rotacionPromedio * 100) / 100
      },
      estadisticas_categorias: estadisticasCategorias,
      resumen_abc: {
        categoria_A: {
          productos: analisisABC.A.length,
          valor: Math.round(analisisABC.A.reduce((sum, p) => sum + p.valor_inventario, 0)),
          porcentaje: '80% del valor'
        },
        categoria_B: {
          productos: analisisABC.B.length,
          valor: Math.round(analisisABC.B.reduce((sum, p) => sum + p.valor_inventario, 0)),
          porcentaje: '15% del valor'
        },
        categoria_C: {
          productos: analisisABC.C.length,
          valor: Math.round(analisisABC.C.reduce((sum, p) => sum + p.valor_inventario, 0)),
          porcentaje: '5% del valor'
        }
      }
    });

  } catch (error) {
    console.error('Error en análisis completo del inventario:', error.message);
    res.status(500).json({ error: 'Error al realizar el análisis completo del inventario' });
  }
};

// Generar reporte PDF de alertas de stock alto
const generarReporteAlertasStockAlto = async (req, res) => {
  try {
    // Obtener las mismas alertas que la función generarAlertasStockAlto
    const alertas = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        p.categoria,
        p.stock_actual,
        p.demanda_anual,
        p.costo_pedido,
        p.costo_mantenimiento,
        p.costo_unitario,
        SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) as eoq_optimo,
        p.stock_actual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) as ratio_stock_eoq,
        (p.stock_actual * p.costo_unitario) as valor_inventario_actual,
        (SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) * p.costo_unitario) as valor_inventario_optimo
      FROM productos p
      WHERE p.demanda_anual > 0 
        AND p.costo_pedido > 0 
        AND p.costo_mantenimiento > 0
        AND p.stock_actual > (2 * SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento))
      ORDER BY 
        (p.stock_actual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento)) DESC
    `);

    const alertasFormateadas = alertas.rows.map(alerta => {
      const exceso = alerta.stock_actual - Math.round(alerta.eoq_optimo);
      const valorExceso = exceso * alerta.costo_unitario;
      const porcentajeExceso = ((alerta.ratio_stock_eoq - 1) * 100);
      
      let nivelSeveridad = 'BAJO';
      if (alerta.ratio_stock_eoq > 5) nivelSeveridad = 'CRÍTICO';
      else if (alerta.ratio_stock_eoq > 3) nivelSeveridad = 'ALTO';
      else if (alerta.ratio_stock_eoq > 2) nivelSeveridad = 'MEDIO';

      return {
        id: alerta.id,
        nombre: alerta.nombre,
        categoria: alerta.categoria,
        stock_actual: alerta.stock_actual,
        eoq_optimo: Math.round(alerta.eoq_optimo),
        exceso_unidades: exceso,
        valor_exceso: Math.round(valorExceso),
        porcentaje_exceso: Math.round(porcentajeExceso * 100) / 100,
        nivel_severidad: nivelSeveridad,
        valor_inventario_actual: Math.round(alerta.valor_inventario_actual),
        valor_inventario_optimo: Math.round(alerta.valor_inventario_optimo),
        ahorro_potencial: Math.round(valorExceso)
      };
    });

    const doc = new PDFDocument({ margin: 60, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_alertas_stock_alto.pdf"');
    doc.pipe(res);

    // Encabezado principal
    doc.fontSize(24).fillColor('#1a202c').font('Helvetica-Bold')
      .text('REPORTE DE ALERTAS DE STOCK ALTO', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor('#4a5568').font('Helvetica')
      .text('Análisis de Excesos de Inventario', { align: 'center' });
    
    // Línea separadora
    doc.moveTo(60, doc.y + 20).lineTo(535, doc.y + 20).stroke();
    doc.moveDown(2);

    // Información del reporte
    doc.fontSize(10).fillColor('#718096').font('Helvetica')
      .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, { align: 'right' });
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, { align: 'right' });
    doc.text(`Total de alertas generadas: ${alertasFormateadas.length}`, { align: 'right' });
    doc.moveDown(2);

    if (alertasFormateadas.length === 0) {
      doc.fontSize(14).fillColor('#059669').font('Helvetica-Bold')
        .text('No se encontraron productos con exceso de inventario.', { align: 'center' });
      doc.fontSize(11).fillColor('#4a5568').font('Helvetica')
        .text('Todos los productos mantienen niveles de stock dentro de los parámetros óptimos.', { align: 'center' });
    } else {
      // RESUMEN EJECUTIVO
      doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
        .text('RESUMEN EJECUTIVO', { underline: true });
      doc.moveDown(1);
      
      const valorTotalExceso = alertasFormateadas.reduce((sum, a) => sum + a.valor_exceso, 0);
      const ahorroTotalPotencial = alertasFormateadas.reduce((sum, a) => sum + a.ahorro_potencial, 0);
      
      const alertasPorSeveridad = {
        CRÍTICO: alertasFormateadas.filter(a => a.nivel_severidad === 'CRÍTICO').length,
        ALTO: alertasFormateadas.filter(a => a.nivel_severidad === 'ALTO').length,
        MEDIO: alertasFormateadas.filter(a => a.nivel_severidad === 'MEDIO').length,
        BAJO: alertasFormateadas.filter(a => a.nivel_severidad === 'BAJO').length
      };
      
      doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
      doc.text(`Productos con exceso de inventario: ${alertasFormateadas.length}`);
      doc.text(`Valor total del exceso: $${valorTotalExceso.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
      doc.text(`Ahorro potencial estimado: $${ahorroTotalPotencial.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
      doc.moveDown(1);
      
      // Distribución por severidad
      doc.fontSize(12).fillColor('#2d3748').font('Helvetica-Bold')
        .text('Distribución por Nivel de Severidad:');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
      doc.text(`• Crítico: ${alertasPorSeveridad.CRÍTICO} productos`);
      doc.text(`• Alto: ${alertasPorSeveridad.ALTO} productos`);
      doc.text(`• Medio: ${alertasPorSeveridad.MEDIO} productos`);
      doc.text(`• Bajo: ${alertasPorSeveridad.BAJO} productos`);
      doc.moveDown(2);

      // DETALLE DE ALERTAS
      doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
        .text('DETALLE DE ALERTAS POR PRODUCTO', { underline: true });
      doc.moveDown(1);

      alertasFormateadas.forEach((alerta, index) => {
        // Verificar si necesitamos nueva página
        if (doc.y > 650) {
          doc.addPage();
        }
        
        // Rectángulo para cada producto
        const boxY = doc.y;
        let boxColor = '#f7fafc';
        let borderColor = '#e2e8f0';
        
        if (alerta.nivel_severidad === 'CRÍTICO') {
          boxColor = '#fef2f2';
          borderColor = '#fca5a5';
        } else if (alerta.nivel_severidad === 'ALTO') {
          boxColor = '#fff7ed';
          borderColor = '#fed7aa';
        } else if (alerta.nivel_severidad === 'MEDIO') {
          boxColor = '#fefce8';
          borderColor = '#fde047';
        }
        
        doc.rect(60, boxY, 475, 80).fillAndStroke(boxColor, borderColor);
        
        // Información del producto
        doc.fontSize(14).fillColor('#1a202c').font('Helvetica-Bold')
          .text(`${index + 1}. ${alerta.nombre}`, 70, boxY + 10);
        
        doc.fontSize(10).fillColor('#4a5568').font('Helvetica')
          .text(`Categoría: ${alerta.categoria}`, 70, boxY + 28);
        
        // Datos de severidad
        doc.fontSize(12).fillColor('#dc2626').font('Helvetica-Bold')
          .text(`Severidad: ${alerta.nivel_severidad}`, 400, boxY + 10);
        
        // Métricas
        doc.fontSize(9).fillColor('#374151').font('Helvetica');
        doc.text(`Stock Actual: ${alerta.stock_actual.toLocaleString('es-ES')} unidades`, 70, boxY + 45);
        doc.text(`EOQ Óptimo: ${alerta.eoq_optimo.toLocaleString('es-ES')} unidades`, 200, boxY + 45);
        doc.text(`Exceso: ${alerta.exceso_unidades.toLocaleString('es-ES')} unidades`, 330, boxY + 45);
        
        doc.text(`Valor Exceso: $${alerta.valor_exceso.toLocaleString('es-ES')}`, 70, boxY + 60);
        doc.text(`Ahorro Potencial: $${alerta.ahorro_potencial.toLocaleString('es-ES')}`, 200, boxY + 60);
        doc.text(`% sobre óptimo: ${alerta.porcentaje_exceso.toFixed(1)}%`, 330, boxY + 60);
        
        doc.moveDown(6);
      });

      // Nueva página para recomendaciones
      doc.addPage();
      
      // RECOMENDACIONES
      doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
        .text('RECOMENDACIONES ESTRATÉGICAS', { underline: true });
      doc.moveDown(1);
      
      doc.fontSize(12).fillColor('#2d3748').font('Helvetica-Bold')
        .text('ACCIONES INMEDIATAS:');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
      doc.text('1. Productos con severidad CRÍTICA:', { underline: true });
      doc.text('   • Implementar descuentos agresivos para acelerar rotación');
      doc.text('   • Suspender temporalmente nuevos pedidos');
      doc.text('   • Evaluar posibilidad de devolución a proveedores');
      doc.moveDown(0.5);
      
      doc.text('2. Productos con severidad ALTA y MEDIA:', { underline: true });
      doc.text('   • Ajustar políticas de compra para reducir cantidades');
      doc.text('   • Implementar promociones especiales');
      doc.text('   • Revisar proyecciones de demanda');
      doc.moveDown(1);
      
      doc.fontSize(12).fillColor('#2d3748').font('Helvetica-Bold')
        .text('ACCIONES A MEDIANO PLAZO:');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
      doc.text('• Mejorar sistemas de pronóstico de demanda');
      doc.text('• Establecer controles más estrictos en el proceso de compras');
      doc.text('• Implementar revisiones periódicas de niveles de inventario');
      doc.text('• Capacitar al personal en gestión de inventarios basada en EOQ');
      doc.moveDown(1);
      
      doc.fontSize(12).fillColor('#2d3748').font('Helvetica-Bold')
        .text('BENEFICIOS ESPERADOS:');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
      doc.text(`• Liberación de capital por valor de $${ahorroTotalPotencial.toLocaleString('es-ES')}`);
      doc.text('• Reducción de costos de almacenamiento y mantenimiento');
      doc.text('• Optimización del espacio de almacén');
      doc.text('• Mejora en la rotación de inventarios');
    }

    // Pie de página
    doc.fontSize(8).fillColor('#a0aec0').font('Helvetica')
      .text('Este reporte ha sido generado automáticamente por el Sistema de Gestión de Inventarios OptiStock', 
            { align: 'center' });
    doc.text('Para mayor información, consulte con el departamento de logística y almacén', 
            { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error al generar reporte de alertas:', error.message);
    res.status(500).json({ error: 'Error al generar el reporte de alertas de stock alto' });
  }
};

// Generar reporte PDF de recomendaciones de optimización
const generarReporteRecomendaciones = async (req, res) => {
  try {
    // Obtener recomendaciones usando la misma lógica que obtenerRecomendacionesOptimizacion
    const recomendaciones = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        p.categoria,
        p.stock_actual,
        p.stock_minimo,
        p.demanda_anual,
        p.costo_pedido,
        p.costo_mantenimiento,
        p.costo_unitario,
        SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) as eoq_optimo,
        ((p.demanda_anual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento)) * p.costo_pedido) + 
        ((SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) / 2) * p.costo_mantenimiento) as costo_total_optimo,
        (p.demanda_anual / 365.0) as demanda_diaria,
        (365 / (p.demanda_anual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento))) as dias_entre_pedidos
      FROM productos p
      WHERE p.demanda_anual > 0 
        AND p.costo_pedido > 0 
        AND p.costo_mantenimiento > 0
      ORDER BY p.nombre
    `);

    const recomendacionesFormateadas = recomendaciones.rows.map(rec => {
      const eoqOptimo = Math.round(rec.eoq_optimo);
      const diferencia = rec.stock_actual - eoqOptimo;
      const demandaDiaria = Math.round(rec.demanda_diaria * 100) / 100;
      const diasEntrePedidos = Math.round(rec.dias_entre_pedidos);
      
      let prioridad = 'BAJA';
      let accionRecomendada = '';
      let impactoFinanciero = 0;
      
      if (rec.stock_actual <= rec.stock_minimo) {
        prioridad = 'ALTA';
        accionRecomendada = `¡URGENTE! Stock crítico. Pedir ${eoqOptimo} unidades inmediatamente.`;
        impactoFinanciero = (rec.stock_minimo - rec.stock_actual) * rec.costo_unitario;
      } else if (diferencia > eoqOptimo) {
        prioridad = 'MEDIA';
        accionRecomendada = `Reducir inventario. Exceso de ${Math.abs(diferencia)} unidades.`;
        impactoFinanciero = Math.abs(diferencia) * rec.costo_unitario * 0.1;
      } else if (diferencia < -eoqOptimo * 0.5) {
        prioridad = 'MEDIA';
        accionRecomendada = `Aumentar inventario. Déficit de ${Math.abs(diferencia)} unidades.`;
        impactoFinanciero = Math.abs(diferencia) * rec.costo_unitario * 0.05;
      } else {
        accionRecomendada = `Nivel óptimo. Mantener entre ${Math.round(eoqOptimo * 0.8)} y ${Math.round(eoqOptimo * 1.2)} unidades.`;
      }

      return {
        id: rec.id,
        nombre: rec.nombre,
        categoria: rec.categoria,
        stock_actual: rec.stock_actual,
        stock_minimo: rec.stock_minimo,
        eoq_optimo: eoqOptimo,
        diferencia_eoq: diferencia,
        prioridad: prioridad,
        accion_recomendada: accionRecomendada,
        impacto_financiero: Math.round(impactoFinanciero),
        demanda_diaria: demandaDiaria,
        dias_entre_pedidos: diasEntrePedidos,
        costo_total_optimo: Math.round(rec.costo_total_optimo),
        valor_inventario_actual: Math.round(rec.stock_actual * rec.costo_unitario)
      };
    });

    // Agrupar por prioridad
    const recomendacionesPorPrioridad = {
      ALTA: recomendacionesFormateadas.filter(r => r.prioridad === 'ALTA'),
      MEDIA: recomendacionesFormateadas.filter(r => r.prioridad === 'MEDIA'),
      BAJA: recomendacionesFormateadas.filter(r => r.prioridad === 'BAJA')
    };

    const doc = new PDFDocument({ margin: 60, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_recomendaciones_optimizacion.pdf"');
    doc.pipe(res);

    // Encabezado principal
    doc.fontSize(24).fillColor('#1a202c').font('Helvetica-Bold')
      .text('REPORTE DE RECOMENDACIONES DE OPTIMIZACIÓN', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor('#4a5568').font('Helvetica')
      .text('Análisis Estratégico de Inventarios EOQ', { align: 'center' });
    
    // Línea separadora
    doc.moveTo(60, doc.y + 20).lineTo(535, doc.y + 20).stroke();
    doc.moveDown(2);

    // Información del reporte
    doc.fontSize(10).fillColor('#718096').font('Helvetica')
      .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, { align: 'right' });
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, { align: 'right' });
    doc.text(`Total de productos analizados: ${recomendacionesFormateadas.length}`, { align: 'right' });
    doc.moveDown(2);

    // RESUMEN EJECUTIVO
    doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
      .text('RESUMEN EJECUTIVO', { underline: true });
    doc.moveDown(1);
    
    const impactoTotalFinanciero = recomendacionesFormateadas.reduce((sum, r) => sum + r.impacto_financiero, 0);
    const valorTotalInventario = recomendacionesFormateadas.reduce((sum, r) => sum + r.valor_inventario_actual, 0);
    
    doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
    doc.text(`Total de productos evaluados: ${recomendacionesFormateadas.length}`);
    doc.text(`Valor total del inventario: $${valorTotalInventario.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
    doc.text(`Impacto financiero estimado: $${impactoTotalFinanciero.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
    doc.moveDown(1);
    
    // Distribución por prioridad
    doc.fontSize(12).fillColor('#2d3748').font('Helvetica-Bold')
      .text('Distribución por Prioridad de Acción:');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
    doc.text(`• Alta Prioridad: ${recomendacionesPorPrioridad.ALTA.length} productos (requieren acción inmediata)`);
    doc.text(`• Media Prioridad: ${recomendacionesPorPrioridad.MEDIA.length} productos (requieren atención)`);
    doc.text(`• Baja Prioridad: ${recomendacionesPorPrioridad.BAJA.length} productos (mantener seguimiento)`);
    doc.moveDown(2);

    // RECOMENDACIONES POR PRIORIDAD
    ['ALTA', 'MEDIA', 'BAJA'].forEach((prioridad) => {
      if (recomendacionesPorPrioridad[prioridad].length > 0) {
        // Verificar espacio para nueva sección
        if (doc.y > 600) {
          doc.addPage();
        }

        doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
          .text(`PRODUCTOS DE PRIORIDAD ${prioridad}`, { underline: true });
        doc.moveDown(1);

        recomendacionesPorPrioridad[prioridad].forEach((rec, index) => {
          // Verificar si necesitamos nueva página
          if (doc.y > 650) {
            doc.addPage();
          }
          
          // Rectángulo para cada producto
          const boxY = doc.y;
          let boxColor = '#f7fafc';
          let borderColor = '#e2e8f0';
          
          if (prioridad === 'ALTA') {
            boxColor = '#fef2f2';
            borderColor = '#fca5a5';
          } else if (prioridad === 'MEDIA') {
            boxColor = '#fff7ed';
            borderColor = '#fed7aa';
          } else {
            boxColor = '#f0fff4';
            borderColor = '#9ae6b4';
          }
          
          doc.rect(60, boxY, 475, 100).fillAndStroke(boxColor, borderColor);
          
          // Información del producto
          doc.fontSize(14).fillColor('#1a202c').font('Helvetica-Bold')
            .text(`${rec.nombre}`, 70, boxY + 10);
          
          doc.fontSize(10).fillColor('#4a5568').font('Helvetica')
            .text(`Categoría: ${rec.categoria}`, 70, boxY + 28);
          
          // Métricas principales
          doc.fontSize(9).fillColor('#374151').font('Helvetica');
          doc.text(`Stock Actual: ${rec.stock_actual.toLocaleString('es-ES')} unidades`, 70, boxY + 45);
          doc.text(`Stock Mínimo: ${rec.stock_minimo.toLocaleString('es-ES')} unidades`, 200, boxY + 45);
          doc.text(`EOQ Óptimo: ${rec.eoq_optimo.toLocaleString('es-ES')} unidades`, 330, boxY + 45);
          
          doc.text(`Diferencia EOQ: ${rec.diferencia_eoq > 0 ? '+' : ''}${rec.diferencia_eoq.toLocaleString('es-ES')}`, 70, boxY + 60);
          doc.text(`Demanda Diaria: ${rec.demanda_diaria} unidades`, 200, boxY + 60);
          doc.text(`Días entre Pedidos: ${rec.dias_entre_pedidos}`, 330, boxY + 60);
          
          // Acción recomendada
          doc.fontSize(10).fillColor('#2d3748').font('Helvetica-Bold')
            .text('Acción Recomendada:', 70, boxY + 75);
          doc.fontSize(9).fillColor('#4a5568').font('Helvetica')
            .text(rec.accion_recomendada, 70, boxY + 88, { width: 400 });
          
          doc.moveDown(7);
        });

        doc.moveDown(1);
      }
    });

    // Nueva página para plan de implementación
    doc.addPage();
    
    // PLAN DE IMPLEMENTACIÓN
    doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
      .text('PLAN DE IMPLEMENTACIÓN RECOMENDADO', { underline: true });
    doc.moveDown(1);
    
    if (recomendacionesPorPrioridad.ALTA.length > 0) {
      doc.fontSize(12).fillColor('#dc2626').font('Helvetica-Bold')
        .text('FASE 1: ACCIONES INMEDIATAS (1-7 días)');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
      doc.text(`• Atender ${recomendacionesPorPrioridad.ALTA.length} productos de alta prioridad`);
      doc.text('• Realizar pedidos urgentes para productos con stock crítico');
      doc.text('• Implementar control diario de niveles críticos');
      doc.text('• Notificar a proveedores sobre pedidos urgentes');
      doc.moveDown(1);
    }
    
    if (recomendacionesPorPrioridad.MEDIA.length > 0) {
      doc.fontSize(12).fillColor('#ea580c').font('Helvetica-Bold')
        .text('FASE 2: ACCIONES A CORTO PLAZO (1-4 semanas)');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
      doc.text(`• Ajustar políticas de inventario para ${recomendacionesPorPrioridad.MEDIA.length} productos`);
      doc.text('• Revisar y actualizar niveles de stock mínimo');
      doc.text('• Implementar sistema de alertas automáticas');
      doc.text('• Capacitar al equipo en nuevos procedimientos EOQ');
      doc.moveDown(1);
    }
    
    doc.fontSize(12).fillColor('#059669').font('Helvetica-Bold')
      .text('FASE 3: MONITOREO Y MEJORA CONTINUA (mensual)');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
    doc.text('• Revisar mensualmente los cálculos EOQ');
    doc.text('• Analizar variaciones en la demanda y costos');
    doc.text('• Ajustar parámetros según cambios del mercado');
    doc.text('• Generar reportes de seguimiento y mejora');
    doc.moveDown(2);
    
    // BENEFICIOS ESPERADOS
    doc.fontSize(16).fillColor('#2d3748').font('Helvetica-Bold')
      .text('BENEFICIOS ESPERADOS', { underline: true });
    doc.moveDown(1);
    
    doc.fontSize(11).fillColor('#4a5568').font('Helvetica');
    doc.text('Al implementar estas recomendaciones, se espera obtener:');
    doc.moveDown(0.5);
    
    doc.fontSize(10);
    doc.text('• Reducción de costos de inventario entre 10-25%');
    doc.text('• Mejora en la rotación de inventarios');
    doc.text('• Disminución de productos obsoletos y vencidos');
    doc.text('• Optimización del capital de trabajo');
    doc.text('• Mejora en el nivel de servicio al cliente');
    doc.text('• Reducción de espacios de almacenamiento requeridos');
    doc.text(`• Impacto financiero positivo estimado: $${impactoTotalFinanciero.toLocaleString('es-ES')}`);

    // Pie de página
    doc.fontSize(8).fillColor('#a0aec0').font('Helvetica')
      .text('Este reporte ha sido generado automáticamente por el Sistema de Gestión de Inventarios OptiStock', 
            { align: 'center' });
    doc.text('Para mayor información, consulte con el departamento de logística y almacén', 
            { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error al generar reporte de recomendaciones:', error.message);
    res.status(500).json({ error: 'Error al generar el reporte de recomendaciones' });
  }
};

module.exports = { 
  calcularEOQ,
  obtenerHistorialEOQ,
  obtenerRecomendacionEOQ,
  generarReporteEOQ, 
  generarReporteEOQMasivo,
  generarAlertasStockAlto,
  generarReporteAlertasStockAlto,
  generarReporteRecomendaciones,
  obtenerRecomendacionesOptimizacion,
  analisisInventarioCompleto
};
