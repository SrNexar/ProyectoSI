import React, { useState, useEffect } from 'react'
import { testConnection } from '../services/api'

interface ConnectionStatusProps {
  className?: string
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkConnection = async () => {
    setIsLoading(true)
    try {
      const connected = await testConnection()
      setIsConnected(connected)
    } catch (error) {
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkConnection()
    
    // Verificar conexión cada 30 segundos
    const interval = setInterval(checkConnection, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">Verificando conexión...</span>
      </div>
    )
  }

  if (isConnected === null) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`}
      ></div>
      <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
        {isConnected ? 'Conectado al servidor' : 'Sin conexión al servidor'}
      </span>
      {!isConnected && (
        <button
          onClick={checkConnection}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export default ConnectionStatus
