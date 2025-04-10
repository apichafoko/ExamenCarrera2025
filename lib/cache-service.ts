// Implementación simple de un servicio de caché en memoria
type CacheItem<T> = {
  value: T
  timestamp: number
  ttl: number // tiempo de vida en milisegundos
}

class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutos por defecto

  // Obtener un valor de la caché, o calcularlo si no existe o está expirado
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    const now = Date.now()
    const cachedItem = this.cache.get(key)

    // Si el item existe, no está expirado y no se fuerza la actualización, devolverlo
    if (cachedItem && now - cachedItem.timestamp < cachedItem.ttl && !forceRefresh) {
      console.log(`[Cache] Hit para clave: ${key}`)
      return cachedItem.value
    }

    // Si no existe o está expirado o se fuerza la actualización, calcularlo
    console.log(`[Cache] Miss para clave: ${key}, obteniendo datos frescos...`)
    try {
      const freshValue = await fetchFn()

      // Guardar en caché solo si el valor no es null o undefined
      if (freshValue !== null && freshValue !== undefined) {
        this.cache.set(key, {
          value: freshValue,
          timestamp: now,
          ttl,
        })
      }

      return freshValue
    } catch (error) {
      console.error(`[Cache] Error obteniendo datos frescos para clave: ${key}`, error)

      // Si hay un error pero tenemos un valor en caché (aunque esté expirado), lo devolvemos como fallback
      if (cachedItem) {
        console.log(`[Cache] Usando valor expirado como fallback para clave: ${key}`)
        return cachedItem.value
      }

      throw error
    }
  }

  // Invalidar una entrada de la caché
  invalidate(key: string): void {
    console.log(`[Cache] Invalidando clave: ${key}`)
    this.cache.delete(key)
  }

  // Invalidar todas las entradas que coincidan con un patrón
  invalidatePattern(pattern: RegExp): void {
    console.log(`[Cache] Invalidando claves que coinciden con patrón: ${pattern}`)
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  // Limpiar toda la caché
  clear(): void {
    console.log(`[Cache] Limpiando toda la caché`)
    this.cache.clear()
  }

  // Obtener estadísticas de la caché
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Exportar una instancia única del servicio de caché
export const cacheService = new CacheService()
