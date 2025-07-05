const pool = require('./models/db');
const fs = require('fs');

const ejecutarScript = async () => {
  try {
    console.log('Ejecutando script de nuevas funcionalidades...');
    
    const script = fs.readFileSync('./database/nuevas_funcionalidades.txt', 'utf8');
    
    await pool.query(script);
    
    console.log('✅ Script ejecutado correctamente');
    console.log('📊 Verificando las nuevas tablas...');
    
    // Verificar las tablas creadas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Tablas en la base de datos:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error ejecutando script:', error);
  } finally {
    pool.end();
  }
};

ejecutarScript();
