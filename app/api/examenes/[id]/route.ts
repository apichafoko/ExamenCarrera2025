import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { successResponse } from "@/lib/api-utils"
import { alumnosExamenesService } from "@/lib/db-service"

// Optimizar la función GET para reducir el número de consultas
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400, headers: { "Cache-Control": "no-store" } })
    }

    // Usar una única consulta para obtener el examen básico
    const examenQuery = `SELECT * FROM examenes WHERE id = $1`
    const examenResult = await executeQuery(examenQuery, [id])

    if (examenResult.length === 0) {
      return NextResponse.json(
        { message: "Examen no encontrado" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      )
    }

    const examen = examenResult[0]

    // Obtener estaciones en una sola consulta
    const estacionesQuery = `
      SELECT * 
      FROM estaciones 
      WHERE examen_id = $1
      ORDER BY orden
    `
    const estaciones = await executeQuery(estacionesQuery, [id])

    // Obtener todas las preguntas para todas las estaciones en una sola consulta
    if (estaciones.length > 0) {
      const estacionIds = estaciones.map((e) => e.id).join(",")
      const preguntasQuery = `
        SELECT * 
        FROM preguntas 
        WHERE estacion_id IN (${estacionIds})
        ORDER BY estacion_id, orden
      `
      const todasLasPreguntas = await executeQuery(preguntasQuery, [])

      // Agrupar preguntas por estación
      const preguntasPorEstacion = todasLasPreguntas.reduce((acc, pregunta) => {
        if (!acc[pregunta.estacion_id]) {
          acc[pregunta.estacion_id] = []
        }
        acc[pregunta.estacion_id].push(pregunta)
        return acc
      }, {})

      // Obtener todas las opciones para todas las preguntas en una sola consulta
      const preguntaIds = todasLasPreguntas
        .filter((p) => ["opcion_unica", "opcion_multiple", "seleccion", "multiple", "listado"].includes(p.tipo))
        .map((p) => p.id)

      let todasLasOpciones = []
      if (preguntaIds.length > 0) {
        const opcionesQuery = `
          SELECT * 
          FROM opciones 
          WHERE pregunta_id IN (${preguntaIds.join(",")})
          ORDER BY pregunta_id, orden
        `
        todasLasOpciones = await executeQuery(opcionesQuery, [])
      }

      // Agrupar opciones por pregunta
      const opcionesPorPregunta = todasLasOpciones.reduce((acc, opcion) => {
        if (!acc[opcion.pregunta_id]) {
          acc[opcion.pregunta_id] = []
        }
        acc[opcion.pregunta_id].push(opcion)
        return acc
      }, {})

      // Asignar opciones a preguntas y preguntas a estaciones
      estaciones.forEach((estacion) => {
        estacion.preguntas = preguntasPorEstacion[estacion.id] || []
        estacion.preguntas.forEach((pregunta) => {
          pregunta.opciones = opcionesPorPregunta[pregunta.id] || []
        })
      })
    }

    // Obtener evaluadores asignados al examen
    const evaluadoresQuery = `
      SELECT e.* 
      FROM evaluadores e
      JOIN examenes_evaluadores ee ON e.id = ee.evaluador_id
      WHERE ee.examen_id = $1
    `
    const evaluadores = await executeQuery(evaluadoresQuery, [id])

    // Agregar estaciones y evaluadores al examen
    examen.estaciones = estaciones
    examen.evaluadores = evaluadores

    const alumnos = await alumnosExamenesService.getAlumnosDeExamen(examen.id)
    examen.alumnos = alumnos

    return successResponse(examen)
  } catch (error) {
    console.error(`Error en GET /api/examenes/${params.id}:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener el examen" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}



export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400, headers: { "Cache-Control": "no-store" } })
    }

    const deleteQuery = `DELETE FROM examenes WHERE id = $1`
    await executeQuery(deleteQuery, [id])
    const success = true

    if (!success) {
      return NextResponse.json(
        { message: "No se pudo eliminar el examen" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      )
    }

    return NextResponse.json(
      { message: "Examen eliminado correctamente" },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error(`Error en DELETE /api/examenes/${params.id}:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al eliminar el examen" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
