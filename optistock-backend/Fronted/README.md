# OPTISTOCK - Frontend

Sistema de gestión de inventario moderno construido con React, TypeScript y Vite.

## 🚀 Características

- **Dashboard Interactivo**: Métricas en tiempo real con gráficos dinámicos
- **Gestión de Productos**: CRUD completo con validación y filtros
- **Cálculo EOQ**: Cantidad económica de pedido con recomendaciones
- **Sistema de Alertas**: Notificaciones automáticas por stock bajo
- **CRM de Proveedores**: Gestión y análisis de rendimiento
- **Reportes Avanzados**: Exportación a PDF, Excel y CSV
- **Diseño Responsive**: Optimizado para escritorio y móvil

## 🛠️ Tecnologías

- **React 18** - Biblioteca de UI con hooks
- **TypeScript** - Tipado estático
- **Vite** - Herramienta de build rápida
- **Tailwind CSS** - Framework CSS utilitario
- **React Router** - Navegación SPA
- **Recharts** - Gráficos y visualizaciones
- **Axios** - Cliente HTTP
- **Heroicons** - Iconos SVG
- **Date-fns** - Manipulación de fechas

## 📦 Instalación

### Prerrequisitos
- Node.js 18.0 o superior
- npm 9.0 o superior

### Pasos
1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con la URL de la API:
   ```
   VITE_API_URL=http://localhost:4000/api
   ```

3. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

## 🖥️ Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta ESLint
- `npm run type-check` - Verifica tipos TypeScript

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Layout.tsx      # Layout principal
│   ├── forms/          # Formularios
│   ├── charts/         # Gráficos
│   └── ui/             # Componentes UI básicos
├── pages/              # Páginas principales
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── Products.tsx    # Gestión de productos
│   ├── EOQ.tsx         # Cálculo EOQ
│   ├── Alerts.tsx      # Sistema de alertas
│   ├── Suppliers.tsx   # CRM de proveedores
│   └── Reports.tsx     # Reportes
├── services/           # Servicios API
│   └── api.ts         # Cliente API centralizado
├── types/              # Tipos TypeScript
│   └── index.ts       # Definiciones de tipos
├── hooks/              # Hooks personalizados
├── assets/             # Recursos estáticos
├── styles.css          # Estilos base
└── main.tsx           # Punto de entrada
```

## 🚀 Uso

### Desarrollo
```bash
npm run dev
```
Disponible en `http://localhost:5173`

### Producción
```bash
npm run build
npm run preview
```

## 🎯 Funcionalidades Principales

### Dashboard
- Métricas de inventario en tiempo real
- Gráficos de tendencias
- Alertas críticas
- Productos más vendidos

### Gestión de Productos
- Crear, editar y eliminar productos
- Filtros por categoría
- Búsqueda avanzada
- Control de stock mínimo/máximo

### Cálculo EOQ
- Cálculo automático de cantidad económica
- Recomendaciones de pedidos
- Historial de cálculos
- Visualización de datos

### Sistema de Alertas
- Alertas por stock bajo
- Diferentes niveles de prioridad
- Notificaciones automáticas
- Recomendaciones de acción

### CRM de Proveedores
- Gestión de proveedores
- Evaluación de rendimiento
- Análisis de costos
- Historial de pedidos

### Reportes
- Exportación a PDF, Excel, CSV
- Reportes personalizables
- Análisis de tendencias
- Gráficos interactivos

## 🔧 Configuración

### API Backend
Configurar la URL del backend en `.env`:
```
VITE_API_URL=http://localhost:4000/api
```

### Tailwind CSS
Personalizar colores y estilos en `tailwind.config.js`

## 📱 Diseño Responsive

- Optimizado para dispositivos móviles
- Navegación adaptativa
- Tablas con scroll horizontal
- Formularios touch-friendly

## 🤝 Contribución

1. Fork del repositorio
2. Crear branch feature
3. Hacer cambios con tests
4. Commit con conventional commits
5. Push y crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

**OPTISTOCK** - Sistema de gestión de inventario inteligente 🎯
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
