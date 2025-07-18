const express = require('express');
const router = express.Router();
const { calcularEOQ, obtenerHistorialEOQ, obtenerRecomendacionEOQ, generarReporteEOQ, generarReporteEOQMasivo } = require('../controllers/eoqController');


router.get('/reporte-masivo', generarReporteEOQMasivo);
router.get('/:producto_id', calcularEOQ); // GET /api/eoq/1
router.get('/historial/:producto_id', obtenerHistorialEOQ);
router.get('/recomendacion/:producto_id', obtenerRecomendacionEOQ);
router.get('/reporte/:producto_id', generarReporteEOQ);


module.exports = router;
