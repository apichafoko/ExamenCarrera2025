import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ message: "Se requiere el parámetro userId" }, { status: 400 })
    }

    console.log(`GET /api/evaluadores/by-id?userId=${userId}`)

    // Consulta para obtener el evaluador por user_id
    const query = `
      SELECT *
      FROM evaluadores 
      WHERE usuario_id = $1
      LIMIT 1
    `

    const result = await executeQuery(query, [userId])

    if (!result || result.length === 0) {
      return NextResponse.json({ message: "No se encontró un evaluador para este usuario" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error(`Error en GET /api/evaluadores/by-id:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al buscar el evaluador" },
      { status: 500 },
    )
  }
}
