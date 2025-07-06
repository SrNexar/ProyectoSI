import React, { useState, useEffect } from 'react';
import { 
  CalculatorIcon, 
  ChartBarIcon, 
  ClockIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import type { Product, EOQCalculation, EOQRecommendation, EOQHistory } from '../types';
import api from '../services/api';

const EOQ: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [calculation, setCalculation] = useState<EOQCalculation | null>(null);
  const [recommendations, setRecommendations] = useState<EOQRecommendation[]>([]);
  const [history, setHistory] = useState<EOQHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchRecommendations();
    fetchHistory();
  }, []);

  const fetchProducts = async () => {
    try {
      const productsData = await api.products.getAll();
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await api.alerts.getRecommendations();
      setRecommendations(response.recomendaciones.map(rec => ({
        producto: rec.nombre,
        cantidad_a_pedir: rec.eoq,
        pedidos_al_anio: rec.frecuencia_pedidos,
        dias_entre_pedidos: rec.dias_entre_pedidos,
        sugerencia: rec.accion_recomendada
      })));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      // Para obtener historial, necesitaríamos un endpoint específico
      // Por ahora usamos datos vacíos
      setHistory([]);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleCalculateEOQ = async (product: Product) => {
    setLoading(true);
    try {
      const result = await api.eoq.calculate(product.id);
      setCalculation(result);
      setSelectedProduct(product);
      await fetchHistory(); // Actualizar historial
    } catch (error) {
      console.error('Error calculating EOQ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadEOQReport = async () => {
    if (!selectedProduct) return;
    try {
      const blob = await api.eoq.generateReport(selectedProduct.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_eoq_${selectedProduct.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al descargar el reporte EOQ');
      console.error(error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cálculo EOQ</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalculatorIcon className="h-4 w-4" />
          <span>Cantidad Económica de Pedido</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo - Productos */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
              <div className="mt-2 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedProduct?.id === product.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleCalculateEOQ(product)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{product.nombre}</h3>
                      <p className="text-sm text-gray-600">{product.categoria}</p>
                      <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                        <span>Stock: {product.stock_actual}</span>
                        <span>Min: {product.stock_minimo}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCalculateEOQ(product);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      disabled={loading}
                    >
                      <CalculatorIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel central - Cálculo */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultado del Cálculo</h2>
              
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : calculation && selectedProduct ? (
                <div className="space-y-6">
                  {/* Información del producto */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{selectedProduct.nombre}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Stock Actual:</span>
                        <span className="ml-2 font-medium">{selectedProduct.stock_actual}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Stock Mínimo:</span>
                        <span className="ml-2 font-medium">{selectedProduct.stock_minimo}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Demanda Anual:</span>
                        <span className="ml-2 font-medium">{selectedProduct.demanda_anual}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Costo de Pedido:</span>
                        <span className="ml-2 font-medium">${selectedProduct.costo_pedido}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadEOQReport}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Descargar PDF EOQ
                    </button>
                  </div>

                  {/* Resultados EOQ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ChartBarIcon className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Cantidad Económica (EOQ)</h4>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{calculation.eoq} unidades</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentTextIcon className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-900">Costo Total Estimado</h4>
                      </div>
                      <p className="text-2xl font-bold text-green-600">${calculation.costo_total_estimado.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Recomendaciones específicas */}
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">Recomendaciones</h4>
                    <div className="space-y-2">
                      {recommendations
                        .filter(rec => rec.producto === selectedProduct.nombre)
                        .map((rec, index) => (
                          <div key={index} className="text-sm">
                            <div className="grid grid-cols-3 gap-4 mb-1">
                              <div>
                                <span className="text-gray-600">Cantidad a pedir:</span>
                                <span className="ml-2 font-medium">{rec.cantidad_a_pedir}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Pedidos/año:</span>
                                <span className="ml-2 font-medium">{rec.pedidos_al_anio}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Días entre pedidos:</span>
                                <span className="ml-2 font-medium">{rec.dias_entre_pedidos}</span>
                              </div>
                            </div>
                            <p className="text-yellow-800 font-medium">{rec.sugerencia}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalculatorIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selecciona un producto para calcular su EOQ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Recomendaciones Generales */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recomendaciones Generales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 6).map((rec, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{rec.producto}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Cantidad sugerida: <span className="font-medium">{rec.cantidad_a_pedir}</span></div>
                  <div>Pedidos por año: <span className="font-medium">{rec.pedidos_al_anio}</span></div>
                  <div>Días entre pedidos: <span className="font-medium">{rec.dias_entre_pedidos}</span></div>
                </div>
                <p className="mt-2 text-sm text-blue-600 font-medium">{rec.sugerencia}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Fin recomendaciones generales */}
    </div>
  );
};

export default EOQ;
