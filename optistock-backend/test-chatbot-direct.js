const chatbotController = require('./controllers/chatbotController');

// Simular request y response para probar el chatbot
const mockReq = {
  body: {
    mensaje: "¿Qué productos tienen stock bajo?"
  }
};

const mockRes = {
  json: (data) => {
    console.log('📤 Respuesta del chatbot:');
    console.log(JSON.stringify(data, null, 2));
  },
  status: (code) => {
    console.log(`🔧 Status code: ${code}`);
    return mockRes;
  }
};

async function testChatbot() {
  console.log('🤖 Probando chatbot con consulta de stock bajo...');
  console.log('📨 Mensaje:', mockReq.body.mensaje);
  
  try {
    await chatbotController.chat(mockReq, mockRes);
  } catch (error) {
    console.error('❌ Error en chatbot:', error);
  }
}

testChatbot();
