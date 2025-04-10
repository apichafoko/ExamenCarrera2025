import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "No se proporcionó una consulta SQL",
        },
        { status: 400 },
      )
    }

    // Obtener la URL de la base de datos
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_URL no está definida en las variables de entorno",
        },
        { status: 500 },
      )
    }

    // Crear una nueva conexión directa
    const sql = neon(databaseUrl)

    // Ejecutar la consulta
    console.log("Ejecutando consulta SQL:", query)
    const result = await sql.query(query)

    return NextResponse.json({
      success: true,
      result: result.rows || [],
      rowCount: result.rowCount,
    })
  } catch (error) {
    console.error("Error ejecutando consulta SQL:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
