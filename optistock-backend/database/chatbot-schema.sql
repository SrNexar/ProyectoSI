-- Script para crear la tabla de conversaciones del chatbot
-- Ejecutar en la base de datos PostgreSQL de OptiStock

-- Crear tabla de conversaciones
CREATE TABLE conversaciones_chatbot (
    id SERIAL PRIMARY KEY,
    mensaje_usuario TEXT NOT NULL,
    respuesta_bot TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sesion_id VARCHAR(255),
    usuario_id INTEGER,
    metadata TEXT
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_conversaciones_timestamp ON conversaciones_chatbot(timestamp);
CREATE INDEX idx_conversaciones_sesion ON conversaciones_chatbot(sesion_id);
CREATE INDEX idx_conversaciones_usuario ON conversaciones_chatbot(usuario_id);

-- Insertar algunos ejemplos de conversaciones
INSERT INTO conversaciones_chatbot (mensaje_usuario, respuesta_bot) VALUES
('¿Qué es EOQ?', 'EOQ (Economic Order Quantity) es la cantidad económica de pedido que minimiza los costos totales de inventario.'),
('¿Cuáles son los productos con stock bajo?', 'Para consultar productos con stock bajo, necesito acceder a tu inventario actual.'),
('¿Cómo optimizar mi inventario?', 'Te recomiendo: 1) Implementar cálculos EOQ, 2) Configurar alertas de stock mínimo, 3) Analizar patrones de demanda.');

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla conversaciones_chatbot creada exitosamente' as resultado;

-- Comentarios para documentación
COMMENT ON TABLE conversaciones_chatbot IS 'Almacena las conversaciones entre usuarios y OptiBot';
COMMENT ON COLUMN conversaciones_chatbot.mensaje_usuario IS 'Mensaje enviado por el usuario';
COMMENT ON COLUMN conversaciones_chatbot.respuesta_bot IS 'Respuesta generada por OptiBot';
COMMENT ON COLUMN conversaciones_chatbot.sesion_id IS 'Identificador de sesión para agrupar conversaciones';
COMMENT ON COLUMN conversaciones_chatbot.usuario_id IS 'ID del usuario (si está implementado el sistema de autenticación)';
COMMENT ON COLUMN conversaciones_chatbot.metadata IS 'Datos adicionales en formato JSON (contexto, configuración, etc.)';

-- Insertar algunos ejemplos de conversaciones (opcional)
INSERT INTO conversaciones_chatbot (mensaje_usuario, respuesta_bot, timestamp) VALUES
('¿Qué es EOQ?', 'EOQ (Economic Order Quantity) es la cantidad económica de pedido que minimiza los costos totales de inventario. Se calcula considerando los costos de mantener inventario versus los costos de realizar pedidos.', NOW() - INTERVAL '1 hour'),
('¿Cuáles son los productos con stock bajo?', 'Para consultar productos con stock bajo, necesito acceder a tu inventario actual. Basándome en los datos del sistema, te mostraré los productos que están por debajo del nivel mínimo configurado.', NOW() - INTERVAL '30 minutes'),
('¿Cómo optimizar mi inventario?', 'Para optimizar tu inventario, te recomiendo: 1) Implementar cálculos EOQ, 2) Configurar alertas de stock mínimo, 3) Analizar patrones de demanda, 4) Revisar regularmente los niveles de stock y 5) Mantener buenas relaciones con proveedores.', NOW() - INTERVAL '15 minutes');

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla conversaciones_chatbot creada exitosamente' as resultado;
