import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ message: "Se requiere el parámetro email" }, { status: 400 })
    }

    console.log(`GET /api/evaluadores/by-email?email=${email}`)

    // Buscar el evaluador por email
    const query = `
      SELECT id, nombre, apellido, email
      FROM evaluadores
      WHERE email = $1
    `

    const result = await executeQuery(query, [email])

    if (result.length === 0) {
      return NextResponse.json({ message: "Evaluador no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error en GET /api/evaluadores/by-email:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al buscar el evaluador" },
      { status: 500 },
    )
  }
}
