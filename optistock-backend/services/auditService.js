const pool = require('../models/db');

// Servicio para crear logs de auditoría
class AuditService {
  /**
   * Registra una acción en los logs de auditoría
   * @param {string} tablaAfectada - Nombre de la tabla afectada
   * @param {string} accion - Tipo de acción (INSERT, UPDATE, DELETE)
   * @param {number} registroId - ID del registro afectado
   * @param {object} datosAnteriores - Datos antes del cambio
   * @param {object} datosNuevos - Datos después del cambio
   * @param {object} metadata - Información adicional (usuario, IP, etc.)
   */
  static async registrarLog(tablaAfectada, accion, registroId = null, datosAnteriores = null, datosNuevos = null, metadata = {}) {
    try {
      const query = `
        INSERT INTO audit_logs 
        (tabla_afectada, accion, registro_id, datos_anteriores, datos_nuevos, usuario, ip_address, user_agent, detalles)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, fecha_accion
      `;

      const valores = [
        tablaAfectada,
        accion,
        registroId,
        datosAnteriores ? JSON.stringify(datosAnteriores) : null,
        datosNuevos ? JSON.stringify(datosNuevos) : null,
        metadata.usuario || 'sistema',
        metadata.ip || null,
        metadata.userAgent || null,
        metadata.detalles || null
      ];

      const resultado = await pool.query(query, valores);
      return resultado.rows[0];
    } catch (error) {
      console.error('Error al registrar log de auditoría:', error);
      // No lanzamos error para no interrumpir la operación principal
      return null;
    }
  }

  /**
   * Obtiene los logs de auditoría con filtros
   * @param {object} filtros - Filtros para la consulta
   */
  static async obtenerLogs(filtros = {}) {
    try {
      let query = `
        SELECT 
          id,
          tabla_afectada,
          accion,
          registro_id,
          datos_anteriores,
          datos_nuevos,
          usuario,
          ip_address,
          user_agent,
          fecha_accion,
          detalles
        FROM audit_logs
        WHERE 1=1
      `;
      
      const valores = [];
      let parametroIndex = 1;

      // Filtros dinámicos
      if (filtros.tabla) {
        query += ` AND tabla_afectada = $${parametroIndex}`;
        valores.push(filtros.tabla);
        parametroIndex++;
      }

      if (filtros.accion) {
        query += ` AND accion = $${parametroIndex}`;
        valores.push(filtros.accion);
        parametroIndex++;
      }

      if (filtros.registroId) {
        query += ` AND registro_id = $${parametroIndex}`;
        valores.push(filtros.registroId);
        parametroIndex++;
      }

      if (filtros.usuario) {
        query += ` AND usuario ILIKE $${parametroIndex}`;
        valores.push(`%${filtros.usuario}%`);
        parametroIndex++;
      }

      if (filtros.fechaInicio) {
        query += ` AND fecha_accion >= $${parametroIndex}`;
        valores.push(filtros.fechaInicio);
        parametroIndex++;
      }

      if (filtros.fechaFin) {
        query += ` AND fecha_accion <= $${parametroIndex}`;
        valores.push(filtros.fechaFin);
        parametroIndex++;
      }

      // Ordenar por fecha descendente
      query += ' ORDER BY fecha_accion DESC';

      // Límite de resultados
      const limite = filtros.limite || 100;
      query += ` LIMIT $${parametroIndex}`;
      valores.push(limite);
      parametroIndex++;

      // Offset para paginación
      if (filtros.offset) {
        query += ` OFFSET $${parametroIndex}`;
        valores.push(filtros.offset);
      }

      const resultado = await pool.query(query, valores);
      return resultado.rows;
    } catch (error) {
      console.error('Error al obtener logs de auditoría:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de los logs de auditoría
   */
  static async obtenerEstadisticas() {
    try {
      const query = `
        SELECT 
          tabla_afectada,
          accion,
          COUNT(*) as cantidad,
          MAX(fecha_accion) as ultima_accion
        FROM audit_logs
        GROUP BY tabla_afectada, accion
        ORDER BY tabla_afectada, accion
      `;

      const resultado = await pool.query(query);
      return resultado.rows;
    } catch (error) {
      console.error('Error al obtener estadísticas de auditoría:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de cambios para un registro específico
   * @param {string} tabla - Nombre de la tabla
   * @param {number} registroId - ID del registro
   */
  static async obtenerHistorialRegistro(tabla, registroId) {
    try {
      const query = `
        SELECT 
          id,
          accion,
          datos_anteriores,
          datos_nuevos,
          usuario,
          fecha_accion,
          detalles
        FROM audit_logs
        WHERE tabla_afectada = $1 AND registro_id = $2
        ORDER BY fecha_accion DESC
      `;

      const resultado = await pool.query(query, [tabla, registroId]);
      return resultado.rows;
    } catch (error) {
      console.error('Error al obtener historial del registro:', error);
      throw error;
    }
  }
}

module.exports = AuditService;
