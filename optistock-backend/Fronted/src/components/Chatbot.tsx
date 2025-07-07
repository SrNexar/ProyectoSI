import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Lightbulb,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Mensaje {
  id: number;
  contenido: string;
  rol: 'usuario' | 'bot';
  timestamp: Date;
}

interface Sugerencia {
  id: number;
  texto: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [conversacion, setConversacion] = useState<Mensaje[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [showSugerencias, setShowSugerencias] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  // Scroll automático al final de la conversación
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversacion]);

  // Cargar sugerencias al abrir el chatbot
  useEffect(() => {
    if (isOpen && sugerencias.length === 0) {
      cargarSugerencias();
    }
  }, [isOpen]);

  // Cargar sugerencias desde el backend
  const cargarSugerencias = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/sugerencias`);
      const data = await response.json();
      
      if (data.sugerencias) {
        const sugerenciasFormateadas = data.sugerencias.map((texto: string, index: number) => ({
          id: index,
          texto
        }));
        setSugerencias(sugerenciasFormateadas);
      }
    } catch (error) {
      console.error('Error cargando sugerencias:', error);
    }
  };

  // Enviar mensaje al chatbot
  const enviarMensaje = async (textoMensaje?: string) => {
    const textoAEnviar = textoMensaje || mensaje;
    
    if (!textoAEnviar.trim()) return;

    const nuevoMensaje: Mensaje = {
      id: Date.now(),
      contenido: textoAEnviar,
      rol: 'usuario',
      timestamp: new Date()
    };

    setConversacion(prev => [...prev, nuevoMensaje]);
    setMensaje('');
    setIsLoading(true);
    setShowSugerencias(false);

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: textoAEnviar,
          conversacion: conversacion.map(msg => ({
            rol: msg.rol,
            contenido: msg.contenido
          }))
        })
      });

      const data = await response.json();

      if (response.ok && data.respuesta) {
        const respuestaBot: Mensaje = {
          id: Date.now() + 1,
          contenido: data.respuesta,
          rol: 'bot',
          timestamp: new Date()
        };

        setConversacion(prev => [...prev, respuestaBot]);
      } else {
        // Manejo más específico de errores
        const errorInfo = data.error || data.mensaje || 'Error desconocido';
        console.error('Error del servidor:', errorInfo);
        throw new Error(errorInfo);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      
      // Mensajes de error más específicos
      let errorMessage = 'Lo siento, hubo un error procesando tu mensaje.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.';
      } else if (error instanceof Error && error.message.includes('API')) {
        errorMessage = 'Error en la API de IA. Verifica la configuración de OpenAI.';
      } else if (error instanceof Error && error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      const errorResponse: Mensaje = {
        id: Date.now() + 1,
        contenido: errorMessage,
        rol: 'bot',
        timestamp: new Date()
      };
      setConversacion(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    enviarMensaje();
  };

  // Limpiar conversación
  const limpiarConversacion = () => {
    setConversacion([]);
    setShowSugerencias(true);
  };

  // Formatear timestamp
  const formatearTiempo = (fecha: Date) => {
    return fecha.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Botón flotante para abrir/cerrar el chatbot */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Ventana del chatbot */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[32rem] bg-white rounded-lg shadow-2xl z-40 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">OptiBot</h3>
                  <p className="text-sm opacity-90">Asistente de Inventario</p>
                </div>
              </div>
              <button
                onClick={limpiarConversacion}
                className="p-1 hover:bg-blue-700 rounded transition-colors"
                title="Limpiar conversación"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversacion.length === 0 && showSugerencias && (
              <div className="space-y-3">
                <div className="text-center text-gray-500 text-sm">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  ¡Hola! Soy OptiBot, tu asistente para gestión de inventarios.
                  <br />¿En qué puedo ayudarte hoy?
                </div>
                
                {/* Sugerencias */}
                {sugerencias.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Lightbulb className="w-4 h-4" />
                      <span>Sugerencias:</span>
                    </div>
                    {sugerencias.map((sugerencia) => (
                      <button
                        key={sugerencia.id}
                        onClick={() => enviarMensaje(sugerencia.texto)}
                        className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                      >
                        {sugerencia.texto}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mensajes de la conversación */}
            {conversacion.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.rol === 'usuario'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {msg.rol === 'bot' && (
                      <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    {msg.rol === 'usuario' && (
                      <User className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{msg.contenido}</p>
                      <p className={`text-xs mt-1 opacity-70`}>
                        {formatearTiempo(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Indicador de carga */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">Escribiendo...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input para enviar mensajes */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !mensaje.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
