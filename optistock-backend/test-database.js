const db = require('./models/db');

async function testDatabase() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    
    // Probar conexión
    const result = await db.query('SELECT NOW()');
    console.log('✅ Conexión exitosa:', result.rows[0].now);
    
    // Verificar tablas existentes
    console.log('\n📊 Verificando tablas existentes...');
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tablas encontradas:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar estructura de productos
    console.log('\n🏷️ Verificando estructura de tabla productos...');
    const productosColumns = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'productos'
      ORDER BY ordinal_position
    `);
    
    if (productosColumns.rows.length > 0) {
      console.log('Columnas de productos:');
      productosColumns.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? '- NOT NULL' : ''}`);
      });
      
      // Verificar datos en productos
      console.log('\n📦 Verificando datos en productos...');
      const productosData = await db.query(`
        SELECT COUNT(*) as total FROM productos
      `);
      
      const totalProductos = productosData.rows[0].total;
      console.log(`Total de productos: ${totalProductos}`);
      
      if (totalProductos > 0) {
        // Mostrar algunos productos de muestra
        const sampleProducts = await db.query(`
          SELECT id, nombre, categoria, stock_actual, stock_minimo, punto_reorden
          FROM productos 
          LIMIT 5
        `);
        
        console.log('\nProductos de muestra:');
        sampleProducts.rows.forEach(product => {
          console.log(`  - ${product.nombre} (${product.categoria}): Stock ${product.stock_actual}/${product.stock_minimo}`);
        });
        
        // Verificar productos con stock bajo
        const stockBajo = await db.query(`
          SELECT COUNT(*) as total
          FROM productos 
          WHERE stock_actual <= punto_reorden
        `);
        
        console.log(`\nProductos con stock bajo: ${stockBajo.rows[0].total}`);
      }
    } else {
      console.log('❌ Tabla productos no encontrada');
    }
    
    // Verificar alertas
    console.log('\n🚨 Verificando alertas...');
    const alertasCheck = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('historial_alertas', 'alertas')
    `);
    
    if (alertasCheck.rows.length > 0) {
      const alertasData = await db.query(`
        SELECT COUNT(*) as total FROM historial_alertas
      `);
      console.log(`Total de alertas: ${alertasData.rows[0].total}`);
    } else {
      console.log('❌ Tabla de alertas no encontrada');
    }
    
    console.log('\n✅ Prueba de base de datos completada');
    
  } catch (error) {
    console.error('❌ Error en prueba de base de datos:', error.message);
    console.error('Detalles del error:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase();
