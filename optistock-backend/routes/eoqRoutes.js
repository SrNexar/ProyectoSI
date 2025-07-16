const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/eoqController');

// Rutas específicas primero (más específicas a menos específicas)
router.get('/analisis-completo', analisisInventarioCompleto);
router.get('/alertas-stock-alto', generarAlertasStockAlto);
router.get('/reporte-alertas-stock-alto', generarReporteAlertasStockAlto);
router.get('/recomendaciones', obtenerRecomendacionesOptimizacion);
router.get('/reporte-recomendaciones', generarReporteRecomendaciones);
router.get('/reporte-masivo', generarReporteEOQMasivo);
router.get('/reporte/:producto_id', generarReporteEOQ);
router.get('/historial/:producto_id', obtenerHistorialEOQ);
router.get('/recomendacion/:producto_id', obtenerRecomendacionEOQ);

// Ruta general al final
router.get('/:producto_id', calcularEOQ); // GET /api/eoq/1

module.exports = router;
