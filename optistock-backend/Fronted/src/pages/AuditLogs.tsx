import React, { useState, useEffect } from 'react'
import { Eye, Filter, RotateCcw, Download, Search } from 'lucide-react'
import { auditAPI } from '../services/api'
import type { AuditLog, AuditFilters, AuditStats } from '../types'

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  
  // Filtros
  const [filtros, setFiltros] = useState<AuditFilters>({
    limite: 50,
    offset: 0
  })

  // Estados para formulario de filtros
  const [tempFiltros, setTempFiltros] = useState<AuditFilters>({
    limite: 50,
    offset: 0
  })

  useEffect(() => {
    cargarDatos()
  }, [filtros])

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [logsResponse, statsResponse] = await Promise.all([
        auditAPI.getLogs(filtros),
        auditAPI.getStats()
      ])
      
      setLogs(logsResponse.data)
      setStats(statsResponse)
    } catch (err: any) {
      setError('Error al cargar logs de auditoría: ' + (err.response?.data?.error || err.message))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    setFiltros({ ...tempFiltros, offset: 0 })
  }

  const limpiarFiltros = () => {
    const filtrosLimpios = { limite: 50, offset: 0 }
    setTempFiltros(filtrosLimpios)
    setFiltros(filtrosLimpios)
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getBadgeClass = (accion: string) => {
    switch (accion) {
      case 'INSERT':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'DELETE':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium'
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium'
    }
  }

  const getAccionTexto = (accion: string) => {
    switch (accion) {
      case 'INSERT':
        return 'Creado'
      case 'UPDATE':
        return 'Actualizado'
      case 'DELETE':
        return 'Eliminado'
      default:
        return accion
    }
  }

  const verDetalles = (log: AuditLog) => {
    setSelectedLog(log)
    setShowDetails(true)
  }

  const exportarLogs = () => {
    const csv = logs.map(log => ({
      Fecha: formatearFecha(log.fecha_accion),
      Acción: getAccionTexto(log.accion),
      Tabla: log.tabla_afectada,
      ID: log.registro_id || 'N/A',
      Usuario: log.usuario,
      IP: log.ip_address || 'N/A',
      Descripción: log.descripcion || log.detalles || 'N/A'
    }))

    const csvContent = [
      Object.keys(csv[0]).join(','),
      ...csv.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoría</h1>
          <p className="text-gray-600">Historial de cambios en el sistema</p>
        </div>
        <button 
          onClick={exportarLogs} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {stat.tabla_afectada} - {getAccionTexto(stat.accion)}
            </h3>
            <div className="text-2xl font-bold text-gray-900">{stat.cantidad}</div>
            <p className="text-xs text-gray-500">
              Última: {formatearFecha(stat.ultima_accion)}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Filter size={20} />
          Filtros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <select 
            value={tempFiltros.tabla || ''} 
            onChange={(e) => setTempFiltros({...tempFiltros, tabla: e.target.value || undefined})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Todas las tablas</option>
            <option value="productos">Productos</option>
          </select>

          <select 
            value={tempFiltros.accion || ''} 
            onChange={(e) => setTempFiltros({...tempFiltros, accion: e.target.value as any || undefined})}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Todas las acciones</option>
            <option value="INSERT">Crear</option>
            <option value="UPDATE">Actualizar</option>
            <option value="DELETE">Eliminar</option>
          </select>

          <input
            type="date"
            placeholder="Fecha inicio"
            value={tempFiltros.fechaInicio || ''}
            onChange={(e) => setTempFiltros({...tempFiltros, fechaInicio: e.target.value || undefined})}
            className="border border-gray-300 rounded-md px-3 py-2"
          />

          <input
            type="date"
            placeholder="Fecha fin"
            value={tempFiltros.fechaFin || ''}
            onChange={(e) => setTempFiltros({...tempFiltros, fechaFin: e.target.value || undefined})}
            className="border border-gray-300 rounded-md px-3 py-2"
          />

          <button 
            onClick={aplicarFiltros} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 justify-center"
          >
            <Search size={16} />
            Filtrar
          </button>

          <button 
            onClick={limpiarFiltros} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 justify-center"
          >
            <RotateCcw size={16} />
            Limpiar
          </button>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Registros de Auditoría</h2>
          <p className="text-gray-600">
            {loading ? 'Cargando...' : `${logs.length} registros encontrados`}
          </p>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Cargando logs...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron logs con los filtros aplicados
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={getBadgeClass(log.accion)}>
                            {getAccionTexto(log.accion)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {log.tabla_afectada}
                          </span>
                          {log.registro_id && (
                            <span className="text-sm text-gray-500">
                              ID: {log.registro_id}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm mb-1">
                          {log.descripcion || log.detalles || 'Sin descripción'}
                        </p>
                        
                        <div className="text-xs text-gray-500">
                          {formatearFecha(log.fecha_accion)} • Usuario: {log.usuario}
                          {log.ip_address && ` • IP: ${log.ip_address}`}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => verDetalles(log)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md flex items-center gap-1 text-sm"
                      >
                        <Eye size={14} />
                        Ver
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-auto w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">Detalles del Log</h3>
                <button 
                  onClick={() => setShowDetails(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                >
                  Cerrar
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">ID:</label>
                    <p className="text-gray-700">{selectedLog.id}</p>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Acción:</label>
                    <span className={getBadgeClass(selectedLog.accion)}>
                      {getAccionTexto(selectedLog.accion)}
                    </span>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Tabla:</label>
                    <p className="text-gray-700">{selectedLog.tabla_afectada}</p>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">ID Registro:</label>
                    <p className="text-gray-700">{selectedLog.registro_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Usuario:</label>
                    <p className="text-gray-700">{selectedLog.usuario}</p>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Fecha:</label>
                    <p className="text-gray-700">{formatearFecha(selectedLog.fecha_accion)}</p>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">IP:</label>
                    <p className="text-gray-700">{selectedLog.ip_address || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="font-semibold block mb-1">User Agent:</label>
                    <p className="text-xs text-gray-600 break-all">{selectedLog.user_agent || 'N/A'}</p>
                  </div>
                </div>

                {selectedLog.detalles && (
                  <div>
                    <label className="font-semibold block mb-1">Detalles:</label>
                    <p className="text-gray-700">{selectedLog.detalles}</p>
                  </div>
                )}

                {selectedLog.datos_anteriores && (
                  <div>
                    <label className="font-semibold block mb-1">Datos Anteriores:</label>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto border">
                      {JSON.stringify(selectedLog.datos_anteriores, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.datos_nuevos && (
                  <div>
                    <label className="font-semibold block mb-1">Datos Nuevos:</label>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto border">
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
