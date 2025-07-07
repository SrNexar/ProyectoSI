const db = require('./models/db');

async function verificarDuplicados() {
  try {
    console.log('🔍 Verificando productos duplicados...');
    
    // Verificar productos duplicados por nombre
    const duplicados = await db.query(`
      SELECT nombre, COUNT(*) as cantidad
      FROM productos 
      GROUP BY nombre
      HAVING COUNT(*) > 1
      ORDER BY cantidad DESC
    `);
    
    if (duplicados.rows.length > 0) {
      console.log('❌ Productos duplicados encontrados:');
      duplicados.rows.forEach(row => {
        console.log(`  - ${row.nombre}: ${row.cantidad} veces`);
      });
    } else {
      console.log('✅ No se encontraron productos duplicados');
    }
    
    // Mostrar todos los productos ordenados por ID
    console.log('\n📋 Todos los productos en la base de datos:');
    const productos = await db.query(`
      SELECT id, nombre, categoria, costo_unitario, stock_actual, stock_minimo
      FROM productos 
      ORDER BY id
    `);
    
    productos.rows.forEach(producto => {
      console.log(`  ${producto.id}: ${producto.nombre} (${producto.categoria}) - $${producto.costo_unitario} - Stock: ${producto.stock_actual}/${producto.stock_minimo}`);
    });
    
    console.log(`\n📊 Total de productos: ${productos.rows.length}`);
    
    // Verificar si hay productos con exactamente los mismos valores
    const valoresIguales = await db.query(`
      SELECT 
        costo_unitario, 
        demanda_anual, 
        costo_pedido, 
        costo_mantenimiento,
        COUNT(*) as cantidad
      FROM productos 
      GROUP BY costo_unitario, demanda_anual, costo_pedido, costo_mantenimiento
      HAVING COUNT(*) > 1
      ORDER BY cantidad DESC
    `);
    
    if (valoresIguales.rows.length > 0) {
      console.log('\n⚠️  Productos con valores EOQ idénticos:');
      valoresIguales.rows.forEach(row => {
        console.log(`  - Costo: $${row.costo_unitario}, Demanda: ${row.demanda_anual}, Costo pedido: $${row.costo_pedido}, Costo mant: ${row.costo_mantenimiento} (${row.cantidad} productos)`);
      });
    } else {
      console.log('\n✅ No hay productos con valores EOQ idénticos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

verificarDuplicados();
