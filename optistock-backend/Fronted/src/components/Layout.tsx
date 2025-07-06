import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  CubeIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
  DocumentChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import ConnectionStatus from './ConnectionStatus'
import logoJ4 from '../assets/j4process.png'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Productos', href: '/products', icon: CubeIcon },
  { name: 'Cálculo EOQ', href: '/eoq', icon: CalculatorIcon },
  { name: 'Alertas', href: '/alerts', icon: ExclamationTriangleIcon },
  { name: 'Reportes', href: '/reports', icon: DocumentChartBarIcon },
  { name: 'Configuración', href: '/settings', icon: Cog6ToothIcon },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar móvil */}
      <div className={clsx(
        'relative z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-900/80" />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Cerrar sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-2">
              <div className="flex h-16 shrink-0 items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-600 p-2 rounded-lg">
                    <CubeIcon className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">OPTISTOCK</h1>
                </div>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              className={clsx(
                                isActive
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50',
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                              )}
                            >
                              <item.icon
                                className={clsx(
                                  isActive ? 'text-primary-700' : 'text-gray-400 group-hover:text-primary-700',
                                  'h-6 w-6 shrink-0'
                                )}
                                aria-hidden="true"
                              />
                              {item.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar escritorio */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <CubeIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">OPTISTOCK</h1>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={clsx(
                            isActive
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200'
                          )}
                        >
                          <item.icon
                            className={clsx(
                              isActive ? 'text-primary-700' : 'text-gray-400 group-hover:text-primary-700',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <Cog6ToothIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="sr-only">Tu perfil</span>
                  <span aria-hidden="true">Configuración</span>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:pl-80">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Abrir sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:hidden" aria-hidden="true" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="relative flex flex-1 items-center">
            {/* Breadcrumb o título de página */}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {navigation.find(item => item.href === location.pathname)?.name || 'OPTISTOCK'}
            </h2>
          </div>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Notificaciones */}
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            >
              <span className="sr-only">Ver notificaciones</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Estado del sistema */}
            <ConnectionStatus />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="py-8 lg:pl-72 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <footer className="w-full flex items-center justify-center gap-2 py-4 bg-gray-100 dark:bg-gray-800 border-t dark:border-gray-700 mt-8 lg:ml-72">
        <img src={logoJ4} alt="J4 Process" style={{ height: 32 }} />
        <span className="text-gray-700 dark:text-gray-300 font-medium">Diseñado por J4 PROCESS</span>
      </footer>
    </div>
  )
}
