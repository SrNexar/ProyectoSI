import { useState, useEffect } from 'react'
import { 
  CubeIcon, 
  ExclamationTriangleIcon, 
  ArrowTrendingUpIcon, 
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { DashboardData } from '../types'
import { alertsAPI } from '../services/api'

// Datos de ejemplo para desarrollo (fallback)
const mockDashboardData: DashboardData = {
  estadisticas_generales: {
    total_productos: 156,
    productos_criticos: 8,
    productos_bajo_stock: 23,
    promedio_stock: 125.5,
    valor_total_inventario: 485000
  },
  productos_criticos: [
    { id: 1, nombre: 'Laptop Dell XPS 13', categoria: 'Electrónicos', stock_actual: 2, stock_minimo: 10, porcentaje_deficit: 80 },
    { id: 2, nombre: 'Mouse Logitech MX', categoria: 'Accesorios', stock_actual: 5, stock_minimo: 15, porcentaje_deficit: 67 },
    { id: 3, nombre: 'Monitor Samsung 24"', categoria: 'Electrónicos', stock_actual: 3, stock_minimo: 8, porcentaje_deficit: 63 }
  ],
  tendencia_alertas: [
    { fecha: '2024-12-01', alertas_generadas: 5 },
    { fecha: '2024-12-02', alertas_generadas: 8 },
    { fecha: '2024-12-03', alertas_generadas: 12 },
    { fecha: '2024-12-04', alertas_generadas: 7 },
    { fecha: '2024-12-05', alertas_generadas: 15 },
    { fecha: '2024-12-06', alertas_generadas: 9 },
    { fecha: '2024-12-07', alertas_generadas: 11 }
  ],
  categorias_con_alertas: [
    { categoria: 'Electrónicos', productos_con_alertas: 12, promedio_stock_categoria: 45.3 },
    { categoria: 'Accesorios', productos_con_alertas: 8, promedio_stock_categoria: 78.2 },
    { categoria: 'Oficina', productos_con_alertas: 5, promedio_stock_categoria: 125.7 }
  ],
  fecha_actualizacion: new Date().toISOString()
}

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316']

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await alertsAPI.getDashboard()
      setDashboardData(data)
    } catch (err) {
      console.error('Error al cargar dashboard:', err)
      setError('Error al cargar los datos del dashboard. Usando datos de ejemplo.')
      setDashboardData(mockDashboardData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value)

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon,
    color = 'blue'
  }: {
    title: string
    value: string | number
    icon: React.ComponentType<{ className?: string }>
    color?: string
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Cargando dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-800">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-2 text-sm text-yellow-600 hover:text-yellow-500 underline"
              >
                Reintentar conexión
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard de Inventario
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Última actualización: {new Date(dashboardData.fecha_actualizacion).toLocaleString()}
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Productos"
          value={dashboardData.estadisticas_generales.total_productos}
          icon={CubeIcon}
          color="blue"
        />
        <StatCard
          title="Productos Críticos"
          value={dashboardData.estadisticas_generales.productos_criticos}
          icon={ExclamationTriangleIcon}
          color="red"
        />
        <StatCard
          title="Stock Bajo"
          value={dashboardData.estadisticas_generales.productos_bajo_stock}
          icon={ArrowTrendingUpIcon}
          color="yellow"
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(dashboardData.estadisticas_generales.valor_total_inventario)}
          icon={CurrencyDollarIcon}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Tendencia de Alertas (Últimos 7 días)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.tendencia_alertas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="alertas_generadas" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Alertas por Categoría
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.categorias_con_alertas}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, productos_con_alertas }) => `${categoria}: ${productos_con_alertas}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="productos_con_alertas"
                >
                  {dashboardData.categorias_con_alertas.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Productos Críticos que Requieren Atención
          </h3>
          <div className="mt-6 flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {dashboardData.productos_criticos.map((producto) => (
                <li key={producto.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {producto.nombre}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {producto.categoria}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        Stock: {producto.stock_actual}/{producto.stock_minimo}
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          {producto.porcentaje_deficit}% déficit
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
