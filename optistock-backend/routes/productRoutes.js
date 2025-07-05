const express = require('express');
const router = express.Router();
const { 
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  actualizarStock,
  buscarProductos,
  obtenerProductosStockBajo,
  obtenerProductosPorCategoria,
  generarReporteInventario
} = require('../controllers/productController');

// Rutas de productos
router.get('/', obtenerProductos);
router.get('/summary', generarReporteInventario);
router.get('/search', buscarProductos);
router.get('/low-stock', obtenerProductosStockBajo);
router.get('/category/:categoria', obtenerProductosPorCategoria);
router.get('/:id', obtenerProductoPorId);
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.patch('/:id/stock', actualizarStock);
router.delete('/:id', eliminarProducto);

module.exports = router;
