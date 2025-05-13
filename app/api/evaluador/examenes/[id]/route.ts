import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const alumnoExamenId = Number.parseInt(params.id)

    if (isNaN(alumnoExamenId)) {
      console.error(`ID de asignación inválido: ${params.id}`)
      return NextResponse.json({ message: "ID de asignación inválido" }, { status: 400 })
    }

    console.log(`GET /api/evaluador/examenes/${alumnoExamenId}`)

    // Obtener información básica del examen y alumno
    const basicInfoQuery = `
      SELECT ae.*, 
             a.nombre as alumno_nombre, 
             a.apellido as alumno_apellido,
             e.titulo as examen_titulo, 
             e.descripcion as examen_descripcion,
             e.id as examen_id
      FROM alumnos_examenes ae
      JOIN alumnos a ON ae.alumno_id = a.id
      JOIN examenes e ON ae.examen_id = e.id
      WHERE ae.id = $1 AND e.estado = 'ACTIVO'

    `
    const basicInfoResult = await executeQuery(basicInfoQuery, [alumnoExamenId])

    if (basicInfoResult.length === 0) {
      console.error(`No se encontró información para alumno_examen con ID: ${alumnoExamenId}`)
      return NextResponse.json({ message: "Examen no encontrado" }, { status: 404 })
    }

    const alumnoExamen = basicInfoResult[0]
    console.log(`Información básica obtenida para alumno_examen con ID: ${alumnoExamenId}`, alumnoExamen)

    // Obtener todas las estaciones del examen
    const estacionesQuery = `
      SELECT * FROM estaciones 
      WHERE examen_id = $1 
      ORDER BY orden
    `
    const estaciones = await executeQuery(estacionesQuery, [alumnoExamen.examen_id])
    console.log(`Estaciones obtenidas para examen_id ${alumnoExamen.examen_id}:`, estaciones.length)

    // Añadir las estaciones al objeto de respuesta
    alumnoExamen.estaciones = estaciones

    // Obtener todas las preguntas para todas las estaciones
    if (estaciones.length > 0) {
      const estacionIds = estaciones.map((e) => e.id).join(",")

      if (estacionIds) {
        const preguntasQuery = `
          SELECT * FROM preguntas 
          WHERE estacion_id IN (${estacionIds}) 
          ORDER BY estacion_id, orden
        `
        try {
          const preguntas = await executeQuery(preguntasQuery, [])
          console.log(`Preguntas obtenidas para todas las estaciones:`, preguntas.length)

          // Obtener todas las opciones para todas las preguntas
          const preguntaIds = preguntas.map((p) => p.id).join(",")
          let opcionesPorPregunta = {}

          if (preguntaIds) {
            const opcionesQuery = `
              SELECT * FROM opciones 
              WHERE pregunta_id IN (${preguntaIds}) 
              ORDER BY pregunta_id, orden
            `
            try {
              const opciones = await executeQuery(opcionesQuery, [])
              console.log(`Opciones obtenidas para todas las preguntas:`, opciones.length)

              // Agrupar opciones por pregunta_id
              opcionesPorPregunta = opciones.reduce((acc, opcion) => {
                if (!acc[opcion.pregunta_id]) {
                  acc[opcion.pregunta_id] = []
                }
                acc[opcion.pregunta_id].push(opcion)
                return acc
              }, {})
            } catch (error) {
              console.error(`Error al obtener opciones para preguntas ${preguntaIds}:`, error)
            }
          }

          // Obtener respuestas existentes para este alumno_examen
          const respuestasQuery = `
            SELECT * FROM respuestas_alumnos 
            WHERE alumno_examen_id = $1
          `
          const respuestas = await executeQuery(respuestasQuery, [alumnoExamenId])
          console.log(`Respuestas obtenidas para alumno_examen_id ${alumnoExamenId}:`, respuestas.length)

          // Agrupar respuestas por pregunta_id
          const respuestasPorPregunta = respuestas.reduce((acc, respuesta) => {
            acc[respuesta.pregunta_id] = respuesta
            return acc
          }, {})

          // Asignar preguntas a sus estaciones correspondientes
          const preguntasPorEstacion = {}
          preguntas.forEach((pregunta) => {
            if (!preguntasPorEstacion[pregunta.estacion_id]) {
              preguntasPorEstacion[pregunta.estacion_id] = []
            }

            // Añadir opciones a la pregunta
            pregunta.opciones = opcionesPorPregunta[pregunta.id] || []

            // Añadir respuesta existente si hay
            if (respuestasPorPregunta[pregunta.id]) {
              const respuesta = respuestasPorPregunta[pregunta.id]
              pregunta.respuesta = respuesta.respuesta_texto || respuesta.respuesta
            }

            preguntasPorEstacion[pregunta.estacion_id].push(pregunta)
          })

          // Añadir las preguntas a cada estación
          alumnoExamen.estaciones = alumnoExamen.estaciones.map((estacion) => {
            estacion.preguntas = preguntasPorEstacion[estacion.id] || []
            return estacion
          })
        } catch (error) {
          console.error(`Error al obtener preguntas para estaciones ${estacionIds}:`, error)
        }
      }
    }

    return NextResponse.json(alumnoExamen)
  } catch (error) {
    console.error(`Error al obtener detalles del examen:`, error)
    return NextResponse.json({ error: "Error al obtener detalles del examen" }, { status: 500 })
  }
}

