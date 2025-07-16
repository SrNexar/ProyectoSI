// Tipos para Productos
export interface Product {
  id: number
  nombre: string
  categoria?: string
  descripcion?: string
  costo_unitario: string | number
  precio_unitario?: string | number
  stock_actual: number
  stock_minimo: number
  stock_maximo?: number
  punto_reorden?: number
  demanda_anual: number
  costo_pedido: string | number
  costo_mantenimiento: string | number
  unidad_medida?: string
  codigo_barras?: string
  ubicacion?: string
  fecha_creacion?: string
  fecha_actualizacion?: string
  fecha_ultima_actualizacion?: string
}

export interface ProductFormData {
  nombre: string
  categoria?: string
  costo_unitario: number
  stock_actual: number
  stock_minimo: number
  stock_maximo?: number
  demanda_anual: number
  costo_pedido: number
  costo_mantenimiento: number
}

// Tipos para EOQ
export interface EOQCalculation {
  producto: string
  eoq: number
  costo_total_estimado: number
  calculo_id: number
}

export interface EOQRecommendation {
  producto: string
  cantidad_a_pedir: number
  pedidos_al_anio: number
  dias_entre_pedidos: number
  sugerencia: string
}

export interface EOQHistory {
  id: number
  fecha: string
  eoq_resultado: number
  costo_total_estimado: number
  nombre_producto: string
}

// Tipos para Alertas
export interface Alert {
  id: number
  nombre: string
  categoria: string
  stock_actual: number
  stock_minimo: number
  nivel_alerta: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO'
  mensaje_alerta: string
  eoq_sugerido: number
}

export interface AlertsResponse {
  total_alertas: number
  alertas_criticas: number
  alertas_bajas: number
  alertas: Alert[]
}

export interface ReorderRecommendation {
  id: number
  nombre: string
  categoria: string
  stock_actual: number
  stock_minimo: number
  eoq: number
  frecuencia_pedidos: number
  dias_entre_pedidos: number
  costo_total_anual: number
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
  accion_recomendada: string
}

export interface RecommendationsResponse {
  total_recomendaciones: number
  recomendaciones_alta_prioridad: number
  recomendaciones: ReorderRecommendation[]
}

// Nuevos tipos para EOQ Avanzado
export interface AlertaStockAlto {
  id: number
  nombre: string
  categoria: string
  stock_actual: number
  eoq_optimo: number
  exceso_unidades: number
  valor_exceso: number
  porcentaje_exceso: number
  nivel_severidad: 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO'
  valor_inventario_actual: number
  valor_inventario_optimo: number
  ahorro_potencial: number
}

export interface AlertasStockAltoResponse {
  resumen: {
    total_productos: number
    valor_total_exceso: number
    ahorro_total_potencial: number
    productos_por_severidad: {
      CRÍTICO: number
      ALTO: number
      MEDIO: number
      BAJO: number
    }
  }
  alertas_por_severidad: {
    CRÍTICO: AlertaStockAlto[]
    ALTO: AlertaStockAlto[]
    MEDIO: AlertaStockAlto[]
    BAJO: AlertaStockAlto[]
  }
  alertas: AlertaStockAlto[]
}

export interface RecomendacionOptimizacion {
  id: number
  nombre: string
  categoria: string
  stock_actual: number
  stock_minimo: number
  eoq_optimo: number
  diferencia_eoq: number
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
  accion_recomendada: string
  impacto_financiero: number
  demanda_diaria: number
  dias_entre_pedidos: number
  costo_total_optimo: number
  valor_inventario_actual: number
}

export interface RecomendacionesOptimizacionResponse {
  resumen: {
    total_productos: number
    productos_por_prioridad: {
      ALTA: number
      MEDIA: number
      BAJA: number
    }
    impacto_total_financiero: number
    valor_total_inventario: number
  }
  recomendaciones_por_prioridad: {
    ALTA: RecomendacionOptimizacion[]
    MEDIA: RecomendacionOptimizacion[]
    BAJA: RecomendacionOptimizacion[]
  }
  recomendaciones: RecomendacionOptimizacion[]
}

