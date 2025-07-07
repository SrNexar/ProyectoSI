const chatbotController = require('./controllers/chatbotController');

// Simular request y response para probar el chatbot
const mockReq = {
  body: {
    mensaje: "¿Cuál es el producto que tengo con más valor?"
  }
};

const mockRes = {
  json: (data) => {
    console.log('🤖 Respuesta del chatbot:');
    console.log('='.repeat(60));
    console.log(data.respuesta);
    console.log('='.repeat(60));
    console.log(`Contexto: ${data.contexto}`);
    console.log(`Timestamp: ${data.timestamp}`);
  },
  status: (code) => {
    console.log(`🔧 Status code: ${code}`);
    return mockRes;
  }
};

async function testChatbotValor() {
  console.log('🤖 Probando chatbot con consulta de valor...');
  console.log('📨 Pregunta:', mockReq.body.mensaje);
  console.log('');
  
  try {
    await chatbotController.chat(mockReq, mockRes);
  } catch (error) {
    console.error('❌ Error en chatbot:', error);
  }
}

testChatbotValor();
