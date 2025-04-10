import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400, headers: { "Cache-Control": "no-store" } })
    }

    // Consulta ajustada para usar solo las columnas que existen en la tabla estaciones
    const query = `
      SELECT e.*
      FROM estaciones e
      WHERE e.examen_id = $1
      ORDER BY e.orden
    `
    const estaciones = await executeQuery(query, [id])

    return NextResponse.json(estaciones, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error(`Error en GET /api/examenes/${params.id}/estaciones:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener las estaciones del examen" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
