import React, { useState, useEffect } from 'react';
import { 
  DocumentArrowDownIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { Product, Alert } from '../types';
import api from '../services/api';

// Solo reportes de inventario, EOQ y alertas
// Eliminado suppliers

type ReportType = 'inventory' | 'eoq' | 'alerts';
type ReportFormat = 'pdf' | 'excel' | 'csv';

const Reports: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType>('inventory');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, alertsData] = await Promise.all([
        api.products.getAll(),
        api.alerts.getAll()
      ]);

      setProducts(productsData);
      setAlerts(alertsData.alertas || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (format: ReportFormat) => {
    setGeneratingReport(true);
    try {
      let blob;
      switch (selectedReport) {
        case 'inventory':
          if (format === 'pdf') {
            blob = await api.reports.getInventorySummary('pdf');
          } else {
            const reportData = await api.reports.getInventorySummary();
            blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
          }
          break;
        case 'eoq':
          const eoqData = await api.reports.getMostCriticalProducts();
          blob = new Blob([JSON.stringify(eoqData, null, 2)], { type: format === 'pdf' ? 'application/pdf' : 'application/json' });
          break;
        case 'alerts':
          const alertsData = await api.alerts.getAll();
          blob = new Blob([JSON.stringify(alertsData, null, 2)], { type: format === 'pdf' ? 'application/pdf' : 'application/json' });
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${selectedReport}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Datos para gráficos
  const getInventoryChartData = () => {
    return products.slice(0, 10).map(product => ({
      name: product.nombre.substring(0, 15),
      stock: product.stock_actual,
      minimo: product.stock_minimo,
      maximo: product.stock_maximo || 0
    }));
  };

  const getAlertsChartData = () => {
    const alertsByLevel = alerts.reduce((acc, alert) => {
      acc[alert.nivel_alerta] = (acc[alert.nivel_alerta] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(alertsByLevel).map(([level, count]) => ({
      nivel: level,
      cantidad: count
    }));
  };

  const reportOptions = [
    {
      id: 'inventory' as ReportType,
      title: 'Reporte de Inventario',
      description: 'Estado actual del inventario, productos con stock bajo y alto',
      icon: ChartBarIcon,
      color: 'blue'
    },
    {
      id: 'eoq' as ReportType,
      title: 'Reporte EOQ',
      description: 'Cálculos de cantidad económica de pedido y recomendaciones',
      icon: DocumentTextIcon,
      color: 'green'
    },
    {
      id: 'alerts' as ReportType,
      title: 'Reporte de Alertas',
      description: 'Alertas activas y tendencias',
      icon: DocumentArrowDownIcon,
      color: 'red'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      red: 'bg-red-50 border-red-200 text-red-800',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <button
          onClick={fetchData}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Actualizar Datos
        </button>
      </div>

      {/* Report Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Tipo de Reporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedReport(option.id)}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedReport === option.id
                    ? getColorClasses(option.color)
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-8 w-8 mb-2" />
                <h3 className="font-medium">{option.title}</h3>
                <p className="text-sm mt-1 opacity-75">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Rango de Fechas:</span>
          </div>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-gray-500">hasta</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Report Generation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generar Reporte</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => generateReport('pdf')}
            disabled={generatingReport}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            Generar PDF
          </button>
          <button
            onClick={() => generateReport('excel')}
            disabled={generatingReport}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            Generar Excel
          </button>
          <button
            onClick={() => generateReport('csv')}
            disabled={generatingReport}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            Generar CSV
          </button>
        </div>
        {generatingReport && (
          <div className="mt-4 flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Generando reporte...</span>
          </div>
        )}
      </div>

      {/* Data Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Inventario</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getInventoryChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="stock" fill="#3B82F6" name="Stock Actual" />
              <Bar dataKey="minimo" fill="#EF4444" name="Stock Mínimo" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Alertas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getAlertsChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nivel" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Estadístico</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Productos:</span>
              <span className="font-semibold">{products.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Productos con Stock Bajo:</span>
              <span className="font-semibold text-red-600">
                {products.filter(p => p.stock_actual <= p.stock_minimo).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Alertas Activas:</span>
              <span className="font-semibold text-orange-600">{alerts.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Alertas Críticas:</span>
              <span className="font-semibold text-red-600">
                {alerts.filter(a => a.nivel_alerta === 'CRITICO').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