export interface TiempoEntregaResponse {
  producto: string
  tiempo_entrega_dias: number
  demanda_diaria: number
  demanda_durante_entrega: number
  stock_seguridad: number
  punto_reorden: number
  stock_actual: number
  eoq_optimo: number
  dias_entre_pedidos: number
  riesgo_quiebre: {
    nivel: 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO'
    descripcion: string
    dias_restantes: number
  }
  recomendacion: string
  fecha_calculo: string
}

export interface AnalisisInventarioCompleto {
  metricas_generales: {
    total_productos: number
    valor_total_inventario: number
    stock_promedio: number
    productos_criticos: number
    productos_exceso: number
  }
  analisis_abc: {
    productos_clase_a: number
    productos_clase_b: number
    productos_clase_c: number
    detalle: any[]
  }
  rotacion_inventario: {
    mejor_rotacion: any[]
    peor_rotacion: any[]
  }
  recomendaciones_estrategicas: any[]
  fecha_analisis: string
}

// Tipos para Dashboard
export interface DashboardStats {
  total_productos: number
  productos_criticos: number
  productos_bajo_stock: number
  promedio_stock: number
  valor_total_inventario: number
}

export interface CriticalProduct {
  id: number
  nombre: string
  categoria: string
  stock_actual: number
  stock_minimo: number
  porcentaje_deficit: number
}

export interface AlertTrend {
  fecha: string
  alertas_generadas: number
}

export interface CategoryAlert {
  categoria: string
  productos_con_alertas: number
  promedio_stock_categoria: number
}

export interface DashboardData {
  estadisticas_generales: DashboardStats
  productos_criticos: CriticalProduct[]
  tendencia_alertas: AlertTrend[]
  categorias_con_alertas: CategoryAlert[]
  fecha_actualizacion: string
}

// Tipos para Alertas Personalizadas
export interface CustomAlert {
  id: number
  producto_id: number
  tipo_alerta: string
  umbral: number
  mensaje?: string
  activa: boolean
  fecha_creacion?: string
  fecha_actualizacion?: string
  // Datos relacionados
  producto_nombre?: string
}

export interface CustomAlertFormData {
  producto_id: number
  tipo_alerta: string
  umbral: number
  mensaje?: string
  activa: boolean
}

// Tipos para Historial de Alertas
export interface AlertHistory {
  id: number
  producto_id: number
  tipo_alerta: string
  mensaje?: string
  nivel_urgencia: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  estado: 'PENDIENTE' | 'REVISADA' | 'RESUELTA' | 'IGNORADA'
  fecha_generacion?: string
  fecha_resolucion?: string
  // Datos relacionados
  producto_nombre?: string
}

// Tipos para Vista de Alertas Activas
export interface ActiveAlert {
  id: number
  nombre: string
  categoria?: string
  stock_actual: number
  stock_minimo: number
  punto_reorden?: number
  nivel_alerta: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO'
  mensaje_alerta: string
  fecha_ultima_actualizacion?: string
}

// Tipos para reportes de alertas
export interface AlertReport {
  total_alertas: number
  alertas_criticas: number
  alertas_altas: number
  alertas_medias: number
  alertas_por_categoria: {
    categoria: string
    total: number
  }[]
  productos_criticos: ActiveAlert[]
}

// Tipos para notificaciones
export interface NotificationRequest {
  email: string
  asunto: string
  mensaje: string
}

export interface NotificationResponse {
  mensaje: string
  email: string
  fecha: string
}

// Tipos para API Response generales
export interface ApiResponse<T> {
  data?: T
  mensaje?: string
  error?: string
}

// Tipos para navegación
export interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  current?: boolean
}

// Tipos para formularios
export interface FormErrors {
  [key: string]: string | undefined
}

// Tipos para estados de carga
export interface LoadingState {
  isLoading: boolean
}
