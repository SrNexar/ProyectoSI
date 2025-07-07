const OpenAI = require('openai');
const db = require('../models/db');

// Configuración de OpenAI con verificación de API key
let openai = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    console.warn('⚠️  OPENAI_API_KEY no está configurada. El chatbot funcionará en modo limitado.');
  }
} catch (error) {
  console.error('Error inicializando OpenAI:', error.message);
}

// Contexto del sistema para el chatbot
const SYSTEM_CONTEXT = `
Eres OptiBot, un asistente inteligente especializado en gestión de inventarios y sistemas OptiStock. 
Tu función es ayudar a los usuarios con consultas relacionadas con:

1. GESTIÓN DE INVENTARIOS:
   - Consultas sobre productos y stock
   - Análisis de niveles de inventario por categoría
   - Recomendaciones de reposición
   - Información sobre stock actual, mínimo, máximo y punto de reorden

2. CÁLCULOS EOQ (Economic Order Quantity):
   - Explicar qué es EOQ y sus beneficios
   - Ayudar con cálculos de cantidad económica de pedido
   - Interpretar resultados de EOQ basados en demanda anual, costos de pedido y mantenimiento

3. ALERTAS Y NOTIFICACIONES:
   - Configuración de alertas de stock bajo
   - Interpretación de alertas del sistema
   - Análisis de productos en estado crítico

4. ANÁLISIS DE DATOS:
   - Interpretación de reportes de inventario
   - Tendencias de consumo por categoría
   - Optimización de costos de inventario
   - Análisis de puntos de reorden

Los productos en el sistema tienen las siguientes características:
- Nombre y categoría
- Stock actual, mínimo, máximo y punto de reorden
- Costos unitarios, de pedido y mantenimiento
- Demanda anual para cálculos EOQ

Responde de manera clara, profesional y útil. Si necesitas información específica de la base de datos, 
indícalo claramente. Siempre mantén un tono amigable y educativo.
`;

// Función para obtener contexto de la base de datos
async function obtenerContextoBD() {
  try {
    // Estadísticas generales de productos
    const productosQuery = await db.query(`
      SELECT COUNT(*) as total_productos,
             AVG(stock_actual) as promedio_stock,
             MIN(stock_actual) as stock_minimo,
             MAX(stock_actual) as stock_maximo
      FROM productos
    `);
    
    // Productos con stock bajo o crítico
    const stockBajoQuery = await db.query(`
      SELECT nombre, categoria, stock_actual, stock_minimo, punto_reorden,
             CASE 
               WHEN stock_actual <= stock_minimo THEN 'CRITICO'
               WHEN stock_actual <= punto_reorden THEN 'BAJO'
               ELSE 'NORMAL'
             END as estado_stock
      FROM productos 
      WHERE stock_actual <= punto_reorden
      ORDER BY stock_actual ASC
      LIMIT 10
    `);
    
    // Alertas activas del historial
    const alertasQuery = await db.query(`
      SELECT COUNT(*) as total_alertas,
             tipo_alerta,
             COUNT(*) as cantidad
      FROM historial_alertas 
      WHERE estado = 'PENDIENTE'
      GROUP BY tipo_alerta
    `);

    // Categorías con más productos
    const categoriasQuery = await db.query(`
      SELECT categoria, COUNT(*) as cantidad_productos,
             AVG(stock_actual) as promedio_stock_categoria
      FROM productos 
      WHERE categoria IS NOT NULL
      GROUP BY categoria
      ORDER BY cantidad_productos DESC
      LIMIT 5
    `);

    return {
      productos: productosQuery.rows[0],
      stockBajo: stockBajoQuery.rows,
      alertas: alertasQuery.rows,
      categorias: categoriasQuery.rows
    };
  } catch (error) {
    console.error('Error obteniendo contexto de BD:', error);
    return null;
  }
}

// Función para procesar consultas específicas de productos
async function procesarConsultaProductos(mensaje) {
  try {
    // Buscar si el mensaje contiene nombres de productos
    const productosQuery = await db.query(`
      SELECT nombre, categoria, stock_actual, stock_minimo, stock_maximo, punto_reorden
      FROM productos
      WHERE LOWER(nombre) LIKE LOWER($1) OR LOWER(categoria) LIKE LOWER($1)
      LIMIT 5
    `, [`%${mensaje}%`]);

    if (productosQuery.rows.length > 0) {
      return {
        tipo: 'productos',
        datos: productosQuery.rows
      };
    }
    return null;
  } catch (error) {
    console.error('Error en consulta de productos:', error);
    return null;
  }
}

