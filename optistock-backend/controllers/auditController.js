const AuditService = require('../services/auditService');

// Obtener logs de auditoría
const obtenerLogs = async (req, res) => {
  try {
    const filtros = {
      tabla: req.query.tabla,
      accion: req.query.accion,
      registroId: req.query.registroId ? parseInt(req.query.registroId) : null,
      usuario: req.query.usuario,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      limite: req.query.limite ? parseInt(req.query.limite) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    // Limpiar filtros vacíos
    Object.keys(filtros).forEach(key => {
      if (filtros[key] === undefined || filtros[key] === null || filtros[key] === '') {
        delete filtros[key];
      }
    });

    const logs = await AuditService.obtenerLogs(filtros);
    res.json({
      success: true,
      data: logs,
      filtros: filtros,
      total: logs.length
    });
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener logs de auditoría',
      details: error.message
    });
  }
};

// Obtener estadísticas de auditoría
const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await AuditService.obtenerEstadisticas();
    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de auditoría',
      details: error.message
    });
  }
};

// Obtener historial de un registro específico
const obtenerHistorialRegistro = async (req, res) => {
  try {
    const { tabla, id } = req.params;
    
    if (!tabla || !id) {
      return res.status(400).json({
        success: false,
        error: 'Tabla e ID son requeridos'
      });
    }

    const historial = await AuditService.obtenerHistorialRegistro(tabla, parseInt(id));
    res.json({
      success: true,
      data: historial,
      tabla: tabla,
      registroId: id
    });
  } catch (error) {
    console.error('Error al obtener historial del registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial del registro',
      details: error.message
    });
  }
};

// Obtener logs de productos específicamente
const obtenerLogsProductos = async (req, res) => {
  try {
    const filtros = {
      tabla: 'productos',
      accion: req.query.accion,
      registroId: req.query.registroId ? parseInt(req.query.registroId) : null,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      limite: req.query.limite ? parseInt(req.query.limite) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    // Limpiar filtros vacíos
    Object.keys(filtros).forEach(key => {
      if (filtros[key] === undefined || filtros[key] === null || filtros[key] === '') {
        delete filtros[key];
      }
    });

    const logs = await AuditService.obtenerLogs(filtros);
    
    // Procesar los logs para incluir información más legible
    const logsConDetalles = logs.map(log => {
      const logProcesado = { ...log };
      
      // Agregar descripción legible de la acción
      switch (log.accion) {
        case 'INSERT':
          logProcesado.descripcion = `Producto creado: ${log.datos_nuevos?.nombre || 'N/A'}`;
          break;
        case 'UPDATE':
          logProcesado.descripcion = `Producto modificado: ${log.datos_nuevos?.nombre || log.datos_anteriores?.nombre || 'N/A'}`;
          break;
        case 'DELETE':
          logProcesado.descripcion = `Producto eliminado: ${log.datos_anteriores?.nombre || 'N/A'}`;
          break;
        default:
          logProcesado.descripcion = `Acción ${log.accion} realizada`;
      }

      return logProcesado;
    });

    res.json({
      success: true,
      data: logsConDetalles,
      total: logsConDetalles.length,
      filtros: filtros
    });
  } catch (error) {
    console.error('Error al obtener logs de productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener logs de productos',
      details: error.message
    });
  }
};

module.exports = {
  obtenerLogs,
  obtenerEstadisticas,
  obtenerHistorialRegistro,
  obtenerLogsProductos
};
