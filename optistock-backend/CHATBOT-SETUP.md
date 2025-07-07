# Configuración del Chatbot OptiBot con OpenAI

Este documento explica cómo configurar y usar el chatbot OptiBot en el sistema OptiStock.

## Requisitos Previos

1. **Cuenta de OpenAI**: Necesitas una cuenta activa en OpenAI con créditos disponibles
2. **Clave API**: Obtén tu clave API desde https://platform.openai.com/api-keys
3. **Base de Datos**: PostgreSQL con las tablas del sistema OptiStock

## Configuración del Backend

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del backend con:

```bash
# Configuración de OpenAI
OPENAI_API_KEY=tu_clave_api_de_openai_aqui

# Configuración de la base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=optistock
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# Configuración del servidor
PORT=4000
```

### 2. Instalación de Dependencias

```bash
npm install openai
```

### 3. Configuración de la Base de Datos

Ejecuta el script SQL para crear la tabla de conversaciones:

```sql
-- Ejecutar en PostgreSQL
-- Archivo: database/chatbot-schema.sql
```

## Configuración del Frontend

### 1. Variables de Entorno

Crea un archivo `.env` en la carpeta Frontend:

```bash
VITE_API_URL=http://localhost:4000
VITE_CHATBOT_ENABLED=true
VITE_CHATBOT_MAX_MESSAGES=50
```

### 2. Instalación de Dependencias

```bash
npm install lucide-react
```

## Funcionalidades del Chatbot

### 1. Análisis de Inventario
- Consultas sobre productos específicos
- Estado del stock actual
- Productos con stock bajo
- Análisis de tendencias

### 2. Cálculos EOQ
- Explicación del concepto EOQ
- Cálculos automáticos
- Interpretación de resultados
- Recomendaciones de optimización

### 3. Gestión de Alertas
- Consultas sobre alertas activas
- Configuración de alertas
- Interpretación de notificaciones
- Acciones recomendadas

### 4. Reportes y Análisis
- Generación de reportes
- Análisis de datos
- Recomendaciones estratégicas
- Optimización de costos

## Uso del Chatbot

### 1. Chatbot Flotante
- Disponible en todas las páginas
- Botón flotante en la esquina inferior derecha
- Ventana emergente con chat

### 2. Página Dedicada
- Ruta: `/chatbot`
- Interfaz completa con estadísticas
- Funciones avanzadas
- Exportación de conversaciones

### 3. Comandos Ejemplos

```
"¿Qué productos tienen stock bajo?"
"Calcula el EOQ para el producto X"
"¿Cuáles son las alertas activas?"
"¿Cómo optimizar mi inventario?"
"Explícame el estado general del sistema"
```

## Personalización

### 1. Contexto del Sistema
El chatbot incluye automáticamente:
- Datos actuales del inventario
- Estadísticas del sistema
- Alertas activas
- Información de productos

### 2. Configuración de Prompts
Edita el archivo `controllers/chatbotController.js` para personalizar:
- Contexto del sistema
- Tone de respuestas
- Funcionalidades específicas

### 3. Integración con Datos
El chatbot accede a:
- Tabla de productos
- Tabla de alertas
- Cálculos EOQ
- Datos de proveedores

## Seguridad y Privacidad

### 1. Protección de Datos
- No se envían datos sensibles a OpenAI
- Solo se incluye información necesaria para el contexto
- Conversaciones almacenadas localmente

### 2. Límites de Uso
- Configuración de límites de tokens
- Control de costos de API
- Filtrado de contenido

### 3. Autenticación
- Integración con sistema de usuarios (futuro)
- Sesiones de chat por usuario
- Historial personalizado

## Monitoreo y Análisis

### 1. Métricas del Chatbot
- Número de conversaciones
- Consultas más frecuentes
- Tiempo de respuesta
- Satisfacción del usuario

### 2. Optimización
- Análisis de patrones de uso
- Mejora de prompts
- Actualización del contexto
- Entrenamiento personalizado

## Solución de Problemas

### 1. Errores Comunes
- **"API Key no válida"**: Verifica la clave en .env
- **"Error de conexión"**: Revisa la configuración de la base de datos
- **"Respuestas lentas"**: Ajusta los límites de tokens

### 2. Logs y Debugging
- Revisa los logs del servidor
- Verifica las consultas SQL
- Monitorea el uso de la API de OpenAI

### 3. Escalabilidad
- Implementar cache para respuestas frecuentes
- Optimizar consultas a la base de datos
- Considerar modelos locales para reducir costos

## Próximas Mejoras

1. **Integración con más datos**: Proveedores, historial de pedidos
2. **Análisis predictivo**: Forecasting de demanda
3. **Automatización**: Acciones automáticas basadas en recomendaciones
4. **Multiidioma**: Soporte para otros idiomas
5. **Voz**: Interfaz de voz para consultas

## Contacto y Soporte

Para soporte técnico o consultas sobre el chatbot:
- Email: soporte@optistock.com
- Documentación: docs.optistock.com
- GitHub: github.com/optistock/chatbot
