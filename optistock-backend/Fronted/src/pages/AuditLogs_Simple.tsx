import React, { useState, useEffect } from 'react'
import { auditAPI, formatApiError } from '../services/api'
import type { AuditLog, AuditFilters, AuditStats } from '../types'

// Componente simple para mostrar estadísticas
const StatCard: React.FC<{ title: string; value: number; subtitle: string }> = ({ title, value, subtitle }) => (
  <div className="bg-white p-4 rounded-lg shadow border">
    <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </div>
)

// Componente simple para badge de acción
const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
  const getClass = () => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getText = () => {
    switch (action) {
      case 'INSERT':
        return 'Creado'
      case 'UPDATE':
        return 'Actualizado'
      case 'DELETE':
        return 'Eliminado'
      default:
        return action
    }
  }

  return (
    <span className={`${getClass()} px-2 py-1 rounded-full text-xs font-medium`}>
      {getText()}
    </span>
  )
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros
  const [filters, setFilters] = useState<AuditFilters>({
    limite: 50,
    offset: 0
  })
  
  // Estados temporales para el formulario
  const [tempFilters, setTempFilters] = useState<AuditFilters>({
    limite: 50,
    offset: 0
  })

  // Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [logsResponse, statsResponse] = await Promise.all([
        auditAPI.getLogs(filters),
        auditAPI.getStats()
      ])
      
      setLogs(logsResponse.data)
      setStats(statsResponse)
    } catch (err: any) {
      setError(`Error al cargar datos: ${formatApiError(err)}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    setFilters({ ...tempFilters, offset: 0 })
  }

  const clearFilters = () => {
    const cleanFilters = { limite: 50, offset: 0 }
    setTempFilters(cleanFilters)
    setFilters(cleanFilters)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES')
  }

  const exportToCsv = () => {
    if (logs.length === 0) return

    const csvData = logs.map(log => ({
      Fecha: formatDate(log.fecha_accion),
      Acción: log.accion === 'INSERT' ? 'Creado' : log.accion === 'UPDATE' ? 'Actualizado' : 'Eliminado',
      Tabla: log.tabla_afectada,
      ID: log.registro_id || 'N/A',
      Usuario: log.usuario,
      Descripción: log.descripcion || log.detalles || 'N/A'
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading && logs.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando logs de auditoría...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoría</h1>
          <p className="text-gray-600">Historial de cambios en el sistema</p>
        </div>
        <button 
          onClick={exportToCsv} 
          disabled={logs.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
        >
          📥 Exportar CSV
        </button>
      </div>

      {/* Estadísticas */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={`${stat.tabla_afectada} - ${stat.accion === 'INSERT' ? 'Creado' : stat.accion === 'UPDATE' ? 'Actualizado' : 'Eliminado'}`}
              value={stat.cantidad}
              subtitle={`Última: ${formatDate(stat.ultima_accion)}`}
            />
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">🔍 Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select 
            value={tempFilters.accion || ''} 
            onChange={(e) => setTempFilters({...tempFilters, accion: (e.target.value || undefined) as any})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Todas las acciones</option>
            <option value="INSERT">Crear</option>
            <option value="UPDATE">Actualizar</option>
            <option value="DELETE">Eliminar</option>
          </select>

          <input
            type="date"
            value={tempFilters.fechaInicio || ''}
            onChange={(e) => setTempFilters({...tempFilters, fechaInicio: e.target.value || undefined})}
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="Fecha inicio"
          />

          <input
            type="date"
            value={tempFilters.fechaFin || ''}
            onChange={(e) => setTempFilters({...tempFilters, fechaFin: e.target.value || undefined})}
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="Fecha fin"
          />

          <button 
            onClick={applyFilters} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            🔍 Filtrar
          </button>

          <button 
            onClick={clearFilters} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
          >
            🔄 Limpiar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ❌ {error}
        </div>
      )}

      {/* Lista de Logs */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">📋 Registros de Auditoría</h2>
          <p className="text-gray-600">
            {loading ? 'Cargando...' : `${logs.length} registros encontrados`}
          </p>
        </div>
        
        <div className="p-6">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? (
                <div className="animate-pulse">Cargando logs...</div>
              ) : (
                '📄 No se encontraron logs con los filtros aplicados'
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <ActionBadge action={log.accion} />
                        <span className="text-sm text-gray-600 font-medium">
                          {log.tabla_afectada}
                        </span>
                        {log.registro_id && (
                          <span className="text-sm text-gray-500">
                            ID: {log.registro_id}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm mb-2 text-gray-800">
                        {log.descripcion || log.detalles || 'Sin descripción disponible'}
                      </p>
                      
                      <div className="text-xs text-gray-500">
                        🕒 {formatDate(log.fecha_accion)} • 👤 {log.usuario}
                        {log.ip_address && ` • 🌐 ${log.ip_address}`}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm"
                    >
                      👁️ Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-auto w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold">📋 Detalles del Log #{selectedLog.id}</h3>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                >
                  ✕ Cerrar
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="font-semibold text-gray-700">🆔 ID del Log:</label>
                      <p className="text-gray-600">{selectedLog.id}</p>
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700">⚡ Acción:</label>
                      <div className="mt-1">
                        <ActionBadge action={selectedLog.accion} />
                      </div>
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700">🗂️ Tabla:</label>
                      <p className="text-gray-600">{selectedLog.tabla_afectada}</p>
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700">🔢 ID Registro:</label>
                      <p className="text-gray-600">{selectedLog.registro_id || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="font-semibold text-gray-700">👤 Usuario:</label>
                      <p className="text-gray-600">{selectedLog.usuario}</p>
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700">🕒 Fecha:</label>
                      <p className="text-gray-600">{formatDate(selectedLog.fecha_accion)}</p>
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700">🌐 IP:</label>
                      <p className="text-gray-600">{selectedLog.ip_address || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700">🖥️ Navegador:</label>
                      <p className="text-xs text-gray-600 break-all">{selectedLog.user_agent || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Detalles adicionales */}
                {selectedLog.detalles && (
                  <div>
                    <label className="font-semibold text-gray-700 block mb-2">📝 Detalles:</label>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded border">{selectedLog.detalles}</p>
                  </div>
                )}

                {/* Datos anteriores */}
                {selectedLog.datos_anteriores && (
                  <div>
                    <label className="font-semibold text-gray-700 block mb-2">📋 Datos Anteriores:</label>
                    <pre className="bg-red-50 border border-red-200 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.datos_anteriores, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Datos nuevos */}
                {selectedLog.datos_nuevos && (
                  <div>
                    <label className="font-semibold text-gray-700 block mb-2">📋 Datos Nuevos:</label>
                    <pre className="bg-green-50 border border-green-200 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.datos_nuevos, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLogs
