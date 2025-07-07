const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./routes/productRoutes');
const eoqRoutes = require('./routes/eoqRoutes');
const alertRoutes = require('./routes/alertRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json()); // <<--- MUY IMPORTANTE para que acepte JSON

app.use('/api/products', productRoutes);
app.use('/api/eoq', eoqRoutes);
app.use('/api/alertas', alertRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    mensaje: 'OPTISTOCK API - Sistema de Gestión de Inventario',
    version: '1.0.0',
    endpoints: {
      productos: '/api/products',
      eoq: '/api/eoq',
      alertas: '/api/alertas',
      chatbot: '/api/chatbot'
    }
  });
});

// Ruta para /api/ - información de la API
app.get('/api', (req, res) => {
  res.json({
    mensaje: 'OPTISTOCK API - Endpoints disponibles',
    version: '1.0.0',
    endpoints: {
      productos: {
        url: '/api/products',
        métodos: ['GET', 'POST', 'PUT', 'DELETE'],
        descripción: 'Gestión de productos del inventario'
      },
      eoq: {
        url: '/api/eoq',
        métodos: ['GET', 'POST'],
        descripción: 'Cálculo de Cantidad Económica de Pedido'
      },
      alertas: {
        url: '/api/alertas',
        métodos: ['GET', 'POST', 'PUT', 'DELETE'],
        descripción: 'Sistema de alertas y notificaciones',
        dashboard: '/api/alertas/dashboard'
      },
      chatbot: {
        url: '/api/chatbot',
        métodos: ['GET', 'POST'],
        descripción: 'Asistente inteligente OptiBot para consultas de inventario',
        endpoints: {
          chat: '/api/chatbot/chat',
          sugerencias: '/api/chatbot/sugerencias',
          historial: '/api/chatbot/historial'
        }
      }
    },
    documentación: 'Para más información, visita la documentación del proyecto'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor OPTISTOCK corriendo en http://localhost:${PORT}`);
  console.log(`📊 Dashboard de alertas: http://localhost:${PORT}/api/alertas/dashboard`);
});
