import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const alumnoExamenId = params.id
    if (!alumnoExamenId) {
      return NextResponse.json({ error: "ID de alumno-examen requerido" }, { status: 400 })
    }

    console.log(`Obteniendo resultados para alumno_examen_id: ${alumnoExamenId}`)

    const dbUrl = process.env.DATABASE_URL

    if (!dbUrl) {
      console.error("DATABASE_URL is not defined")
      return NextResponse.json({ error: "DATABASE_URL is not defined" }, { status: 500 })
    }

    const sql = neon(dbUrl)
    try {
      // Verificar si existe el alumno_examen
      const checkResult = await sql`
        SELECT COUNT(*) as count FROM alumnos_examenes WHERE id = ${alumnoExamenId}
      `

      if (!checkResult[0] || checkResult[0].count === 0) {
        console.log(`No se encontró alumno_examen con id: ${alumnoExamenId}`)
        return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 })
      }

      // Consultar la información básica de la evaluación
      const evaluacion = await sql`
        SELECT 
          ae.id,
          ae.alumno_id,
          ae.examen_id,
          ae.evaluador_id,
          ae.estado,
          ae.fecha_inicio,
          ae.fecha_fin,
          ae.calificacion as puntaje,
          a.nombre as alumno_nombre,
          a.apellido as alumno_apellido,
          a.documento as alumno_documento,
          e.titulo as examen_nombre,
          ev.nombre as evaluador_nombre,
          ev.apellido as evaluador_apellido
        FROM alumnos_examenes ae
        LEFT JOIN alumnos a ON ae.alumno_id = a.id
        LEFT JOIN examenes e ON ae.examen_id = e.id
        LEFT JOIN evaluadores ev ON ae.evaluador_id = ev.id
        WHERE ae.id = ${alumnoExamenId}
      `

      if (!evaluacion || evaluacion.length === 0) {
        console.log(`No se encontró información de evaluación para id: ${alumnoExamenId}`)
        return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 })
      }

      console.log(`Información básica obtenida para alumno_examen_id: ${alumnoExamenId}`, evaluacion[0])

      // Obtener las estaciones del examen
      const estaciones = await sql`
        SELECT 
          est.id,
          est.titulo as nombre,
          est.descripcion,
          est.examen_id,
          est.orden,
          COALESCE(re.calificacion, 0) as puntaje,
          est.puntaje_maximo as puntaje_maximo
        FROM estaciones est
        LEFT JOIN resultados_estaciones re ON est.id = re.estacion_id AND re.alumno_examen_id = ${alumnoExamenId}
        WHERE est.examen_id = ${evaluacion[0].examen_id}
        AND est.activo = true
        ORDER BY est.orden
      `
      console.log(`Estaciones obtenidas: ${estaciones.length}`)

      // Verificar la estructura de la tabla respuestas_alumnos
      const tableInfo = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'respuestas_alumnos'
      `

      // Determinar el nombre de la columna para la respuesta
      const respuestaColumnName = tableInfo.some((col: any) => col.column_name === "respuesta_texto")
        ? "respuesta_texto"
        : tableInfo.some((col: any) => col.column_name === "respuesta")
          ? "respuesta"
          : null

      if (!respuestaColumnName) {
        console.error("No se encontró una columna para almacenar la respuesta en la tabla respuestas_alumnos")
        return NextResponse.json({ error: "Error en la estructura de la base de datos" }, { status: 500 })
      }

      const preguntas = await sql`
        SELECT 
          p.id,
          p.texto,
          p.tipo,
          p.estacion_id,
          p.puntaje AS puntaje_maximo,
          est.titulo AS estacion_nombre,
          ra.id AS respuesta_id,
          ra.respuesta AS respuesta_texto,
          ra.puntaje AS puntaje_obtenido,
          ra.comentario AS comentarios,
          (
            SELECT STRING_AGG(o.texto, ', ')
            FROM opciones o 
            WHERE o.pregunta_id = p.id AND o.es_correcta = true
          ) AS respuesta_correcta
        FROM respuestas_alumnos ra
        JOIN preguntas p ON ra.pregunta_id = p.id
        JOIN estaciones est ON p.estacion_id = est.id
        WHERE ra.alumno_examen_id = ${alumnoExamenId}
        ORDER BY est.orden, p.orden
      `
      console.log("Preguntas obtenidas:", preguntas.length)

      // Calcular el puntaje total y máximo
      const puntajes = await sql`
      SELECT 
        COALESCE(SUM(re.calificacion), 0) AS puntaje_total
      FROM resultados_estaciones re
      WHERE re.alumno_examen_id = ${alumnoExamenId}
    `
      console.log(`Puntajes calculados:`, puntajes[0])

      // Construir la respuesta
      const respuesta = {
        id: evaluacion[0].id,
        alumnoId: evaluacion[0].alumno_id,
        examenId: evaluacion[0].examen_id,
        evaluadorId: evaluacion[0].evaluador_id,
        estado: evaluacion[0].estado,
        fecha_inicio: evaluacion[0].fecha_inicio,
        fecha_fin: evaluacion[0].fecha_fin,
        alumnoNombre: `${evaluacion[0].alumno_nombre || ""} ${evaluacion[0].alumno_apellido || ""}`.trim(),
        alumno_documento: evaluacion[0].alumno_documento,
        examenNombre: evaluacion[0].examen_nombre,
        evaluadorNombre: `${evaluacion[0].evaluador_nombre || ""} ${evaluacion[0].evaluador_apellido || ""}`.trim(),
        puntajeTotal: puntajes[0]?.puntaje_total || 0,
        //puntajeMaximo: puntajes[0]?.puntaje_maximo || 100,
        puntajeMaximo: estaciones.reduce((acc, est) => acc + (Number(est.puntaje_maximo) || 0), 0),
        estaciones: estaciones || [],
        preguntas: preguntas || [],
      }

      return NextResponse.json(respuesta)
    } catch (error) {
      console.log("Error details:")
      console.log(error)
      console.log(error.message)
      console.error("Error al obtener resultados:", error)
      return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error en GET /api/evaluador/respuestas/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
