const http = require('http');

async function probarNuevasFuncionalidades() {
  console.log('🚀 PROBANDO NUEVAS FUNCIONALIDADES DE EOQ');
  console.log('='.repeat(60));

  // Lista de endpoints a probar
  const endpoints = [
    {
      nombre: 'Alertas de Stock Alto',
      url: 'http://localhost:4000/api/eoq/alertas-stock-alto',
      metodo: 'GET',
      descripcion: 'Detecta productos con exceso de inventario'
    },
    {
      nombre: 'Recomendaciones de Optimización',
      url: 'http://localhost:4000/api/eoq/recomendaciones',
      metodo: 'GET',
      descripcion: 'Genera recomendaciones para optimizar el inventario'
    },
    {
      nombre: 'Análisis Completo del Inventario',
      url: 'http://localhost:4000/api/eoq/analisis-completo',
      metodo: 'GET',
      descripcion: 'Análisis ABC y métricas generales del inventario'
    },
    {
      nombre: 'Cálculo de Tiempo de Entrega (Producto ID 1)',
      url: 'http://localhost:4000/api/eoq/tiempo-entrega/1',
      metodo: 'POST',
      body: JSON.stringify({ tiempo_entrega_dias: 10 }),
      descripcion: 'Calcula punto de reorden considerando tiempo de entrega'
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Probando: ${endpoint.nombre}`);
    console.log(`📋 ${endpoint.descripcion}`);
    
    try {
      const resultado = await probarEndpoint(endpoint);
      console.log(`✅ ${endpoint.nombre} - Funcionando correctamente`);
      
      // Mostrar un resumen de los resultados
      if (resultado) {
        mostrarResumen(endpoint.nombre, resultado);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.nombre} - Error: ${error.message}`);
    }
    
    console.log('-'.repeat(50));
  }

  console.log('\n🎯 TODAS LAS PRUEBAS COMPLETADAS');
  console.log('\n📊 ENDPOINTS DISPONIBLES:');
  console.log('  GET  /api/eoq/alertas-stock-alto');
  console.log('  GET  /api/eoq/recomendaciones');
  console.log('  GET  /api/eoq/analisis-completo');
  console.log('  POST /api/eoq/tiempo-entrega/:producto_id');
  console.log('  GET  /api/eoq/reporte/:producto_id');
  console.log('  GET  /api/eoq/:producto_id');
}

function probarEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.url);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: endpoint.metodo,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (endpoint.body) {
      options.headers['Content-Length'] = Buffer.byteLength(endpoint.body);
    }

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const resultado = JSON.parse(data);
            resolve(resultado);
          } else {
            reject(new Error(`Status ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Error parsing JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (endpoint.body) {
      req.write(endpoint.body);
    }
    
    req.end();
  });
}

function mostrarResumen(nombreEndpoint, resultado) {
  switch (nombreEndpoint) {
    case 'Alertas de Stock Alto':
      console.log(`   📊 Total de alertas: ${resultado.total_alertas}`);
      console.log(`   💰 Valor en exceso: $${resultado.valor_total_exceso?.toFixed(2) || 0}`);
      if (resultado.alertas && resultado.alertas.length > 0) {
        console.log(`   🚨 Producto más crítico: ${resultado.alertas[0].nombre}`);
      }
      break;
      
    case 'Recomendaciones de Optimización':
      console.log(`   📦 Productos analizados: ${resultado.total_productos_analizados}`);
      console.log(`   ⚡ Con oportunidades: ${resultado.productos_con_oportunidades}`);
      console.log(`   💵 Ahorro potencial: $${resultado.ahorro_total_potencial?.toFixed(2) || 0}`);
      if (resultado.recomendaciones_por_prioridad) {
        console.log(`   🔴 Prioridad ALTA: ${resultado.recomendaciones_por_prioridad.ALTA?.length || 0}`);
        console.log(`   🟡 Prioridad MEDIA: ${resultado.recomendaciones_por_prioridad.MEDIA?.length || 0}`);
      }
      break;
      
    case 'Análisis Completo del Inventario':
      if (resultado.metricas_generales) {
        console.log(`   📦 Total productos: ${resultado.metricas_generales.total_productos}`);
        console.log(`   💰 Valor inventario: $${resultado.metricas_generales.valor_total_inventario}`);
        console.log(`   🚨 Productos críticos: ${resultado.metricas_generales.productos_criticos}`);
        console.log(`   📈 Productos exceso: ${resultado.metricas_generales.productos_exceso}`);
      }
      if (resultado.analisis_abc) {
        console.log(`   🥇 Clase A: ${resultado.analisis_abc.productos_clase_a} productos`);
        console.log(`   🥈 Clase B: ${resultado.analisis_abc.productos_clase_b} productos`);
        console.log(`   🥉 Clase C: ${resultado.analisis_abc.productos_clase_c} productos`);
      }
      break;
      
    case 'Cálculo de Tiempo de Entrega (Producto ID 1)':
      console.log(`   📦 Producto: ${resultado.producto}`);
      console.log(`   📅 Tiempo entrega: ${resultado.tiempo_entrega_dias} días`);
      console.log(`   🎯 Punto de reorden: ${resultado.punto_reorden} unidades`);
      console.log(`   ⚠️  Riesgo quiebre: ${resultado.riesgo_quiebre?.nivel || 'N/A'}`);
      console.log(`   💡 Recomendación: ${resultado.recomendacion?.substring(0, 60) || 'N/A'}...`);
      break;
  }
}

// Función para verificar que el servidor esté funcionando
function verificarServidor() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:4000/', (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        reject(new Error(`Servidor no responde: ${res.statusCode}`));
      }
    });
    
    req.on('error', (error) => {
      reject(new Error(`No se puede conectar al servidor: ${error.message}`));
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout: El servidor no responde'));
    });
  });
}

// Ejecutar pruebas
async function ejecutarPruebas() {
  try {
    console.log('🔍 Verificando servidor...');
    await verificarServidor();
    console.log('✅ Servidor funcionando correctamente\n');
    
    await probarNuevasFuncionalidades();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté funcionando:');
    console.log('   node index.js');
  }
}

ejecutarPruebas();
