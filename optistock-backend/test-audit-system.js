const axios = require('axios');

// Configuración
const API_BASE = 'http://localhost:4000/api';

// Test de conexión
async function testConnection() {
  try {
    const response = await axios.get(API_BASE);
    console.log('✅ Conexión exitosa:', response.data.mensaje);
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

// Test de endpoints de auditoría
async function testAuditEndpoints() {
  console.log('\n🔍 Probando endpoints de auditoría...');
  
  try {
    // Test obtener logs
    console.log('\n1. Obteniendo logs de auditoría...');
    const logsResponse = await axios.get(`${API_BASE}/audit/logs?limite=5`);
    console.log('✅ Logs obtenidos:', logsResponse.data.data?.length || 0, 'registros');
    
    // Test obtener estadísticas
    console.log('\n2. Obteniendo estadísticas...');
    const statsResponse = await axios.get(`${API_BASE}/audit/estadisticas`);
    console.log('✅ Estadísticas obtenidas:', statsResponse.data.data?.length || 0, 'tipos');
    
    // Test obtener logs de productos
    console.log('\n3. Obteniendo logs de productos...');
    const productLogsResponse = await axios.get(`${API_BASE}/audit/productos?limite=3`);
    console.log('✅ Logs de productos:', productLogsResponse.data.data?.length || 0, 'registros');
    
    console.log('\n✅ Todos los endpoints de auditoría funcionan correctamente');
  } catch (error) {
    console.error('❌ Error en endpoints de auditoría:', error.response?.data || error.message);
  }
}

// Test crear, actualizar y eliminar producto (para generar logs)
async function testProductOperations() {
  console.log('\n🛠️  Probando operaciones de productos (para generar logs)...');
  
  try {
    // 1. Crear producto de prueba
    console.log('\n1. Creando producto de prueba...');
    const newProduct = {
      nombre: 'Producto Test Auditoría',
      categoria: 'Test',
      costo_unitario: 100,
      stock_actual: 50,
      stock_minimo: 10,
      stock_maximo: 200,
      demanda_anual: 1000,
      costo_pedido: 25,
      costo_mantenimiento: 5
    };
    
    const createResponse = await axios.post(`${API_BASE}/products`, newProduct);
    const productId = createResponse.data.id;
    console.log('✅ Producto creado con ID:', productId);
    
    // 2. Actualizar producto
    console.log('\n2. Actualizando producto...');
    const updatedProduct = {
      ...newProduct,
      nombre: 'Producto Test Auditoría ACTUALIZADO',
      stock_actual: 75
    };
    
    await axios.put(`${API_BASE}/products/${productId}`, updatedProduct);
    console.log('✅ Producto actualizado');
    
    // 3. Actualizar solo stock
    console.log('\n3. Actualizando stock...');
    await axios.put(`${API_BASE}/products/${productId}/stock`, { stock_actual: 90 });
    console.log('✅ Stock actualizado');
    
    // 4. Eliminar producto
    console.log('\n4. Eliminando producto...');
    await axios.delete(`${API_BASE}/products/${productId}`);
    console.log('✅ Producto eliminado');
    
    console.log('\n✅ Todas las operaciones de productos completadas');
  } catch (error) {
    console.error('❌ Error en operaciones de productos:', error.response?.data || error.message);
  }
}

// Función principal
async function runTests() {
  console.log('🚀 Iniciando pruebas del sistema de auditoría OPTISTOCK\n');
  
  // Test de conexión
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ No se puede continuar sin conexión al servidor');
    return;
  }
  
  // Test endpoints de auditoría
  await testAuditEndpoints();
  
  // Test operaciones de productos (genera logs)
  await testProductOperations();
  
  // Test final de logs generados
  console.log('\n📊 Verificando logs generados...');
  try {
    const finalLogsResponse = await axios.get(`${API_BASE}/audit/productos?limite=10`);
    const recentLogs = finalLogsResponse.data.data;
    console.log('✅ Logs encontrados:', recentLogs.length);
    
    if (recentLogs.length > 0) {
      console.log('\n📋 Últimos logs generados:');
      recentLogs.slice(0, 3).forEach((log, index) => {
        console.log(`${index + 1}. [${log.accion}] ${log.descripcion} (${new Date(log.fecha_accion).toLocaleString()})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando logs:', error.response?.data || error.message);
  }
  
  console.log('\n🎉 Pruebas completadas');
}

// Ejecutar pruebas
runTests().catch(console.error);
