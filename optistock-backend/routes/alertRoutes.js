const express = require('express');
const router = express.Router();
const { 
  obtenerAlertas, 
  generarRecomendaciones, 
  enviarNotificacionEmail, 
  obtenerDashboard
} = require('../controllers/alertController');

// Rutas para alertas
router.get('/', obtenerAlertas); // GET /api/alertas
router.get('/dashboard', obtenerDashboard); // GET /api/alertas/dashboard
router.get('/recomendaciones', generarRecomendaciones); // GET /api/alertas/recomendaciones
router.post('/notificar', enviarNotificacionEmail); // POST /api/alertas/notificar

module.exports = router;
