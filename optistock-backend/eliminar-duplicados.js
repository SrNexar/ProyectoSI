const db = require('./models/db');

async function eliminarDuplicados() {
  try {
    console.log('🗑️  Eliminando productos duplicados...');
    
    // Eliminar productos duplicados manteniendo solo el de menor ID
    const eliminarQuery = `
      DELETE FROM productos 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM productos 
        GROUP BY nombre
      )
    `;
    
    const resultado = await db.query(eliminarQuery);
    console.log(`✅ Eliminados ${resultado.rowCount} productos duplicados`);
    
    // Verificar el resultado
    console.log('\n📋 Productos restantes:');
    const productos = await db.query(`
      SELECT id, nombre, categoria, costo_unitario, stock_actual, stock_minimo
      FROM productos 
      ORDER BY id
    `);
    
    productos.rows.forEach(producto => {
      console.log(`  ${producto.id}: ${producto.nombre} (${producto.categoria}) - $${producto.costo_unitario} - Stock: ${producto.stock_actual}/${producto.stock_minimo}`);
    });
    
    console.log(`\n📊 Total de productos únicos: ${productos.rows.length}`);
    
    // Verificar que no hay duplicados
    const verificarDuplicados = await db.query(`
      SELECT nombre, COUNT(*) as cantidad
      FROM productos 
      GROUP BY nombre
      HAVING COUNT(*) > 1
    `);
    
    if (verificarDuplicados.rows.length === 0) {
      console.log('✅ No hay productos duplicados');
    } else {
      console.log('❌ Aún hay productos duplicados:', verificarDuplicados.rows);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

eliminarDuplicados();
