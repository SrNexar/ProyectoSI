const db = require('./models/db');
require('dotenv').config();

async function agregarProductos() {
  try {
    console.log('🚀 Agregando productos a la base de datos...');
    
    // Insertar productos uno por uno para mejor control
    const productos = [
      ['Laptop HP Pavilion 15', 'Computadores', 699.99, 120, 35.00, 0.25, 8, 5, 50, 12],
      ['iPhone 15 Pro 256GB', 'Telefonía', 1299.99, 200, 50.00, 0.20, 15, 8, 60, 20],
      ['Samsung Galaxy S24 Ultra', 'Telefonía', 1199.99, 180, 45.00, 0.22, 12, 6, 45, 15],
      ['iPad Air 5ta Generación', 'Tablets', 799.99, 80, 30.00, 0.18, 6, 4, 30, 10],
      ['MacBook Air M3 13"', 'Computadores', 1599.99, 60, 60.00, 0.15, 3, 2, 25, 8],
      ['Monitor ASUS ROG 27" 144Hz', 'Monitores', 449.99, 150, 25.00, 0.20, 20, 10, 80, 25],
      ['Teclado Corsair K95 RGB', 'Periféricos', 159.99, 300, 12.00, 0.30, 35, 20, 150, 45],
      ['Mouse Logitech G Pro X', 'Periféricos', 94.99, 400, 10.00, 0.35, 18, 25, 200, 50],
      ['Auriculares Sony WH-1000XM5', 'Audio', 299.99, 180, 20.00, 0.25, 22, 15, 100, 30],
      ['SSD Samsung 970 EVO Plus 1TB', 'Almacenamiento', 119.99, 250, 15.00, 0.28, 40, 30, 200, 60]
    ];
    
    let agregados = 0;
    
    for (const producto of productos) {
      try {
        await db.query(`
          INSERT INTO productos (nombre, categoria, costo_unitario, demanda_anual, costo_pedido, costo_mantenimiento, stock_actual, stock_minimo, stock_maximo, punto_reorden, fecha_ultima_actualizacion)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `, producto);
        
        console.log(`✅ Agregado: ${producto[0]} - $${producto[2]}`);
        agregados++;
      } catch (error) {
        console.log(`⚠️  ${producto[0]} ya existe o error: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Resumen: ${agregados} productos agregados de ${productos.length} total`);
    
    // Verificar el estado actual
    const result = await db.query(`
      SELECT 
        id,
        nombre,
        categoria,
        costo_unitario,
        stock_actual,
        stock_minimo,
        punto_reorden,
        CASE 
          WHEN stock_actual <= stock_minimo THEN 'CRÍTICO'
          WHEN stock_actual <= punto_reorden THEN 'BAJO'
          ELSE 'NORMAL'
        END as estado_stock
      FROM productos 
      ORDER BY id DESC 
      LIMIT 15
    `);
    
    console.log('\n📦 Productos en la base de datos:');
    result.rows.forEach(row => {
      console.log(`${row.id}: ${row.nombre} - $${row.costo_unitario} - Stock: ${row.stock_actual} - Estado: ${row.estado_stock}`);
    });
    
    // Mostrar estadísticas
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_productos,
        COUNT(CASE WHEN stock_actual <= stock_minimo THEN 1 END) as criticos,
        COUNT(CASE WHEN stock_actual <= punto_reorden THEN 1 END) as stock_bajo,
        AVG(costo_unitario) as precio_promedio
      FROM productos
    `);
    
    console.log('\n📈 Estadísticas:');
    console.log(`Total productos: ${stats.rows[0].total_productos}`);
    console.log(`Productos críticos: ${stats.rows[0].criticos}`);
    console.log(`Stock bajo: ${stats.rows[0].stock_bajo}`);
    console.log(`Precio promedio: $${parseFloat(stats.rows[0].precio_promedio).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    process.exit(0);
  }
}

agregarProductos();
