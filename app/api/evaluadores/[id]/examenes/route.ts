import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const evaluadorId = Number.parseInt(params.id)

    if (isNaN(evaluadorId)) {
      return NextResponse.json({ error: "ID de evaluador inválido" }, { status: 400 })
    }

    // Verificar si existe la tabla examenes_evaluadores
    const tablaExiste = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'examenes_evaluadores'
      ) as existe;
    `)

    const existeTablaExamenesEvaluadores = tablaExiste[0]?.existe || false

    let examenes = []

    if (existeTablaExamenesEvaluadores) {
      // Obtener exámenes habilitados para este evaluador
      const query = `
        SELECT e.id, e.titulo, e.descripcion, e.fecha_aplicacion, e.estado
        FROM examenes e
        JOIN examenes_evaluadores ee ON e.id = ee.examen_id
        WHERE ee.evaluador_id = $1
        ORDER BY e.fecha_aplicacion DESC
      `
      examenes = await executeQuery(query, [evaluadorId])
    }

    return NextResponse.json(examenes)
  } catch (error) {
    console.error(`Error al obtener exámenes del evaluador:`, error)
    return NextResponse.json({ error: "Error al obtener exámenes del evaluador" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id, 10)
    if (isNaN(id)) {
      return errorResponse("ID inválido", 400)
    }

    const result = await evaluadoresService.delete(id)
    if (!result) {
      return errorResponse("Evaluador no encontrado", 404)
    }

    return successResponse({ message: "Evaluador eliminado" })
  } catch (error) {
    console.error("Error en DELETE /api/evaluadores/[id]:", error)
    return errorResponse(error)
  }
}
