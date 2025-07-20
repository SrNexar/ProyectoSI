import axios from 'axios'
import type {
  Product,
  ProductFormData,
  EOQCalculation,
  EOQRecommendation,
  EOQHistory,
  AlertsResponse,
  RecommendationsResponse,
  DashboardData,
  NotificationRequest,
  NotificationResponse,
  Alert,
  AuditLog,
  AuditFilters,
  AuditStats
} from '../types'

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos timeout
})

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    if (error.response?.status === 404) {
      console.warn('Recurso no encontrado')
    } else if (error.response?.status === 500) {
      console.error('Error interno del servidor')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('No se puede conectar al servidor. Verifica que el backend esté ejecutándose.')
    }
    return Promise.reject(error)
  }
)

// Test de conectividad
export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await api.get('/')
    return response.status === 200
  } catch (error) {
    console.error('Error de conexión:', error)
    return false
  }
}

// 🛍️ PRODUCTOS API
export const productsAPI = {
  // Obtener todos los productos
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/products')
    return response.data
  },

  // Obtener producto por ID
  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },

  // Crear nuevo producto
  create: async (product: ProductFormData): Promise<Product> => {
    const response = await api.post('/products', product)
    return response.data
  },

  // Actualizar producto
  update: async (id: number, product: Partial<ProductFormData>): Promise<Product> => {
    const response = await api.put(`/products/${id}`, product)
    return response.data
  },

  // Eliminar producto
  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`)
  },

  // Actualizar stock
  updateStock: async (id: number, stock: number): Promise<Product> => {
    const response = await api.patch(`/products/${id}/stock`, { stock_actual: stock })
    return response.data
  },

  // Buscar productos
  search: async (query: string): Promise<Product[]> => {
    const response = await api.get(`/products/search?q=${encodeURIComponent(query)}`)
    return response.data
  },

  // Obtener productos por categoría
  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await api.get(`/products/category/${encodeURIComponent(category)}`)
    return response.data
  },

  // Obtener productos con stock bajo
  getLowStock: async (): Promise<Product[]> => {
    const response = await api.get('/products/low-stock')
    return response.data
  }
}

// 📊 EOQ API
export const eoqAPI = {
  // Calcular EOQ para un producto
  calculate: async (productId: number): Promise<EOQCalculation> => {
    const response = await api.get(`/eoq/${productId}`)
    return response.data
  },

  // Obtener historial de cálculos EOQ
  getHistory: async (productId: number): Promise<EOQHistory[]> => {
    const response = await api.get(`/eoq/historial/${productId}`)
    return response.data
  },

  // Obtener recomendación de reabastecimiento
  getRecommendation: async (productId: number): Promise<EOQRecommendation> => {
    const response = await api.get(`/eoq/recomendacion/${productId}`)
    return response.data
  },

  // Generar reporte EOQ en PDF
  generateReport: async (productId: number): Promise<Blob> => {
    const response = await api.get(`/eoq/reporte/${productId}`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Generar reporte EOQ masivo en PDF
  generateMassiveReport: async (): Promise<Blob> => {
    const response = await api.get('/eoq/reporte-masivo', {
      responseType: 'blob'
    })
    return response.data
  }
}

// 🚨 ALERTAS API
export const alertsAPI = {
  // Obtener todas las alertas activas
  getAll: async (): Promise<AlertsResponse> => {
    const response = await api.get('/alertas')
    return response.data
  },

  // Obtener dashboard de alertas
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get('/alertas/dashboard')
    return response.data
  },

  // Obtener recomendaciones de reabastecimiento
  getRecommendations: async (): Promise<RecommendationsResponse> => {
    const response = await api.get('/alertas/recomendaciones')
    return response.data
  },

  // Enviar notificación por email
  sendNotification: async (notification: NotificationRequest): Promise<NotificationResponse> => {
    const response = await api.post('/alertas/notificar', notification)
    return response.data
  },

  // Crear alerta personalizada
  createCustomAlert: async (alert: Alert): Promise<any> => {
    const response = await api.post('/alertas/personalizada', alert)
    return response.data
  },

  // Descargar reporte de alertas en PDF
  downloadAlertsPDF: async (): Promise<Blob> => {
    const response = await api.get('/alertas/reporte/pdf', {
      responseType: 'blob'
    })
    return response.data
  }
}

// EOQ Avanzado API
export const eoqAvanzadoAPI = {
  // Generar alertas por stock alto
  generarAlertasStockAlto: async (): Promise<any> => {
    const response = await api.get('/eoq/alertas-stock-alto')
    return response.data
  },

  // Obtener recomendaciones de optimización
  obtenerRecomendaciones: async (): Promise<any> => {
    const response = await api.get('/eoq/recomendaciones')
    return response.data
  },

  // Calcular tiempo de entrega para un producto
  calcularTiempoEntrega: async (productoId: number, tiempoEntregaDias?: number): Promise<any> => {
    const response = await api.post(`/eoq/tiempo-entrega/${productoId}`, {
      tiempo_entrega_dias: tiempoEntregaDias
    })
    return response.data
  },

  // Análisis completo del inventario
  analisisInventarioCompleto: async (): Promise<any> => {
    const response = await api.get('/eoq/analisis-completo')
    return response.data
  }
}

// Reportes API
export const reportsAPI = {
  // Resumen de inventario (PDF o JSON)
  getInventorySummary: async (format: 'pdf' | 'json' = 'json'): Promise<any> => {
    if (format === 'pdf') {
      const response = await api.get('/products/summary', {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' }
      });
      return response.data;
    } else {
      const response = await api.get('/products/summary');
      return response.data;
    }
  },
  // Productos más críticos (EOQ)
  getMostCriticalProducts: async (): Promise<any> => {
    const response = await api.get('/products/critical')
    return response.data
  }
}

// ===== API de Auditoría =====
export const auditAPI = {
  // Obtener logs de auditoría con filtros
  getLogs: async (filtros?: AuditFilters): Promise<{ data: AuditLog[], total: number }> => {
    const params = new URLSearchParams()
    if (filtros?.tabla) params.append('tabla', filtros.tabla)
    if (filtros?.accion) params.append('accion', filtros.accion)
    if (filtros?.registroId) params.append('registroId', filtros.registroId.toString())
    if (filtros?.usuario) params.append('usuario', filtros.usuario)
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio)
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin)
    if (filtros?.limite) params.append('limite', filtros.limite.toString())
    if (filtros?.offset) params.append('offset', filtros.offset.toString())

    const response = await api.get(`/audit/logs?${params.toString()}`)
    return {
      data: response.data.data || [],
      total: response.data.total || 0
    }
  },

  // Obtener logs específicos de productos
  getProductLogs: async (filtros?: Omit<AuditFilters, 'tabla'>): Promise<{ data: AuditLog[], total: number }> => {
    const params = new URLSearchParams()
    if (filtros?.accion) params.append('accion', filtros.accion)
    if (filtros?.registroId) params.append('registroId', filtros.registroId.toString())
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio)
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin)
    if (filtros?.limite) params.append('limite', filtros.limite.toString())
    if (filtros?.offset) params.append('offset', filtros.offset.toString())

    const response = await api.get(`/audit/productos?${params.toString()}`)
    return {
      data: response.data.data || [],
      total: response.data.total || 0
    }
  },

  // Obtener estadísticas de auditoría
  getStats: async (): Promise<AuditStats[]> => {
    const response = await api.get('/audit/estadisticas')
    return response.data.data || []
  },

  // Obtener historial de un registro específico
  getRecordHistory: async (tabla: string, id: number): Promise<AuditLog[]> => {
    const response = await api.get(`/audit/historial/${tabla}/${id}`)
    return response.data.data || []
  }
}

// Función helper para formatear errores de API
export const formatApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.response?.data?.mensaje) {
    return error.response.data.mensaje
  }
  if (error.message) {
    return error.message
  }
  return 'Error desconocido en la API'
}

// Exportar todo como default
export default {
  products: productsAPI,
  eoq: eoqAPI,
  eoqAvanzado: eoqAvanzadoAPI,
  alerts: alertsAPI,
  reports: reportsAPI,
  audit: auditAPI,
  formatApiError
}
