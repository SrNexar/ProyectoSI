const express = require('express');
const app = express();
const alertController = require('./controllers/alertController');

async function testRecomendaciones() {
  console.log('🧪 Probando recomendaciones...');
  
  // Simular request y response
  const req = {};
  const res = {
    status: (code) => {
      console.log(`Status: ${code}`);
      return res;
    },
    json: (data) => {
      console.log('📊 Recomendaciones obtenidas:');
      console.log(`Total: ${data.total_recomendaciones}`);
      console.log(`Alta prioridad: ${data.recomendaciones_alta_prioridad}`);
      console.log('\nDetalle de recomendaciones:');
      
      data.recomendaciones.forEach((rec, index) => {
        console.log(`\n${index + 1}. ${rec.nombre} (${rec.categoria})`);
        console.log(`   - Stock actual: ${rec.stock_actual}/${rec.stock_minimo}`);
        console.log(`   - EOQ: ${rec.eoq} unidades`);
        console.log(`   - Frecuencia: ${rec.frecuencia_pedidos} pedidos/año`);
        console.log(`   - Días entre pedidos: ${rec.dias_entre_pedidos}`);
        console.log(`   - Prioridad: ${rec.prioridad}`);
        console.log(`   - Acción: ${rec.accion_recomendada}`);
      });
      
      // Verificar si hay duplicados
      const nombres = data.recomendaciones.map(r => r.nombre);
      const nombresDuplicados = nombres.filter((nombre, index) => nombres.indexOf(nombre) !== index);
      
      if (nombresDuplicados.length > 0) {
        console.log('\n❌ DUPLICADOS ENCONTRADOS:');
        console.log(nombresDuplicados);
      } else {
        console.log('\n✅ No se encontraron duplicados');
      }
    }
  };
  
  try {
    await alertController.generarRecomendaciones(req, res);
  } catch (error) {
    console.error('Error:', error);
  }
}

testRecomendaciones();
