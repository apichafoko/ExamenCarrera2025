import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
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

    console.log(
      "Intentando conectar a la base de datos con URL:",
      databaseUrl.substring(0, 15) + "...", // Solo mostrar parte de la URL por seguridad
    )

    // Crear una nueva conexión directa
    const sql = neon(databaseUrl)

    // Intentar ejecutar una consulta simple
    console.log("Ejecutando consulta de prueba...")
    const result = await sql`SELECT 1 as test`

    console.log("Resultado de la consulta de prueba:", result)

    // Verificar si hay tablas en la base de datos
    console.log("Verificando tablas existentes...")
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `

    console.log("Tablas encontradas:", tables)

    return NextResponse.json({
      success: true,
      connectionTest: result,
      tables: tables.map((t: any) => t.table_name),
      message: "Conexión exitosa a la base de datos",
    })
  } catch (error) {
    console.error("Error en la prueba directa de la base de datos:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
