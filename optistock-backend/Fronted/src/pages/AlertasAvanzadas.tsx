import { useState, useEffect } from 'react'
import { 
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { eoqAvanzadoAPI } from '../services/api'
import type { 
  AlertasStockAltoResponse, 
  RecomendacionesOptimizacionResponse
} from '../types'

const AlertasAvanzadas = () => {
  const [alertasStockAlto, setAlertasStockAlto] = useState<AlertasStockAltoResponse | null>(null)
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionesOptimizacionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'alertas' | 'recomendaciones'>('alertas')

  const fetchAlertasStockAlto = async () => {
    try {
      setLoading(true)
      const data = await eoqAvanzadoAPI.generarAlertasStockAlto()
      setAlertasStockAlto(data)
    } catch (error) {
      setError('Error al cargar alertas de stock alto')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecomendaciones = async () => {
    try {
      setLoading(true)
      const data = await eoqAvanzadoAPI.obtenerRecomendaciones()
      setRecomendaciones(data)
    } catch (error) {
      setError('Error al cargar recomendaciones')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'alertas') {
      fetchAlertasStockAlto()
    } else if (activeTab === 'recomendaciones') {
      fetchRecomendaciones()
    }
  }, [activeTab])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)

  const getSeverityColor = (nivel: string) => {
    switch (nivel) {
      case 'CRÍTICO': return 'bg-red-100 text-red-800 border-red-200'
      case 'ALTO': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIO': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'BAJO': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'BAJA': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const TabButton = ({ 
    id, 
    label, 
    icon: Icon 
  }: { 
    id: 'alertas' | 'recomendaciones'
    label: string
    icon: React.ComponentType<{ className?: string }>
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors ${
        activeTab === id
          ? 'bg-blue-100 text-blue-700 border-blue-300'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                Alertas y Análisis Avanzado
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Análisis inteligente de inventario con alertas de stock alto, recomendaciones y métricas avanzadas
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => {
                  if (activeTab === 'alertas') fetchAlertasStockAlto()
                  else if (activeTab === 'recomendaciones') fetchRecomendaciones()
                }}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex space-x-4">
            <TabButton id="alertas" label="Alertas Stock Alto" icon={ExclamationTriangleIcon} />
            <TabButton id="recomendaciones" label="Recomendaciones" icon={LightBulbIcon} />
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-gray-600">Cargando datos...</span>
            </div>
          )}

          {/* Tab Content - Alertas Stock Alto */}
          {activeTab === 'alertas' && alertasStockAlto && !loading && (
            <div className="space-y-8">
              {/* Resumen mejorado */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  🚨 Resumen de Alertas de Stock Alto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Productos</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">{alertasStockAlto.resumen.total_productos}</p>
                        <p className="text-xs text-gray-500 mt-1">con exceso de stock</p>
                      </div>
                      <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Valor Exceso</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">{formatCurrency(alertasStockAlto.resumen.valor_total_exceso)}</p>
                        <p className="text-xs text-gray-500 mt-1">dinero inmovilizado</p>
                      </div>
                      <CurrencyDollarIcon className="h-12 w-12 text-orange-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Ahorro Potencial</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(alertasStockAlto.resumen.ahorro_total_potencial)}</p>
                        <p className="text-xs text-gray-500 mt-1">optimizando inventario</p>
                      </div>
                      <CheckCircleIcon className="h-12 w-12 text-green-500" />
                    </div>
                  </div>
                </div>

                {/* Distribución por severidad */}
                <div className="mt-6 bg-white rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    📊 Distribución por Severidad
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Crítico</p>
                      <p className="text-2xl font-bold text-red-600">{alertasStockAlto.resumen.productos_por_severidad.CRÍTICO}</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Alto</p>
                      <p className="text-2xl font-bold text-orange-600">{alertasStockAlto.resumen.productos_por_severidad.ALTO}</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Medio</p>
                      <p className="text-2xl font-bold text-yellow-600">{alertasStockAlto.resumen.productos_por_severidad.MEDIO}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Bajo</p>
                      <p className="text-2xl font-bold text-blue-600">{alertasStockAlto.resumen.productos_por_severidad.BAJO}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Alertas */}
              <div className="space-y-6">
                {alertasStockAlto.alertas.map((alerta) => (
                  <div key={alerta.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                    {/* Encabezado del producto */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{alerta.nombre}</h3>
                        <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full inline-block">
                          {alerta.categoria}
                        </p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getSeverityColor(alerta.nivel_severidad)}`}>
                        {alerta.nivel_severidad}
                      </span>
                    </div>

                    {/* Métricas principales */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                        📊 Métricas de Inventario
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center bg-white rounded-lg p-3 border">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stock Actual</p>
                          <p className="text-2xl font-bold text-blue-600">{alerta.stock_actual.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">unidades</p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">EOQ Óptimo</p>
                          <p className="text-2xl font-bold text-green-600">{alerta.eoq_optimo.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">unidades</p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3 border">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Exceso</p>
                          <p className="text-2xl font-bold text-red-600">+{alerta.exceso_unidades.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">unidades</p>
                        </div>
                      </div>
                    </div>

                    {/* Impacto financiero */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                        💰 Impacto Financiero
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center bg-white rounded-lg p-4 border border-green-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Valor Exceso</p>
                          <p className="text-xl font-bold text-red-600">{formatCurrency(alerta.valor_exceso)}</p>
                          <p className="text-xs text-gray-400">dinero inmovilizado</p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 border border-green-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Inventario Total</p>
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(alerta.valor_inventario_actual)}</p>
                          <p className="text-xs text-gray-400">valor actual</p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-4 border border-green-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ahorro Potencial</p>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(alerta.ahorro_potencial)}</p>
                          <p className="text-xs text-gray-400">optimizando stock</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Recomendación:</p>
                      <p className="text-sm text-gray-600">
                        Reducir inventario en {alerta.exceso_unidades} unidades para optimizar costos de almacenamiento.
                        Ahorro estimado: {formatCurrency(alerta.ahorro_potencial)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content - Recomendaciones */}
          {activeTab === 'recomendaciones' && recomendaciones && !loading && (
            <div className="space-y-8">
              {/* Resumen mejorado de recomendaciones */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  💡 Resumen de Recomendaciones de Optimización
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Productos</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{recomendaciones.resumen.total_productos}</p>
                        <p className="text-xs text-gray-500 mt-1">analizados</p>
                      </div>
                      <ChartBarIcon className="h-12 w-12 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Prioridad Alta</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">{recomendaciones.resumen.productos_por_prioridad.ALTA}</p>
                        <p className="text-xs text-gray-500 mt-1">requieren acción urgente</p>
                      </div>
                      <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Impacto Financiero</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">{formatCurrency(recomendaciones.resumen.impacto_total_financiero)}</p>
                        <p className="text-xs text-gray-500 mt-1">impacto total estimado</p>
                      </div>
                      <CurrencyDollarIcon className="h-12 w-12 text-orange-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Valor Inventario</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(recomendaciones.resumen.valor_total_inventario)}</p>
                        <p className="text-xs text-gray-500 mt-1">valor total gestionado</p>
                      </div>
                      <CheckCircleIcon className="h-12 w-12 text-green-500" />
                    </div>
                  </div>
                </div>

                {/* Distribución por prioridad */}
                <div className="mt-6 bg-white rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    📋 Distribución por Prioridad
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-gray-600 uppercase tracking-wide">Alta Prioridad</p>
                      <p className="text-3xl font-bold text-red-600">{recomendaciones.resumen.productos_por_prioridad.ALTA}</p>
                      <p className="text-xs text-gray-500 mt-1">productos críticos</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-gray-600 uppercase tracking-wide">Media Prioridad</p>
                      <p className="text-3xl font-bold text-yellow-600">{recomendaciones.resumen.productos_por_prioridad.MEDIA}</p>
                      <p className="text-xs text-gray-500 mt-1">requieren atención</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-600 uppercase tracking-wide">Baja Prioridad</p>
                      <p className="text-3xl font-bold text-green-600">{recomendaciones.resumen.productos_por_prioridad.BAJA}</p>
                      <p className="text-xs text-gray-500 mt-1">en buen estado</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recomendaciones por prioridad */}
              {(['ALTA', 'MEDIA', 'BAJA'] as const).map((prioridad) => (
                recomendaciones.recomendaciones_por_prioridad[prioridad].length > 0 && (
                  <div key={prioridad} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">
                        🎯 Prioridad {prioridad}
                      </h3>
                      <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold">
                        {recomendaciones.recomendaciones_por_prioridad[prioridad].length} productos
                      </span>
                    </div>
                    <div className="space-y-6">
                      {recomendaciones.recomendaciones_por_prioridad[prioridad].map((rec) => (
                        <div key={rec.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                          {/* Encabezado del producto */}
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-900 mb-1">{rec.nombre}</h4>
                              <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full inline-block">
                                {rec.categoria}
                              </p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getPriorityColor(rec.prioridad)}`}>
                              {rec.prioridad}
                            </span>
                          </div>

                          {/* Análisis de Stock */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                              📈 Análisis de Stock
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center bg-white rounded-lg p-3 border">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stock Actual</p>
                                <p className="text-2xl font-bold text-blue-600">{rec.stock_actual.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">unidades</p>
                              </div>
                              <div className="text-center bg-white rounded-lg p-3 border">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stock Mínimo</p>
                                <p className="text-2xl font-bold text-yellow-600">{rec.stock_minimo.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">unidades</p>
                              </div>
                              <div className="text-center bg-white rounded-lg p-3 border">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">EOQ Óptimo</p>
                                <p className="text-2xl font-bold text-green-600">{rec.eoq_optimo.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">unidades</p>
                              </div>
                              <div className="text-center bg-white rounded-lg p-3 border">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Diferencia EOQ</p>
                                <p className={`text-2xl font-bold ${rec.diferencia_eoq < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                  {rec.diferencia_eoq > 0 ? '+' : ''}{rec.diferencia_eoq.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-400">vs óptimo</p>
                              </div>
                            </div>
                          </div>

                          {/* Métricas operativas */}
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                              ⚙️ Métricas Operativas
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center bg-white rounded-lg p-4 border border-blue-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Demanda Diaria</p>
                                <p className="text-xl font-bold text-purple-600">{rec.demanda_diaria.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">unidades/día</p>
                              </div>
                              <div className="text-center bg-white rounded-lg p-4 border border-blue-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Días entre Pedidos</p>
                                <p className="text-xl font-bold text-indigo-600">{rec.dias_entre_pedidos}</p>
                                <p className="text-xs text-gray-400">días</p>
                              </div>
                              <div className="text-center bg-white rounded-lg p-4 border border-blue-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Valor Inventario</p>
                                <p className="text-xl font-bold text-blue-600">{formatCurrency(rec.valor_inventario_actual)}</p>
                                <p className="text-xs text-gray-400">valor total</p>
                              </div>
                            </div>
                          </div>

                          {/* Impacto financiero */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                              💰 Impacto Financiero
                            </h5>
                            <div className="text-center bg-white rounded-lg p-4 border border-green-200">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Impacto Estimado</p>
                              <p className="text-2xl font-bold text-green-600">{formatCurrency(rec.impacto_financiero)}</p>
                              <p className="text-xs text-gray-400">ahorro/costo potencial</p>
                            </div>
                          </div>

                          {/* Acción recomendada */}
                          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
                              💡 Acción Recomendada
                            </h5>
                            <div className="bg-white rounded-lg p-4 border border-amber-200">
                              <p className="text-gray-800 leading-relaxed">
                                {rec.accion_recomendada}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlertasAvanzadas
