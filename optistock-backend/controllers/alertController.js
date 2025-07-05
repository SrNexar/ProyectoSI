const pool = require('../models/db');
const nodemailer = require('nodemailer');

// Configurar transporter de email (opcional)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Obtener todas las alertas activas
const obtenerAlertas = async (req, res) => {
  try {
    const alertas = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        p.categoria,
        p.stock_actual,
        p.stock_minimo,
        p.demanda_anual,
        p.costo_pedido,
        p.costo_mantenimiento,
        CASE 
          WHEN p.stock_actual <= p.stock_minimo THEN 'CRITICO'
          WHEN p.stock_actual <= (p.stock_minimo * 1.5) THEN 'BAJO'
          ELSE 'NORMAL'
        END as nivel_alerta,
        ROUND((p.stock_actual::numeric / p.stock_minimo::numeric) * 100, 2) as porcentaje_stock
      FROM productos p
      WHERE p.stock_actual <= (p.stock_minimo * 1.5)
      ORDER BY
        CASE 
          WHEN p.stock_actual <= p.stock_minimo THEN 1
          WHEN p.stock_actual <= (p.stock_minimo * 1.5) THEN 2
          ELSE 3
        END,
        p.stock_actual ASC
    `);

    res.status(200).json({
      total_alertas: alertas.rows.length,
      alertas_criticas: alertas.rows.filter(a => a.nivel_alerta === 'CRITICO').length,
      alertas_bajas: alertas.rows.filter(a => a.nivel_alerta === 'BAJO').length,
      alertas: alertas.rows
    });

  } catch (error) {
    console.error('Error al obtener alertas:', error.message);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
};

// Generar recomendaciones de reabastecimiento
const generarRecomendaciones = async (req, res) => {
  try {
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
        SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) as eoq,
        (p.demanda_anual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento)) as frecuencia_pedidos,
        (365 / (p.demanda_anual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento))) as dias_entre_pedidos,
        ((p.demanda_anual / SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento)) * p.costo_pedido) + 
        ((SQRT((2 * p.demanda_anual * p.costo_pedido) / p.costo_mantenimiento) / 2) * p.costo_mantenimiento) as costo_total_anual
      FROM productos p
      WHERE p.stock_actual <= (p.stock_minimo * 2)
      AND p.demanda_anual > 0 
      AND p.costo_pedido > 0 
      AND p.costo_mantenimiento > 0
      ORDER BY 
        CASE 
          WHEN p.stock_actual <= p.stock_minimo THEN 1
          ELSE 2
        END,
        p.stock_actual ASC
    `);

    const recomendacionesFormateadas = recomendaciones.rows.map(r => ({
      ...r,
      eoq: Math.round(r.eoq),
      frecuencia_pedidos: Math.round(r.frecuencia_pedidos * 10) / 10,
      dias_entre_pedidos: Math.round(r.dias_entre_pedidos),
      costo_total_anual: Math.round(r.costo_total_anual * 100) / 100,
      prioridad: r.stock_actual <= r.stock_minimo ? 'ALTA' : 'MEDIA',
      accion_recomendada: r.stock_actual <= r.stock_minimo ? 
        `¡URGENTE! Pedir ${Math.round(r.eoq)} unidades inmediatamente` :
        `Planificar pedido de ${Math.round(r.eoq)} unidades en los próximos ${Math.round(r.dias_entre_pedidos)} días`
    }));

    res.status(200).json({
      total_recomendaciones: recomendacionesFormateadas.length,
      recomendaciones_alta_prioridad: recomendacionesFormateadas.filter(r => r.prioridad === 'ALTA').length,
      recomendaciones: recomendacionesFormateadas
    });

  } catch (error) {
    console.error('Error al generar recomendaciones:', error.message);
    res.status(500).json({ error: 'Error al generar recomendaciones' });
  }
};

// Enviar notificación por email (opcional)
const enviarNotificacionEmail = async (req, res) => {
  try {
    const { email, asunto, mensaje } = req.body;

    if (!email || !asunto || !mensaje) {
      return res.status(400).json({ error: 'Email, asunto y mensaje son requeridos' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `[OPTISTOCK] ${asunto}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50; text-align: center;">🚨 OPTISTOCK - Alerta de Inventario</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.6;">${mensaje}</p>
          </div>
          <p style="color: #666; text-align: center; font-size: 14px;">
            Este es un mensaje automático del sistema OPTISTOCK.<br>
            Fecha: ${new Date().toLocaleDateString('es-ES')}
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      mensaje: 'Notificación enviada exitosamente',
      email: email,
      fecha: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al enviar notificación:', error.message);
    res.status(500).json({ error: 'Error al enviar notificación por email' });
  }
};

// Dashboard de métricas de inventario
const obtenerDashboard = async (req, res) => {
  try {
    // Estadísticas generales
    const estadisticas = await pool.query(`
      SELECT 
        COUNT(*) as total_productos,
        COUNT(CASE WHEN stock_actual <= stock_minimo THEN 1 END) as productos_criticos,
        COUNT(CASE WHEN stock_actual <= stock_minimo * 1.5 THEN 1 END) as productos_bajo_stock,
        AVG(stock_actual) as promedio_stock,
        SUM(stock_actual * costo_unitario) as valor_total_inventario
      FROM productos
    `);

    // Productos más críticos
    const productosCriticos = await pool.query(`
      SELECT 
        id, nombre, categoria, stock_actual, stock_minimo,
        ROUND(((stock_minimo - stock_actual) * 100.0 / stock_minimo), 2) as porcentaje_deficit
      FROM productos 
      WHERE stock_actual <= stock_minimo 
      ORDER BY porcentaje_deficit DESC 
      LIMIT 5
    `);

    // Tendencia de alertas (últimos 30 días)
    const tendenciaAlertas = await pool.query(`
      SELECT 
        DATE(fecha) as fecha,
        COUNT(*) as alertas_generadas
      FROM calculos_eoq 
      WHERE fecha >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(fecha)
      ORDER BY fecha DESC
      LIMIT 30
    `);

    // Categorías con más alertas
    const categoriasAlertas = await pool.query(`
      SELECT 
        categoria,
        COUNT(*) as productos_con_alertas,
        AVG(stock_actual) as promedio_stock_categoria
      FROM productos 
      WHERE stock_actual <= stock_minimo * 1.5
      GROUP BY categoria
      ORDER BY productos_con_alertas DESC
    `);

    const dashboard = {
      estadisticas_generales: estadisticas.rows[0],
      productos_criticos: productosCriticos.rows,
      tendencia_alertas: tendenciaAlertas.rows,
      categorias_con_alertas: categoriasAlertas.rows,
      fecha_actualizacion: new Date().toISOString()
    };

    res.status(200).json(dashboard);

  } catch (error) {
    console.error('Error al obtener dashboard:', error.message);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
};

module.exports = {
  obtenerAlertas,
  generarRecomendaciones,
  enviarNotificacionEmail,
  obtenerDashboard
};
