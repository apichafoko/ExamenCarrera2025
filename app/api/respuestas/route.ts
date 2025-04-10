import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { alumno_id, pregunta_id, respuesta, examen_id, estacion_id } = data

    // Validar datos requeridos
    if (!alumno_id || !pregunta_id || respuesta === undefined) {
      return NextResponse.json(
        { message: "Faltan datos requeridos: alumno_id, pregunta_id y respuesta son obligatorios" },
        { status: 400 },
      )
    }

    // Verificar si ya existe una respuesta para esta pregunta y alumno
    const checkQuery = `
      SELECT id FROM respuestas_alumnos
      WHERE alumno_id = $1 AND pregunta_id = $2
    `
    const existingResponses = await executeQuery(checkQuery, [alumno_id, pregunta_id])

    let result
    if (existingResponses.length > 0) {
      // Actualizar respuesta existente
      const updateQuery = `
        UPDATE respuestas_alumnos
        SET respuesta = $1, fecha_respuesta = CURRENT_TIMESTAMP
        WHERE alumno_id = $2 AND pregunta_id = $3
        RETURNING *
      `
      result = await executeQuery(updateQuery, [respuesta, alumno_id, pregunta_id])
    } else {
      // Crear nueva respuesta
      const insertQuery = `
        INSERT INTO respuestas_alumnos (alumno_id, pregunta_id, respuesta, fecha_respuesta)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING *
      `
      result = await executeQuery(insertQuery, [alumno_id, pregunta_id, respuesta])
    }

    // Actualizar el estado del examen para el alumno si es necesario
    if (examen_id) {
      const updateExamenQuery = `
        UPDATE alumnos_examenes
        SET estado = 'En Progreso'
        WHERE alumno_id = $1 AND examen_id = $2 AND estado = 'Pendiente'
      `
      await executeQuery(updateExamenQuery, [alumno_id, examen_id])
    }

    return NextResponse.json(result[0], {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("Error al guardar respuesta:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al guardar la respuesta" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const alumnoId = url.searchParams.get("alumnoId")
    const examenId = url.searchParams.get("examenId")
    const preguntaId = url.searchParams.get("preguntaId")

    if (!alumnoId) {
      return NextResponse.json({ message: "Se requiere el parámetro alumnoId" }, { status: 400 })
    }

    let query = `
      SELECT ra.*, p.texto as pregunta_texto, p.tipo as pregunta_tipo, e.id as estacion_id, e.titulo as estacion_titulo
      FROM respuestas_alumnos ra
      JOIN preguntas p ON ra.pregunta_id = p.id
      JOIN estaciones e ON p.estacion_id = e.id
      WHERE ra.alumno_id = $1
    `

    const params = [alumnoId]

    if (examenId) {
      query += ` AND e.examen_id = $${params.length + 1}`
      params.push(examenId)
    }

    if (preguntaId) {
      query += ` AND ra.pregunta_id = $${params.length + 1}`
      params.push(preguntaId)
    }

    query += ` ORDER BY ra.fecha_respuesta DESC`

    const result = await executeQuery(query, params)

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("Error al obtener respuestas:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener las respuestas" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
