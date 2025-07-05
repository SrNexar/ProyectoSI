const pool = require('../models/db');

// Obtener todos los productos
const obtenerProductos = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM productos ORDER BY id DESC');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Obtener producto por ID
const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9]+$/.test(id)) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }
    const resultado = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// Crear nuevo producto
const crearProducto = async (req, res) => {
  try {
    const {
      nombre,
      categoria,
      costo_unitario,
      stock_actual,
      stock_minimo,
      stock_maximo,
      demanda_anual,
      costo_pedido,
      costo_mantenimiento
    } = req.body;

    const resultado = await pool.query(
      `INSERT INTO productos 
       (nombre, categoria, costo_unitario, stock_actual, stock_minimo, stock_maximo, demanda_anual, costo_pedido, costo_mantenimiento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [nombre, categoria, costo_unitario, stock_actual, stock_minimo, stock_maximo, demanda_anual, costo_pedido, costo_mantenimiento]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
};

// Actualizar producto
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      categoria,
      costo_unitario,
      stock_actual,
      stock_minimo,
      stock_maximo,
      demanda_anual,
      costo_pedido,
      costo_mantenimiento
    } = req.body;

    const resultado = await pool.query(
      `UPDATE productos 
       SET nombre = $1, categoria = $2, costo_unitario = $3, stock_actual = $4, stock_minimo = $5, 
           stock_maximo = $6, demanda_anual = $7, costo_pedido = $8, costo_mantenimiento = $9,
           fecha_ultima_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [nombre, categoria, costo_unitario, stock_actual, stock_minimo, stock_maximo, demanda_anual, costo_pedido, costo_mantenimiento, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// Eliminar producto
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json({ mensaje: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

// Actualizar stock
const actualizarStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_actual } = req.body;

    const resultado = await pool.query(
      'UPDATE productos SET stock_actual = $1, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [stock_actual, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
};

// Buscar productos
const buscarProductos = async (req, res) => {
  try {
    const { q } = req.query;
    const resultado = await pool.query(
      'SELECT * FROM productos WHERE nombre ILIKE $1 OR categoria ILIKE $1 ORDER BY nombre',
      [`%${q}%`]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al buscar productos:', error);
    res.status(500).json({ error: 'Error al buscar productos' });
  }
};

// Obtener productos con stock bajo
const obtenerProductosStockBajo = async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM productos WHERE stock_actual <= stock_minimo ORDER BY stock_actual ASC'
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error);
    res.status(500).json({ error: 'Error al obtener productos con stock bajo' });
  }
};

// Obtener productos por categoría
const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    const resultado = await pool.query(
      'SELECT * FROM productos WHERE categoria = $1 ORDER BY nombre',
      [categoria]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    res.status(500).json({ error: 'Error al obtener productos por categoría' });
  }
};

// Reporte resumen de inventario (JSON o PDF)
const generarReporteInventario = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM productos ORDER BY categoria ASC, nombre ASC');
    const productos = resultado.rows;
    const accept = req.headers.accept || '';
    if (accept.includes('application/pdf')) {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte_inventario.pdf"');
      doc.pipe(res);
      
      // Título y encabezado
      doc.fontSize(24).fillColor('#2563eb').text('Reporte de Inventario', { align: 'center', underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#4B5563').text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);
      
      // Configuración de la tabla
      const tableTop = doc.y;
      const colWidths = [25, 150, 90, 45, 45, 45, 90]; // Ajuste de anchos
      const rowHeight = 25; // Mayor altura para cada fila
      const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
      const startX = (doc.page.width - tableWidth) / 2; // Centrar tabla
      
      // Función para dibujar una fila de la tabla
      const drawTableRow = (items, isHeader = false, y) => {
        // Dibuja el fondo de la fila
        if (isHeader) {
          doc.fillColor('#E5E7EB').rect(startX, y, tableWidth, rowHeight).fill();
        }
        
        let x = startX;
        items.forEach((item, i) => {
          // Configura estilo de texto según si es encabezado o contenido
          if (isHeader) {
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827');
          } else {
            doc.font('Helvetica').fontSize(10).fillColor('#374151');
          }
          
          // Calcula posición vertical centrada dentro de la celda
          const textOptions = {
            width: colWidths[i],
            align: i === 1 ? 'left' : 'center', // Alinear nombre a la izquierda
            ellipsis: true
          };
          
          // Posiciona y escribe el texto centrado verticalmente
          const textY = y + (rowHeight - doc.currentLineHeight()) / 2;
          
          // Añade padding horizontal
          const paddingX = 5;
          doc.text(item.toString(), x + paddingX, textY, {
            ...textOptions,
            width: colWidths[i] - (paddingX * 2)
          });
          
          x += colWidths[i];
        });
        
        return y + rowHeight;
      };
      
      // Dibuja líneas de la tabla
      const drawTableLines = (y, height) => {
        // Líneas verticales
        let x = startX;
        for (let i = 0; i <= colWidths.length; i++) {
          doc.moveTo(x, y).lineTo(x, y + height).stroke('#D1D5DB');
          if (i < colWidths.length) x += colWidths[i];
        }
        
        // Línea superior
        doc.moveTo(startX, y).lineTo(startX + tableWidth, y).stroke('#9CA3AF');
        
        // Línea inferior de encabezados
        doc.moveTo(startX, y + rowHeight).lineTo(startX + tableWidth, y + rowHeight).stroke('#9CA3AF');
        
        // Línea inferior de tabla
        doc.moveTo(startX, y + height).lineTo(startX + tableWidth, y + height).stroke('#9CA3AF');
      };
      
      // Encabezados
      const headers = ['#', 'Producto', 'Categoría', 'Stock', 'Mínimo', 'Máximo', 'Costo Unitario'];
      let y = tableTop;
      y = drawTableRow(headers, true, y);
      
      // Datos
      productos.forEach((p, i) => {
        // Truncar textos largos
        const nombre = (p.nombre || '').length > 22 ? p.nombre.slice(0, 19) + '...' : p.nombre;
        const categoria = (p.categoria || '-').length > 13 ? p.categoria.slice(0, 10) + '...' : p.categoria || '-';
        
        const row = [
          i + 1,
          nombre,
          categoria,
          p.stock_actual,
          p.stock_minimo,
          p.stock_maximo || '-',
          `$${Number(p.costo_unitario).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
        ];
        
        // Verificar si necesitamos una nueva página
        if (y + rowHeight > doc.page.height - 70) {
          // Dibuja las líneas de la tabla actual antes de cambiar de página
          drawTableLines(tableTop, y - tableTop);
          
          // Nueva página
          doc.addPage();
          y = 50; // Resetear posición Y
          
          // Repetir encabezados en la nueva página
          y = drawTableRow(headers, true, y);
        }
        
        // Alternar color de fondo para filas
        if (i % 2 !== 0) {
          doc.fillColor('#F9FAFB').rect(startX, y, tableWidth, rowHeight).fill();
        }
        
        y = drawTableRow(row, false, y);
      });
      
      // Dibujar líneas de la tabla
      drawTableLines(tableTop, y - tableTop);
      
      // Pie de página
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#6b7280').text('Reporte generado automáticamente por OPTISTOCK', {
        align: 'center'
      });
      
      // Paginación
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#9CA3AF').text(
          `Página ${i + 1} de ${totalPages}`,
          startX,
          doc.page.height - 50,
          { align: 'center', width: tableWidth }
        );
      }
      
      doc.end();
    } else {
      res.json(productos);
    }
  } catch (error) {
    console.error('Error al generar reporte de inventario:', error);
    res.status(500).json({ error: 'Error al generar el reporte de inventario' });
  }
};

module.exports = {
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
};

