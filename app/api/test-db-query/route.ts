import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "DATABASE_URL no está definida" }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)

    // Consulta para obtener todos los usuarios
    const query = "SELECT id, nombre, email, role FROM usuarios"

    console.log("Ejecutando consulta de prueba:", query)

    const result = await sql(query)

    console.log("Resultado completo:", result)

    return NextResponse.json({
      success: true,
      message: "Consulta ejecutada correctamente",
      result,
    })
  } catch (error) {
    console.error("Error al ejecutar la consulta de prueba:", error)
    return NextResponse.json(
      {
        error: "Error al ejecutar la consulta",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
