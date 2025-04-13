import { neon } from "@neondatabase/serverless"

// Function to obtain the database URL from environment variables
function getDatabaseUrl(): string {
  const possibleEnvVars = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING"]

  for (const envVar of possibleEnvVars) {
    if (process.env[envVar]) {
      return process.env[envVar] as string
    }
  }

  throw new Error("No database connection string found in environment variables")
}

// Function to execute SQL queries
export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    const dbUrl = getDatabaseUrl()
    const sql = neon(dbUrl)

    const result = await sql.query(query, params)

    if (result && result.rows && Array.isArray(result.rows)) {
      return result.rows as T[]
    }

    if (Array.isArray(result)) {
      return result as T[]
    }

    console.warn("Query did not return results in a recognizable format:", result)
    return [] as T[]
  } catch (error) {
    console.error("Error executing query:", error)
    throw error
  }
}

export const sql = {
  query: executeQuery,
}

export async function testDatabaseConnection() {
  try {
    const result = await executeQuery("SELECT 1 as test", [])
    return { success: true, message: "Conexión a la base de datos establecida correctamente" }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al conectar con la base de datos",
    }
  }
}
