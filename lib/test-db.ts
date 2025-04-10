// Archivo para probar la conexión a la base de datos
import { neon } from "@neondatabase/serverless"

export async function testDatabaseConnection() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Probar diferentes formas de ejecutar consultas

    // 1. Usando la función de plantilla etiquetada
    console.log("Probando consulta con plantilla etiquetada:")
    const result1 = await sql`SELECT 1 as test`
    console.log("Resultado 1:", result1)

    // 2. Usando sql.query
    console.log("Probando consulta con sql.query:")
    const result2 = await sql.query("SELECT 1 as test")
    console.log("Resultado 2:", result2)

    // 3. Probando una consulta real a la tabla de exámenes
    console.log("Probando consulta a la tabla de exámenes:")
    const examenes = await sql`SELECT * FROM examenes LIMIT 5`
    console.log("Exámenes:", examenes)

    return {
      success: true,
      message: "Conexión exitosa a la base de datos",
      results: {
        test1: result1,
        test2: result2,
        examenes,
      },
    }
  } catch (error) {
    console.error("Error al probar la conexión a la base de datos:", error)
    return {
      success: false,
      message: "Error al conectar a la base de datos",
      error: error.message,
    }
  }
}
