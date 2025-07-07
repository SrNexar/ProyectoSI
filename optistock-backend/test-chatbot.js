const OpenAI = require('openai');
require('dotenv').config();

// Script para probar la configuración del chatbot OptiBot
async function probarChatbot() {
  console.log('🤖 Iniciando prueba del chatbot OptiBot...\n');

  // 1. Verificar variables de entorno
  console.log('1. Verificando configuración...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY no está configurada');
    console.log('   Añade tu clave API de OpenAI al archivo .env');
    return;
  }
  
  console.log('✅ Variables de entorno configuradas');

  // 2. Probar conexión con OpenAI
  console.log('\n2. Probando conexión con OpenAI...');
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres OptiBot, un asistente para gestión de inventarios. Responde con exactamente "Conexión exitosa" para probar la API.'
        },
        {
          role: 'user',
          content: 'Hola, ¿estás funcionando?'
        }
      ],
      max_tokens: 10,
      temperature: 0,
    });

    console.log('✅ Conexión con OpenAI exitosa');
    console.log('   Respuesta:', completion.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ Error conectando con OpenAI:', error.message);
    return;
  }

  // 3. Probar conexión con la base de datos
  console.log('\n3. Probando conexión con la base de datos...');
  
  try {
    const db = require('./models/db');
    
    // Probar consulta básica
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✅ Conexión con la base de datos exitosa');
    console.log('   Timestamp:', result.rows[0].current_time);
    
    // Verificar si existe la tabla de conversaciones
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'conversaciones_chatbot'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabla de conversaciones encontrada');
    } else {
      console.log('⚠️  Tabla de conversaciones no encontrada');
      console.log('   Ejecuta el script database/chatbot-schema.sql');
    }
    
  } catch (error) {
    console.error('❌ Error conectando con la base de datos:', error.message);
    console.log('   Verifica la configuración de la base de datos en .env');
    return;
  }

  // 4. Probar endpoint del chatbot
  console.log('\n4. Probando endpoint del chatbot...');
  
  try {
    const response = await fetch('http://localhost:4000/api/chatbot/info');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint del chatbot accesible');
      console.log('   Nombre:', data.nombre);
      console.log('   Versión:', data.version);
    } else {
      console.log('⚠️  Endpoint del chatbot no responde');
      console.log('   Asegúrate de que el servidor esté ejecutándose');
    }
    
  } catch (error) {
    console.log('⚠️  No se pudo conectar al servidor');
    console.log('   Ejecuta "npm start" para iniciar el servidor');
  }

  // 5. Probar función completa del chatbot
  console.log('\n5. Probando función completa del chatbot...');
  
  try {
    const response = await fetch('http://localhost:4000/api/chatbot/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mensaje: '¿Qué es OptiStock?',
        conversacion: []
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chatbot funcionando correctamente');
      console.log('   Respuesta:', data.respuesta.substring(0, 100) + '...');
    } else {
      console.log('❌ Error en el chatbot');
      const errorData = await response.json();
      console.log('   Error:', errorData.error);
    }
    
  } catch (error) {
    console.log('⚠️  Error probando el chatbot:', error.message);
  }

  console.log('\n🎉 Prueba del chatbot completada!');
  console.log('\nSi todos los tests pasaron, tu chatbot está listo para usar.');
  console.log('Accede a http://localhost:3000/chatbot para probarlo en el frontend.');
}

// Ejecutar las pruebas
probarChatbot().catch(console.error);
