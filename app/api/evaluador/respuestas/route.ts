import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { validateJWT } from "@/lib/auth-service"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.split(" ")[1] || request.cookies.get("token")?.value || ""
    const userData = await validateJWT(token)

    if (!userData) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener el ID de alumno-examen desde la URL
    const url = new URL(request.url)
    const alumnoExamenId = url.searchParams.get("alumnoExamenId")

    if (!alumnoExamenId) {
      return NextResponse.json({ error: "ID de alumno-examen requerido" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Consultar la información básica de la evaluación
    const evaluacionQuery = `
      SELECT 
        ae.id,
        ae.alumno_id,
        ae.examen_id,
        ae.evaluador_id,
        ae.estado,
        ae.fecha_inicio,
        ae.fecha_fin,
        ae.calificacion,
        a.nombre as alumno_nombre,
        e.titulo as examen_nombre,
        ev.nombre as evaluador_nombre
      FROM alumnos_examenes ae
      LEFT JOIN alumnos a ON ae.alumno_id = a.id
      LEFT JOIN examenes e ON ae.examen_id = e.id
      LEFT JOIN evaluadores ev ON ae.evaluador_id = ev.id
      WHERE ae.id = $1
    `

    const evaluacion = await sql(evaluacionQuery, [alumnoExamenId])

    if (!evaluacion || evaluacion.length === 0) {
      return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 })
    }

    // Obtener las estaciones del examen
    const estacionesQuery = `
      SELECT 
        est.id,
        est.nombre,
        est.descripcion,
        est.examen_id,
        COALESCE(SUM(r.puntaje), 0) as puntaje,
        COALESCE(SUM(p.puntaje_maximo), 0) as puntaje_maximo
      FROM estaciones est
      LEFT JOIN preguntas p ON est.id = p.estacion_id
      LEFT JOIN respuestas r ON p.id = r.pregunta_id AND r.alumno_examen_id = $1
      WHERE est.examen_id = $2
      GROUP BY est.id, est.nombre, est.descripcion, est.examen_id
    `

    const estaciones = await sql(estacionesQuery, [alumnoExamenId, evaluacion[0].examen_id])

    // Obtener las preguntas y respuestas
    const preguntasQuery = `
      SELECT 
        p.id,
        p.texto,
        p.estacion_id,
        p.puntaje_maximo,
        est.nombre as estacion_nombre,
        r.id as respuesta_id,
        r.texto as respuesta_texto,
        r.puntaje as puntaje_obtenido,
        r.comentarios,
        CASE 
          WHEN p.tipo = 'opcion_multiple' THEN
            (SELECT o.texto FROM opciones o WHERE o.id = p.respuesta_correcta_id)
          ELSE p.respuesta_texto_correcta
        END as respuesta_correcta
      FROM preguntas p
      JOIN estaciones est ON p.estacion_id = est.id
      LEFT JOIN respuestas r ON p.id = r.pregunta_id AND r.alumno_examen_id = $1
      WHERE est.examen_id = $2
      ORDER BY est.id, p.id
    `

    const preguntas = await sql(preguntasQuery, [alumnoExamenId, evaluacion[0].examen_id])

    // Calcular el puntaje total y máximo
    const puntajesQuery = `
      SELECT 
        COALESCE(SUM(r.puntaje), 0) as puntaje_total,
        COALESCE(SUM(p.puntaje_maximo), 0) as puntaje_maximo
      FROM preguntas p
      JOIN estaciones est ON p.estacion_id = est.id
      LEFT JOIN respuestas r ON p.id = r.pregunta_id AND r.alumno_examen_id = $1
      WHERE est.examen_id = $2
    `

    const puntajes = await sql(puntajesQuery, [alumnoExamenId, evaluacion[0].examen_id])

    // Construir la respuesta
    const respuesta = {
      id: evaluacion[0].id,
      alumnoId: evaluacion[0].alumno_id,
      examenId: evaluacion[0].examen_id,
      evaluadorId: evaluacion[0].evaluador_id,
      estado: evaluacion[0].estado,
      fechaEvaluacion: evaluacion[0].fecha_aplicacion,
      alumnoNombre: evaluacion[0].alumno_nombre,
      examenNombre: evaluacion[0].examen_nombre,
      evaluadorNombre: evaluacion[0].evaluador_nombre,
      puntajeTotal: puntajes[0]?.puntaje_total || 0,
      puntajeMaximo: puntajes[0]?.puntaje_maximo || 0,
      estaciones: estaciones || [],
      preguntas: preguntas || [],
    }

    return NextResponse.json(respuesta)
  } catch (error) {
    console.error("Error al obtener resultados:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
