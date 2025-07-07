import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  User, 
  Send, 
  RefreshCw, 
  Download,
  MessageSquare,
  Lightbulb,
  Loader2,
  TrendingUp,
  Package,
  AlertTriangle
} from 'lucide-react';

interface Mensaje {
  id: number;
  contenido: string;
  rol: 'usuario' | 'bot';
  timestamp: Date;
}

interface EstadisticasIA {
  totalConversaciones: number;
  consultasPopulares: string[];
  respuestasGuardadas: number;
}

const ChatbotPage: React.FC = () => {
  const [mensaje, setMensaje] = useState('');
  const [conversacion, setConversacion] = useState<Mensaje[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasIA | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  // Sugerencias predefinidas
  const sugerenciasRapidas = [
    "¿Qué es EOQ y cómo me ayuda?",
    "¿Cuáles son los productos con stock bajo?",
    "¿Cómo optimizar mi inventario?",
    "Explícame las alertas del sistema",
    "¿Cuál es el estado general del inventario?",
    "¿Cómo calcular el punto de reorden?",
    "¿Qué productos necesitan reposición urgente?",
    "¿Cómo reducir costos de almacenamiento?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversacion]);

  useEffect(() => {
    // Cargar estadísticas al montar el componente
    cargarEstadisticas();
    
    // Mensaje de bienvenida
    if (conversacion.length === 0) {
      const mensajeBienvenida: Mensaje = {
        id: Date.now(),
        contenido: `¡Hola! Soy OptiBot, tu asistente inteligente para gestión de inventarios OptiStock. 

Puedo ayudarte con:
• Análisis de productos y stock
• Cálculos de EOQ (Cantidad Económica de Pedido)
• Interpretación de alertas del sistema
• Recomendaciones de optimización
• Consultas sobre tu inventario

¿En qué puedo ayudarte hoy?`,
        rol: 'bot',
        timestamp: new Date()
      };
      setConversacion([mensajeBienvenida]);
    }
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/historial?limite=100`);
      const data = await response.json();
      
      setEstadisticas({
        totalConversaciones: data.total || 0,
        consultasPopulares: [
          "Cálculos EOQ",
          "Stock bajo",
          "Optimización",
          "Alertas",
          "Reposición"
        ],
        respuestasGuardadas: data.total || 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

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
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      const errorMessage: Mensaje = {
        id: Date.now() + 1,
        contenido: 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta nuevamente.',
        rol: 'bot',
        timestamp: new Date()
      };
      setConversacion(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    enviarMensaje();
  };

  const limpiarConversacion = () => {
    setConversacion([]);
    // Volver a mostrar mensaje de bienvenida
    setTimeout(() => {
      const mensajeBienvenida: Mensaje = {
        id: Date.now(),
        contenido: `¡Conversación reiniciada! ¿En qué puedo ayudarte ahora?`,
        rol: 'bot',
        timestamp: new Date()
      };
      setConversacion([mensajeBienvenida]);
    }, 100);
  };

  const exportarConversacion = () => {
    const contenido = conversacion.map(msg => 
      `[${msg.timestamp.toLocaleString()}] ${msg.rol.toUpperCase()}: ${msg.contenido}`
    ).join('\n\n');
    
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversacion-optibot-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatearTiempo = (fecha: Date) => {
    return fecha.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">OptiBot</h1>
                <p className="text-gray-600">Asistente Inteligente para Gestión de Inventarios</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={limpiarConversacion}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Nueva Conversación</span>
              </button>
              <button
                onClick={exportarConversacion}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel lateral con estadísticas y sugerencias */}
          <div className="lg:col-span-1 space-y-6">
            {/* Estadísticas */}
            {estadisticas && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Estadísticas de IA
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Conversaciones</span>
                    <span className="font-semibold">{estadisticas.totalConversaciones}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Respuestas</span>
                    <span className="font-semibold">{estadisticas.respuestasGuardadas}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sugerencias rápidas */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Consultas Frecuentes
              </h3>
              <div className="space-y-2">
                {sugerenciasRapidas.map((sugerencia, index) => (
                  <button
                    key={index}
                    onClick={() => enviarMensaje(sugerencia)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                  >
                    {sugerencia}
                  </button>
                ))}
              </div>
            </div>

            {/* Funcionalidades */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Funcionalidades</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Análisis de Productos</span>
                </div>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Cálculos EOQ</span>
                </div>
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span className="text-sm">Gestión de Alertas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  <span className="text-sm">Recomendaciones</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat principal */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm h-[600px] flex flex-col">
              {/* Header del chat */}
              <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">OptiBot está en línea</span>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversacion.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        msg.rol === 'usuario'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {msg.rol === 'bot' && (
                          <Bot className="w-5 h-5 mt-1 flex-shrink-0" />
                        )}
                        {msg.rol === 'usuario' && (
                          <User className="w-5 h-5 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap">{msg.contenido}</p>
                          <p className={`text-xs mt-2 opacity-70`}>
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
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-5 h-5" />
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm text-gray-600">OptiBot está pensando...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input para enviar mensajes */}
              <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe tu consulta sobre inventario..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !mensaje.trim()}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
