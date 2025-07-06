import React from 'react';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: SunIcon },
    { value: 'dark', label: 'Oscuro', icon: MoonIcon },
    { value: 'system', label: 'Sistema', icon: ComputerDesktopIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Cog6ToothIcon className="h-4 w-4" />
          <span>Personalización del sistema</span>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Apariencia
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tema de la aplicación
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                      className={`
                        relative flex items-center p-4 rounded-lg border-2 transition-colors
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }
                      `}
                    >
                      <Icon className={`h-5 w-5 mr-3 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {theme === 'system' && 'El tema se ajustará automáticamente según la configuración de tu sistema operativo.'}
                {theme === 'light' && 'La aplicación usará colores claros.'}
                {theme === 'dark' && 'La aplicación usará colores oscuros.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Vista previa
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Tema actual: {isDark ? 'Oscuro' : 'Claro'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Esta es una vista previa de cómo se ve la aplicación con el tema seleccionado.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Componente de ejemplo</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Los componentes se adaptan automáticamente al tema seleccionado.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100">Alertas y notificaciones</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Todos los elementos mantienen su funcionalidad en ambos temas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configuración adicional
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Guardado automático
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Los cambios se guardan automáticamente en el navegador
                </p>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600 dark:text-green-400">Activo</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sincronización del sistema
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Detecta automáticamente los cambios de tema del sistema operativo
                </p>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-blue-600 dark:text-blue-400">Disponible</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
