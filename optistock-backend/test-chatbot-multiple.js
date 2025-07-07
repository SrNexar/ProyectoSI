const chatbotController = require('./controllers/chatbotController');

async function testMultiplesPreguntas() {
  const preguntas = [
    "¿Cuál es el producto más caro que tengo?",
    "¿Cuál es el valor total de mi inventario?",
    "¿Qué productos de telefonía tengo?",
    "¿Cuáles son los 3 productos más valiosos?"
  ];

  for (let i = 0; i < preguntas.length; i++) {
    const pregunta = preguntas[i];
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🤖 PREGUNTA ${i + 1}: ${pregunta}`);
    console.log(`${'='.repeat(80)}`);
    
    const mockReq = {
      body: {
        mensaje: pregunta
      }
    };

    const mockRes = {
      json: (data) => {
        console.log('📤 RESPUESTA:');
        console.log(data.respuesta);
        console.log(`\n🔧 Contexto: ${data.contexto}`);
      },
      status: (code) => {
        console.log(`🔧 Status: ${code}`);
        return mockRes;
      }
    };

    try {
      await chatbotController.chat(mockReq, mockRes);
    } catch (error) {
      console.error('❌ Error:', error);
    }
    
    // Esperar un poco entre preguntas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ Todas las pruebas completadas');
  console.log(`${'='.repeat(80)}`);
}

testMultiplesPreguntas();
