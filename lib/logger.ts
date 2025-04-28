/**
 * Sistema de logging que controla la salida de logs según el entorno
 * En producción, los logs no se mostrarán en la consola
 */

// Determinar si estamos en producción
const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production"


// Crear un objeto logger que reemplaza las funciones de console
const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args)
    }
  },

  error: (...args: any[]) => {
    // Los errores siempre se registran, pero en producción podrían
    // enviarse a un servicio de monitoreo en lugar de la consola
    if (!isProduction) {
      console.error(...args)
    } else {
      // En producción, aquí podrías implementar el envío a un servicio
      // de monitoreo de errores como Sentry, LogRocket, etc.
      // Por ahora, mantenemos los errores críticos en la consola incluso en producción
      console.error(...args)
    }
  },

  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args)
    }
  },

  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args)
    }
  },

  debug: (...args: any[]) => {
    if (!isProduction) {
      console.debug(...args)
    }
  },

  // Método para logs críticos que siempre se muestran
  critical: (...args: any[]) => {
    console.error("[CRITICAL]", ...args)
  },
}

export default logger
