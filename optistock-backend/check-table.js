const pool = require('./models/db');

const checkTableStructure = async () => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'productos' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Estructura de la tabla productos:');
    console.table(result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
};

checkTableStructure();
