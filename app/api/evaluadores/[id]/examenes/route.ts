import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const evaluadorId = params.id
    const searchParams = request.nextUrl.searchParams
    const estado = searchParams.get("estado")

    console.log(`GET /api/evaluadores/${evaluadorId}/examenes${estado ? `?estado=${estado}` : ""}`)

    // Construir la consulta SQL base
    let query = `
      SELECT 
        ae.id,
        ae.alumno_id,
        ae.examen_id,
        ae.numero_identificacion,
        ae.estado,
        e.fecha_aplicacion,
        e.titulo as examen_titulo
      FROM alumnos_examenes ae
      JOIN examenes e ON ae.examen_id = e.id
      WHERE ae.evaluador_id = $1
    `

    const queryParams = [evaluadorId]

    // Agregar filtro de estado si se proporciona
    if (estado && estado !== "todos") {
      query += ` AND ae.estado = $2`
      queryParams.push(estado)
    }

    // Ordenar por fecha y estado
    query += ` ORDER BY e.fecha_aplicacion DESC NULLS FIRST, ae.estado ASC`

    // Ejecutar la consulta
    const result = await executeQuery(query, queryParams)

    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error en GET /api/evaluadores/${params.id}/examenes:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener los exámenes del evaluador" },
      { status: 500 },
    )
  }
}
