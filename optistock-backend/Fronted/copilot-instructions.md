# Instrucciones para GitHub Copilot - Sistema OPTISTOCK

## Contexto del Proyecto
Este es un sistema completo de gestión de inventario (OPTISTOCK) con:
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Funcionalidades principales**: Cálculo EOQ, alertas automáticas, CRM de proveedores, reportes, dashboard

## Estructura del Proyecto
```
optistock-backend/
├── backend/              # Servidor Node.js/Express
│   ├── controllers/      # Controladores de la API
│   ├── routes/          # Rutas de la API
│   ├── database/        # Scripts SQL y configuración
│   └── index.js         # Punto de entrada del servidor
└── Fronted/             # Aplicación React
    ├── src/
    │   ├── components/  # Componentes reutilizables
    │   ├── pages/       # Páginas principales
    │   ├── services/    # Servicios API
    │   ├── types/       # Tipos TypeScript
    │   └── hooks/       # Hooks personalizados
    └── public/
```

## Estándares de Código

### Frontend (React + TypeScript)
- **Componentes**: Funcionales con hooks
- **Estilos**: Tailwind CSS exclusivamente
- **Tipos**: TypeScript estricto, interfaces en `src/types/index.ts`
- **Estado**: useState/useEffect para estado local, context para estado global
- **Iconos**: Heroicons React (`@heroicons/react/24/outline`)
- **Gráficos**: Recharts para visualizaciones

### Backend (Node.js + Express)
- **Estructura**: Controladores + Rutas separados
- **Base de datos**: PostgreSQL con consultas SQL nativas
- **Validación**: Validación manual en controladores
- **Respuestas**: JSON estructurado con manejo de errores

### Convenciones de Nomenclatura
- **Archivos**: camelCase para TS/JS, kebab-case para otros
- **Variables**: camelCase
- **Funciones**: camelCase, verbos descriptivos
- **Componentes**: PascalCase
- **Tipos**: PascalCase
- **Constantes**: UPPER_SNAKE_CASE

## Patrones Establecidos

### Estructura de Componentes React
```typescript
import React, { useState, useEffect } from 'react';
import { IconName } from '@heroicons/react/24/outline';
import type { TypeName } from '../types';
import api from '../services/api';

const ComponentName: React.FC = () => {
  const [state, setState] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await api.endpoint.method();
      setState(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Contenido del componente */}
    </div>
  );
};

export default ComponentName;
```

### Servicios API
```typescript
export const entityAPI = {
  getAll: async (): Promise<Type[]> => {
    const response = await api.get('/endpoint');
    return response.data;
  },
  
  create: async (data: FormData): Promise<Type> => {
    const response = await api.post('/endpoint', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<FormData>): Promise<Type> => {
    const response = await api.put(`/endpoint/${id}`, data);
    return response.data;
  }
};
```

### Controladores Backend
```javascript
const controllerName = {
  getAll: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM table');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  create: async (req, res) => {
    try {
      const { field1, field2 } = req.body;
      const result = await db.query(
        'INSERT INTO table (field1, field2) VALUES ($1, $2) RETURNING *',
        [field1, field2]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
```

## Funcionalidades Principales

### 1. Gestión de Productos
- CRUD completo
- Validación de stock mínimo/máximo
- Categorización
- Búsqueda y filtrado

### 2. Cálculo EOQ (Economic Order Quantity)
- Cálculo automático basado en demanda, costos
- Historial de cálculos
- Recomendaciones de pedidos

### 3. Sistema de Alertas
- Alertas automáticas por stock bajo
- Niveles de criticidad
- Notificaciones por email

### 4. CRM de Proveedores
- Gestión de proveedores
- Evaluación de rendimiento
- Análisis de costos y tiempos

### 5. Dashboard y Reportes
- Métricas en tiempo real
- Gráficos interactivos
- Exportación PDF/Excel/CSV

## Guías de Implementación

### Añadir Nueva Funcionalidad
1. **Backend**: Crear controlador → Añadir rutas → Actualizar index.js
2. **Frontend**: Crear tipos → Añadir al servicio API → Crear componente/página
3. **Testing**: Probar endpoints → Probar UI → Verificar integración

### Manejo de Errores
- Backend: Try-catch con respuestas JSON estructuradas
- Frontend: Try-catch con console.error y estados de error
- UI: Spinners de carga, mensajes de error amigables

### Optimización
- Lazy loading para componentes grandes
- Memoización para cálculos costosos
- Paginación para listas grandes
- Debouncing para búsquedas

## Dependencias Clave

### Frontend
- React 18+ con hooks
- TypeScript 5+
- Vite como bundler
- Tailwind CSS para estilos
- Axios para HTTP
- React Router para navegación
- Recharts para gráficos
- Heroicons para iconos

### Backend
- Node.js 18+
- Express.js
- PostgreSQL
- Nodemailer para emails
- CORS habilitado

## Comandos Útiles

### Desarrollo
```bash
# Backend
cd backend && npm run dev

# Frontend
cd Fronted && npm run dev

# Ambos en paralelo
npm run dev
```

### Build
```bash
# Frontend
cd Fronted && npm run build

# Preview
cd Fronted && npm run preview
```

## Consideraciones Especiales

### Base de Datos
- Usar transacciones para operaciones críticas
- Índices en campos de búsqueda frecuente
- Validación de integridad referencial

### Seguridad
- Sanitización de inputs
- Validación de tipos de datos
- Manejo seguro de errores (no exponer detalles internos)

### Performance
- Optimización de consultas SQL
- Caching de datos frecuentes
- Lazy loading de componentes
- Optimización de imágenes

### UX/UI
- Diseño responsive (mobile-first)
- Feedback visual para acciones
- Estados de carga claros
- Mensajes de error descriptivos

Esta guía debe ser seguida consistentemente para mantener la calidad y coherencia del código en todo el sistema OPTISTOCK.
