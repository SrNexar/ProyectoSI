const db = require('./models/db');

async function obtenerProductoMasValioso() {
  try {
    console.log('🔍 Buscando el producto con más valor...');
    
    // Obtener producto con mayor valor total (precio unitario * stock actual)
    const valorTotal = await db.query(`
      SELECT 
        id,
        nombre,
        categoria,
        costo_unitario,
        stock_actual,
        (costo_unitario * stock_actual) as valor_total_inventario
      FROM productos
      ORDER BY valor_total_inventario DESC
      LIMIT 1
    `);
    
    // Obtener producto con mayor precio unitario
    const precioUnitario = await db.query(`
      SELECT 
        id,
        nombre,
        categoria,
        costo_unitario,
        stock_actual,
        (costo_unitario * stock_actual) as valor_total_inventario
      FROM productos
      ORDER BY costo_unitario DESC
      LIMIT 1
    `);
    
    // Obtener top 5 productos más valiosos
    const top5 = await db.query(`
      SELECT 
        id,
        nombre,
        categoria,
        costo_unitario,
        stock_actual,
        (costo_unitario * stock_actual) as valor_total_inventario
      FROM productos
      ORDER BY valor_total_inventario DESC
      LIMIT 5
    `);
    
    console.log('\n💰 PRODUCTO CON MAYOR VALOR TOTAL EN INVENTARIO:');
    const masValioso = valorTotal.rows[0];
    console.log(`   ${masValioso.nombre} (${masValioso.categoria})`);
    console.log(`   Precio unitario: $${masValioso.costo_unitario}`);
    console.log(`   Stock actual: ${masValioso.stock_actual} unidades`);
    console.log(`   Valor total: $${parseFloat(masValioso.valor_total_inventario).toFixed(2)}`);
    
    console.log('\n💎 PRODUCTO CON MAYOR PRECIO UNITARIO:');
    const masCaro = precioUnitario.rows[0];
    console.log(`   ${masCaro.nombre} (${masCaro.categoria})`);
    console.log(`   Precio unitario: $${masCaro.costo_unitario}`);
    console.log(`   Stock actual: ${masCaro.stock_actual} unidades`);
    console.log(`   Valor total: $${parseFloat(masCaro.valor_total_inventario).toFixed(2)}`);
    
    console.log('\n🏆 TOP 5 PRODUCTOS MÁS VALIOSOS (por valor total):');
    top5.rows.forEach((producto, index) => {
      console.log(`   ${index + 1}. ${producto.nombre}`);
      console.log(`      Categoría: ${producto.categoria}`);
      console.log(`      Precio: $${producto.costo_unitario} x ${producto.stock_actual} unidades`);
      console.log(`      Valor total: $${parseFloat(producto.valor_total_inventario).toFixed(2)}`);
      console.log('');
    });
    
    // Valor total del inventario
    const valorInventario = await db.query(`
      SELECT SUM(costo_unitario * stock_actual) as valor_total_inventario
      FROM productos
    `);
    
    console.log(`💰 VALOR TOTAL DEL INVENTARIO: $${parseFloat(valorInventario.rows[0].valor_total_inventario).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

obtenerProductoMasValioso();
