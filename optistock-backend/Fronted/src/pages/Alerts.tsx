import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import type { Alert, ReorderRecommendation } from '../types';
import api from '../services/api';

type AlertFilter = 'all' | 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<ReorderRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<AlertFilter>('all');
  const [alertStats, setAlertStats] = useState({
    total_alertas: 0,
    alertas_criticas: 0,
    alertas_bajas: 0
  });

  useEffect(() => {
    fetchAlertsAndRecommendations();
  }, []);

  const fetchAlertsAndRecommendations = async () => {
    try {
      const [alertsData, recommendationsData] = await Promise.all([
        api.alerts.getAll(),
        api.alerts.getRecommendations()
      ]);

      setAlerts(alertsData.alertas);
      setAlertStats({
        total_alertas: alertsData.total_alertas,
        alertas_criticas: alertsData.alertas_criticas,
        alertas_bajas: alertsData.alertas_bajas
      });
      setRecommendations(recommendationsData.recomendaciones);
    } catch (error) {
      console.error('Error fetching alerts and recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'CRITICO':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'ALTO':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'MEDIO':
        return <BellIcon className="h-5 w-5 text-yellow-500" />;
      case 'BAJO':
        return <BellIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'CRITICO':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ALTO':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAJO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ALTA':
        return 'bg-red-100 text-red-800';
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800';
      case 'BAJA':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterLevel === 'all' || alert.nivel_alerta === filterLevel;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Alertas y Recomendaciones</h1>
        <button
          onClick={fetchAlertsAndRecommendations}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <ClockIcon className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Alertas</div>
              <div className="text-2xl font-bold text-gray-900">{alertStats.total_alertas}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Alertas Críticas</div>
              <div className="text-2xl font-bold text-red-600">{alertStats.alertas_criticas}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BellIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Alertas Bajas</div>
              <div className="text-2xl font-bold text-blue-600">{alertStats.alertas_bajas}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as AlertFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las alertas</option>
              <option value="CRITICO">Críticas</option>
              <option value="ALTO">Altas</option>
              <option value="MEDIO">Medias</option>
              <option value="BAJO">Bajas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Alertas de Stock</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Mínimo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nivel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mensaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EOQ Sugerido
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{alert.nombre}</div>
                      <div className="text-sm text-gray-500">{alert.categoria}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {alert.stock_actual}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {alert.stock_minimo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.nivel_alerta)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getAlertColor(alert.nivel_alerta)}`}>
                        {alert.nivel_alerta}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {alert.mensaje_alerta}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {alert.eoq_sugerido}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recomendaciones de Reorden</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 9).map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{rec.nombre}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rec.prioridad)}`}>
                    {rec.prioridad}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{rec.categoria}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock Actual:</span>
                    <span className="font-medium">{rec.stock_actual}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock Mínimo:</span>
                    <span className="font-medium">{rec.stock_minimo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">EOQ:</span>
                    <span className="font-medium">{rec.eoq}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Días entre pedidos:</span>
                    <span className="font-medium">{rec.dias_entre_pedidos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo anual:</span>
                    <span className="font-medium">${rec.costo_total_anual.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    {rec.accion_recomendada}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
