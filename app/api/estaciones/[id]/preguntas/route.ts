import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400, headers: { "Cache-Control": "no-store" } })
    }

    // Obtener preguntas de la estación
    const query = `
      SELECT p.*
      FROM preguntas p
      WHERE p.estacion_id = $1
      ORDER BY p.orden
    `
    const preguntas = await executeQuery(query, [id])

    // Para cada pregunta, obtener sus opciones si es de tipo selección
    for (const pregunta of preguntas) {
      if (pregunta.tipo === "seleccion" || pregunta.tipo === "multiple") {
        const opcionesQuery = `
          SELECT *
          FROM opciones
          WHERE pregunta_id = $1
          ORDER BY orden
        `
        const opciones = await executeQuery(opcionesQuery, [pregunta.id])
        pregunta.opciones = opciones
      }
    }

    return NextResponse.json(preguntas, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error(`Error en GET /api/estaciones/${params.id}/preguntas:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener las preguntas de la estación" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
