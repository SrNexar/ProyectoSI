const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Ruta principal para el chat
router.post('/chat', chatbotController.chat);

// Ruta para obtener sugerencias
router.get('/sugerencias', chatbotController.sugerencias);

// Ruta para obtener historial de conversaciones
router.get('/historial', chatbotController.historial);

// Ruta de información sobre el chatbot
router.get('/info', (req, res) => {
  res.json({
    nombre: 'OptiBot',
    version: '1.0.0',
    descripcion: 'Asistente inteligente para gestión de inventarios OptiStock',
    funcionalidades: [
      'Consultas sobre productos y stock',
      'Cálculos y explicaciones de EOQ',
      'Análisis de alertas del sistema',
      'Recomendaciones de optimización',
      'Interpretación de datos de inventario'
    ],
    endpoints: {
      chat: 'POST /api/chatbot/chat',
      sugerencias: 'GET /api/chatbot/sugerencias',
      historial: 'GET /api/chatbot/historial',
      info: 'GET /api/chatbot/info'
    }
  });
});

module.exports = router;
