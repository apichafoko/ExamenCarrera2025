import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Verificar la conexión a la base de datos
    const connectionTest = await sql`SELECT 1 as connection_test`
    const isConnected = connectionTest && connectionTest.length > 0

    // Obtener la lista de tablas
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    const tables = tablesResult.map((row: any) => row.table_name)

    // Verificar si existe la tabla alumnos
    const alumnosTableExists = tables.includes("alumnos")

    // Si existe la tabla alumnos, obtener su estructura
    let alumnosColumns = []
    if (alumnosTableExists) {
      const columnsResult = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'alumnos'
      `
      alumnosColumns = columnsResult.map((row: any) => ({
        name: row.column_name,
        type: row.data_type,
      }))
    }

    // Intentar contar registros en la tabla alumnos si existe
    let alumnosCount = 0
    if (alumnosTableExists) {
      try {
        const countResult = await sql`SELECT COUNT(*) as count FROM alumnos`
        alumnosCount = countResult[0]?.count || 0
      } catch (error) {
        console.error("Error al contar alumnos:", error)
      }
    }

    return NextResponse.json(
      {
        isConnected,
        tables,
        alumnosTableExists,
        alumnosColumns,
        alumnosCount,
        databaseUrl: process.env.DATABASE_URL ? "Configurada" : "No configurada",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Error en diagnóstico de base de datos:", error)
    return NextResponse.json(
      {
        isConnected: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