// Controlador principal del chatbot
const chatbotController = {
  // Endpoint para conversación con el chatbot
  chat: async (req, res) => {
    try {
      const { mensaje, conversacion = [] } = req.body;

      if (!mensaje) {
        return res.status(400).json({
          error: 'El mensaje es requerido'
        });
      }

      // Verificar si OpenAI está disponible
      if (!openai) {
        return res.status(503).json({
          error: 'El servicio de IA no está disponible. Verifica la configuración de OPENAI_API_KEY.',
          respuesta: 'Lo siento, el servicio de IA no está disponible en este momento. Por favor contacta al administrador para verificar la configuración.'
        });
      }

      // Obtener contexto de la base de datos
      const contexto = await obtenerContextoBD();
      
      // Procesar consultas específicas
      const consultaEspecifica = await procesarConsultaProductos(mensaje);

      // Construir el contexto para OpenAI
      let contextoBD = '';
      if (contexto) {
        contextoBD = `
        DATOS ACTUALES DEL SISTEMA:
        - Total de productos: ${contexto.productos.total_productos}
        - Promedio de stock: ${Math.round(contexto.productos.promedio_stock)}
        - Stock mínimo registrado: ${contexto.productos.stock_minimo}
        - Stock máximo registrado: ${contexto.productos.stock_maximo}
        - Alertas activas: ${contexto.alertas.length > 0 ? contexto.alertas.map(a => `${a.cantidad} ${a.tipo_alerta}`).join(', ') : 'Ninguna'}
        
        PRODUCTOS CON STOCK BAJO O CRÍTICO:
        ${contexto.stockBajo.length > 0 ? 
          contexto.stockBajo.map(p => 
            `- ${p.nombre} (${p.categoria}): Stock ${p.stock_actual}/${p.stock_minimo} - Estado: ${p.estado_stock}`
          ).join('\n') : 
          'Todos los productos tienen stock normal'
        }
        
        CATEGORÍAS PRINCIPALES:
        ${contexto.categorias.map(c => 
          `- ${c.categoria}: ${c.cantidad_productos} productos, promedio stock ${Math.round(c.promedio_stock_categoria)}`
        ).join('\n')}
        `;
      }

      if (consultaEspecifica) {
        contextoBD += `
        PRODUCTOS ENCONTRADOS:
        ${consultaEspecifica.datos.map(p => 
          `- ${p.nombre} (${p.categoria}): Stock actual ${p.stock_actual}, Mínimo ${p.stock_minimo}, Máximo ${p.stock_maximo}, Punto reorden ${p.punto_reorden}`
        ).join('\n')}
        `;
      }

      // Construir el historial de conversación
      const mensajes = [
        {
          role: 'system',
          content: SYSTEM_CONTEXT + contextoBD
        },
        ...conversacion.map(msg => ({
          role: msg.rol === 'usuario' ? 'user' : 'assistant',
          content: msg.contenido
        })),
        {
          role: 'user',
          content: mensaje
        }
      ];

      // Llamada a OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: mensajes,
        max_tokens: 500,
        temperature: 0.7,
      });

      const respuesta = completion.choices[0].message.content;

      // Guardar la conversación en la base de datos (opcional)
      try {
        await db.query(`
          INSERT INTO conversaciones_chatbot (mensaje_usuario, respuesta_bot, timestamp)
          VALUES ($1, $2, NOW())
        `, [mensaje, respuesta]);
      } catch (dbError) {
        console.log('No se pudo guardar la conversación en BD:', dbError.message);
      }

      res.json({
        respuesta,
        contexto: contexto ? 'Datos actuales incluidos' : 'Sin datos de contexto',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en chatbot:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'Lo siento, hubo un problema procesando tu consulta. Por favor intenta nuevamente.'
      });
    }
  },

  // Endpoint para obtener sugerencias rápidas
  sugerencias: async (req, res) => {
    try {
      const contexto = await obtenerContextoBD();
      
      const sugerencias = [
        "¿Cómo calcular el EOQ para un producto?",
        "¿Qué productos tienen stock bajo?",
        "Explícame las alertas activas",
        "¿Cuál es el estado general del inventario?",
        "¿Cómo optimizar los costos de inventario?"
      ];

      // Agregar sugerencias personalizadas basadas en el contexto
      if (contexto && contexto.alertas.length > 0) {
        sugerencias.unshift("Revisa las alertas activas del sistema");
      }

      res.json({
        sugerencias,
        contexto: contexto ? {
          totalProductos: contexto.productos.total_productos,
          alertasActivas: contexto.alertas.length
        } : null
      });

    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      res.status(500).json({
        error: 'Error obteniendo sugerencias',
        sugerencias: [
          "¿Cómo funciona el sistema OptiStock?",
          "¿Qué es EOQ?",
          "¿Cómo gestionar el inventario eficientemente?"
        ]
      });
    }
  },

  // Endpoint para obtener historial de conversaciones
  historial: async (req, res) => {
    try {
      const { limite = 10 } = req.query;
      
      const historialQuery = await db.query(`
        SELECT mensaje_usuario, respuesta_bot, timestamp
        FROM conversaciones_chatbot
        ORDER BY timestamp DESC
        LIMIT $1
      `, [limite]);

      res.json({
        historial: historialQuery.rows,
        total: historialQuery.rows.length
      });

    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        error: 'Error obteniendo historial',
        historial: []
      });
    }
  }
};

module.exports = chatbotController;
