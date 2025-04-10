import { executeQuery } from "./db"

export async function testDatabaseConnection() {
  try {
    const result = await executeQuery("SELECT 1 as test")
    console.log("Conexión a la base de datos exitosa:", result)
    return true
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error)
    return false
  }
}

export async function testUserQuery(email: string) {
  try {
    const result = await executeQuery("SELECT id, email FROM usuarios WHERE email = $1", [email])
    console.log(`Resultado de la consulta para ${email}:`, result)
    return result
  } catch (error) {
    console.error(`Error al consultar usuario ${email}:`, error)
    return null
  }
}
