import { neon } from "@neondatabase/serverless"

// Mejorar el manejo de errores cuando DATABASE_URL no está configurado
export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    if (!process.env.DATABASE_URL) {
      console.error(
        "ERROR CRÍTICO: DATABASE_URL no está configurado. Por favor, configure esta variable de entorno en su entorno de producción.",
      )
      throw new Error("DATABASE_URL no está configurado")
    }

    // Crear una instancia de SQL con la URL de la base de datos
    const sql = neon(process.env.DATABASE_URL)

    console.log(`Ejecutando consulta: ${query.substring(0, 100)}${query.length > 100 ? "..." : ""}`)

    try {
      // Usar sql.query en lugar de llamar directamente a sql
      const result = await sql.query(query, params)

      // Si el resultado tiene una propiedad rows, devolverla
      if (result && result.rows && Array.isArray(result.rows)) {
        console.log(`Consulta exitosa, ${result.rows.length} filas obtenidas`)
        return result.rows as T[]
      }

      // Si el resultado es un array, devolverlo directamente
      if (Array.isArray(result)) {
        console.log(`Consulta exitosa, ${result.length} filas obtenidas`)
        return result as T[]
      }

      console.warn("La consulta no devolvió resultados en un formato reconocible:", result)
      return [] as T[]
    } catch (queryError) {
      // Mejorar el manejo de errores para detectar problemas de límite de tasa
      if (queryError instanceof Error && queryError.message.includes("Too Many")) {
        console.error(
          "Error de límite de tasa detectado. Espere un momento antes de intentar nuevamente:",
          queryError.message,
        )
      } else {
        console.error("Error al ejecutar la consulta:", queryError)
      }
      throw queryError // Propagar el error para mejor manejo
    }
  } catch (error) {
    console.error("Error al inicializar la conexión:", error)
    throw error // Propagar el error para mejor manejo
  }
}

// Crear una única instancia de SQL para reutilizar
let sqlInstance: any = null

export function getSqlInstance() {
  if (!sqlInstance && process.env.DATABASE_URL) {
    sqlInstance = neon(process.env.DATABASE_URL)
  }
  return sqlInstance
}

// Exporta la instancia de SQL para uso directo si es necesario
export const sql = getSqlInstance()