// Añadir el método PUT para manejar las acciones de iniciar y finalizar examen
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const alumnoExamenId = Number.parseInt(params.id)

    if (isNaN(alumnoExamenId)) {
      console.error(`ID de asignación inválido: ${params.id}`)
      return NextResponse.json({ message: "ID de asignación inválido" }, { status: 400 })
    }

    // Obtener el cuerpo de la solicitud
    const body = await request.json()
    const action = body.action

    console.log(`PUT /api/evaluador/examenes/${alumnoExamenId} - Acción: ${action}`)

    if (action === "iniciar") {
      // Actualizar el estado del examen a "En Progreso" y establecer la fecha de inicio
      const updateQuery = `
        UPDATE alumnos_examenes 
        SET estado = 'En Progreso', 
            fecha_inicio = CURRENT_TIMESTAMP 
        WHERE id = $1 
        RETURNING id, estado, fecha_inicio
      `
      const result = await executeQuery(updateQuery, [alumnoExamenId])

      if (result.length === 0) {
        return NextResponse.json({ message: "No se pudo iniciar el examen" }, { status: 404 })
      }

      console.log(`Examen ${alumnoExamenId} iniciado correctamente:`, result[0])
      return NextResponse.json(result[0])
    } else if (action === "finalizar") {
      // Obtener calificación y observaciones del cuerpo
      const { calificacion, observaciones } = body

      // Actualizar el estado del examen a "Completado", establecer la fecha de fin y guardar calificación y observaciones
      const updateQuery = `
        UPDATE alumnos_examenes 
        SET estado = 'Completado', 
            fecha_fin = CURRENT_TIMESTAMP,
            calificacion = $2,
            observaciones = $3
        WHERE id = $1 
        RETURNING id, estado, fecha_fin, calificacion, observaciones
      `
      const result = await executeQuery(updateQuery, [alumnoExamenId, calificacion, observaciones || ""])

      if (result.length === 0) {
        return NextResponse.json({ message: "No se pudo finalizar el examen" }, { status: 404 })
      }

      console.log(`Examen ${alumnoExamenId} finalizado correctamente:`, result[0])
      return NextResponse.json(result[0])
    } else {
      return NextResponse.json({ message: "Acción no válida" }, { status: 400 })
    }
  } catch (error) {
    console.error(`Error al procesar la acción para el examen:`, error)
    return NextResponse.json({ error: "Error al procesar la acción para el examen" }, { status: 500 })
  }
}
