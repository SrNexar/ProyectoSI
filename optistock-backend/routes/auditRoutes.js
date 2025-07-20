const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

// Ruta principal para obtener todos los logs con filtros
router.get('/logs', auditController.obtenerLogs);

// Obtener estadísticas de auditoría
router.get('/estadisticas', auditController.obtenerEstadisticas);

// Obtener historial específico de un registro
router.get('/historial/:tabla/:id', auditController.obtenerHistorialRegistro);

// Obtener logs específicos de productos (más procesados)
router.get('/productos', auditController.obtenerLogsProductos);

module.exports = router;
