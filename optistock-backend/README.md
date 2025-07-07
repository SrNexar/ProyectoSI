# OptiStock - Sistema de Gestión de Inventario con IA

Sistema completo de gestión de inventario que incluye cálculos EOQ, alertas inteligentes, análisis de productos y un chatbot con IA para asistencia en tiempo real.

## 🚀 Características Principales

### 📊 Gestión de Inventario
- Control de stock en tiempo real
- Gestión de productos y proveedores
- Seguimiento de niveles de inventario
- Alertas de stock bajo y crítico

### 🧮 Cálculos EOQ (Economic Order Quantity)
- Cálculo automático de cantidad económica de pedido
- Optimización de costos de inventario
- Análisis de puntos de reorden
- Recomendaciones de compra

### 🔔 Sistema de Alertas Inteligentes
- Alertas personalizables por producto
- Notificaciones por email
- Dashboard de alertas activas
- Configuración de umbrales

### 🤖 Chatbot con IA (OptiBot)
- Asistente inteligente con OpenAI
- Consultas sobre inventario en lenguaje natural
- Análisis y recomendaciones automáticas
- Integración con datos del sistema

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con Express
- **PostgreSQL** para base de datos
- **OpenAI API** para el chatbot
- **Nodemailer** para notificaciones
- **PDFKit** para reportes

### Frontend
- **React** con TypeScript
- **Tailwind CSS** para estilos
- **Vite** como bundler
- **React Router** para navegación
- **Lucide React** para iconos

## 📋 Requisitos del Sistema

- Node.js 18+ 
- PostgreSQL 12+
- Cuenta de OpenAI con API key
- npm o yarn

## 🔧 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/optistock.git
cd optistock
```

### 2. Configurar el Backend
```bash
cd optistock-backend
npm install
```

Crear archivo `.env`:
```bash
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=optistock
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# OpenAI para chatbot
OPENAI_API_KEY=tu_clave_api_openai

# Servidor
PORT=4000

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password_app
```

### 3. Configurar la Base de Datos
```bash
# Crear la base de datos PostgreSQL
createdb optistock

# Ejecutar scripts SQL
psql -d optistock -f database/chatbot-schema.sql
```

### 4. Configurar el Frontend
```bash
cd ../Fronted
npm install
```

Crear archivo `.env`:
```bash
VITE_API_URL=http://localhost:4000
VITE_CHATBOT_ENABLED=true
```

### 5. Ejecutar el Proyecto
```bash
# Terminal 1: Backend
cd optistock-backend
npm run dev

# Terminal 2: Frontend
cd Fronted
npm run dev
```

## 🤖 Configuración del Chatbot

### 1. Obtener API Key de OpenAI
1. Crear cuenta en https://platform.openai.com/
2. Generar API key en https://platform.openai.com/api-keys
3. Añadir al archivo `.env` del backend

### 2. Probar la Configuración
```bash
cd optistock-backend
npm run test-chatbot
```

### 3. Usar el Chatbot
- **Chatbot flotante**: Disponible en todas las páginas
- **Página dedicada**: Accede a `/chatbot`
- **Consultas ejemplo**:
  - "¿Qué productos tienen stock bajo?"
  - "Calcula el EOQ para el producto X"
  - "¿Cuáles son las alertas activas?"

## 📖 Documentación de la API

### Endpoints Principales

#### Productos
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

#### EOQ
- `GET /api/eoq` - Listar cálculos EOQ
- `POST /api/eoq` - Calcular EOQ

#### Alertas
- `GET /api/alertas` - Listar alertas
- `POST /api/alertas` - Crear alerta
- `GET /api/alertas/dashboard` - Dashboard de alertas

#### Chatbot
- `POST /api/chatbot/chat` - Enviar mensaje al chatbot
- `GET /api/chatbot/sugerencias` - Obtener sugerencias
- `GET /api/chatbot/historial` - Historial de conversaciones

## 🔐 Seguridad y Privacidad

### Datos del Chatbot
- Solo se envía contexto necesario a OpenAI
- No se comparten datos sensibles
- Conversaciones almacenadas localmente
- Configuración de límites de tokens

### Base de Datos
- Conexiones seguras con PostgreSQL
- Validación de entrada en todas las rutas
- Protección contra inyección SQL

## 🚦 Estados del Sistema

### Indicadores de Salud
- **Verde**: Todo funcionando correctamente
- **Amarillo**: Advertencias menores
- **Rojo**: Problemas críticos

### Métricas Monitoreadas
- Conexión a base de datos
- API de OpenAI
- Latencia de respuestas
- Uso de recursos

## 📊 Análisis y Reportes

### Dashboards Disponibles
- **Inventario**: Stock actual, productos críticos
- **EOQ**: Cálculos y recomendaciones
- **Alertas**: Estado de notificaciones
- **Chatbot**: Estadísticas de uso

### Exportación de Datos
- Reportes PDF
- Exportación CSV
- Conversaciones del chatbot
- Análisis histórico

## 🔧 Personalización

### Configuración del Chatbot
Editar `controllers/chatbotController.js` para:
- Personalizar respuestas
- Añadir funcionalidades específicas
- Modificar el contexto del sistema

### Temas y Estilos
- Configuración en `tailwind.config.js`
- Componentes personalizables
- Modo oscuro/claro

## 📈 Escalabilidad

### Optimizaciones Implementadas
- Cache de respuestas frecuentes
- Paginación en consultas grandes
- Índices optimizados en base de datos
- Límites de rate limiting

### Mejoras Futuras
- Clustering para múltiples instancias
- Redis para cache distribuido
- Microservicios para componentes
- Integración con servicios cloud

## 🐛 Solución de Problemas

### Errores Comunes

#### "Cannot connect to database"
```bash
# Verificar PostgreSQL
pg_isready -h localhost -p 5432

# Verificar configuración
cat .env | grep DB_
```

#### "OpenAI API Error"
```bash
# Verificar API key
echo $OPENAI_API_KEY

# Probar conexión
npm run test-chatbot
```

#### "Frontend not loading"
```bash
# Verificar backend
curl http://localhost:4000/api

# Verificar frontend
curl http://localhost:3000
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo de Desarrollo

- **OptiStock Team** - Desarrollo principal
- **J4 Process** - Diseño y arquitectura

## 📞 Soporte

- **Email**: soporte@optistock.com
- **Documentación**: [docs.optistock.com](https://docs.optistock.com)
- **Issues**: [GitHub Issues](https://github.com/optistock/issues)

## 🎯 Roadmap

### Versión 1.1
- [ ] Autenticación de usuarios
- [ ] Roles y permisos
- [ ] API REST completa
- [ ] Pruebas unitarias

### Versión 1.2
- [ ] Análisis predictivo
- [ ] Integración con proveedores
- [ ] Aplicación móvil
- [ ] Notificaciones push

### Versión 2.0
- [ ] Machine Learning para demanda
- [ ] Integración con ERP
- [ ] Multi-almacén
- [ ] Reportes avanzados

---

**¡Gracias por usar OptiStock!** 🚀

Para más información, visita nuestra [documentación completa](CHATBOT-SETUP.md) o contacta al equipo de desarrollo.
