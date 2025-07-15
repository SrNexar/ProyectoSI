const express = require('express');
const router = express.Router();
const { calcularEOQ, obtenerHistorialEOQ, obtenerRecomendacionEOQ, generarReporteEOQ, generarReporteEOQMasivo } = require('../controllers/eoqController');

// Rutas específicas primero
router.get('/reporte-masivo', generarReporteEOQMasivo);
router.get('/reporte/:producto_id', generarReporteEOQ);
router.get('/historial/:producto_id', obtenerHistorialEOQ);
router.get('/recomendacion/:producto_id', obtenerRecomendacionEOQ);

// Ruta general al final
router.get('/:producto_id', calcularEOQ); // GET /api/eoq/1

module.exports = router;
