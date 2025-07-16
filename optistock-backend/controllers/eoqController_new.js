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

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    const safeFilename = encodeURIComponent(`reporte_eoq_${nombre.replace(/\s+/g, '_')}.pdf`);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).fillColor('#2563eb')
      .text('REPORTE DE CÁLCULO EOQ', { align: 'center', underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#6B7280')
      .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    doc.moveDown(2);

    // Datos del producto
    doc.fontSize(16).fillColor('#1F2937').text('DATOS DEL PRODUCTO', { underline: true });
    doc.moveDown(0.8);
    doc.fontSize(11).fillColor('#374151');
    doc.text(`• Nombre: ${nombre}`);
    doc.text(`• Categoría: ${categoria || 'No especificada'}`);
    doc.text(`• Stock actual: ${stock_actual} unidades`);
    doc.text(`• EOQ calculado: ${Math.round(EOQ)} unidades`);
    doc.text(`• Frecuencia de pedidos: ${frecuencia_pedidos.toFixed(1)} veces/año`);
    doc.text(`• Días entre pedidos: ${dias_entre_pedidos} días`);

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

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_eoq_masivo.pdf"');
    doc.pipe(res);

    doc.fontSize(20).fillColor('#2563eb')
      .text('REPORTE EOQ MASIVO', { align: 'center', underline: true });
    doc.moveDown(2);

    productos.rows.forEach((producto, index) => {
      if (index > 0) doc.addPage();
      
      const { nombre, demanda_anual: D, costo_pedido: S, costo_mantenimiento: H } = producto;
      const EOQ = Math.sqrt((2 * D * S) / H);

      doc.fontSize(14).fillColor('#1F2937').text(`${index + 1}. ${nombre}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#374151');
      doc.text(`EOQ: ${Math.round(EOQ)} unidades`);
      doc.text(`Demanda anual: ${D} unidades`);
    });

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

module.exports = { 
  calcularEOQ,
  obtenerHistorialEOQ,
  obtenerRecomendacionEOQ,
  generarReporteEOQ, 
  generarReporteEOQMasivo,
  generarAlertasStockAlto,
  obtenerRecomendacionesOptimizacion
};
