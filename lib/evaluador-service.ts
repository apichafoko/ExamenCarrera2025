import { executeQuery } from "./db"

// Tipos de datos para el servicio de evaluador
export type AlumnoExamen = {
  id?: number
  alumno_id: number
  examen_id: number
  evaluador_id: number
  estado: string
  fecha_inicio?: Date | string
  fecha_fin?: Date | string
  alumno_nombre?: string
  alumno_apellido?: string
  examen_titulo?: string
}

export type Respuesta = {
  id?: number
  alumno_examen_id: number
  pregunta_id: number
  respuesta_texto?: string
  puntaje?: number
  comentario?: string
  fecha_respuesta?: Date | string
}

export type ResultadoEstacion = {
  id?: number
  alumno_examen_id: number
  estacion_id: number
  calificacion: number
  observaciones?: string
  fecha_evaluacion?: Date | string
}

// Servicio para el rol de evaluador
export const evaluadorService = {
  // Obtener exámenes asignados a un evaluador
  async getExamenesAsignados(evaluadorId: number, estado?: string): Promise<AlumnoExamen[]> {
    try {
      // Primero verificamos si hay registros para este evaluador
      const checkQuery = `
        SELECT COUNT(*) as total FROM alumnos_examenes WHERE evaluador_id = $1
      `
      const checkResult = await executeQuery(checkQuery, [evaluadorId])
      console.log(`Verificación previa: ${checkResult[0]?.total || 0} registros para evaluador ${evaluadorId}`)

      // Construimos la consulta principal
      let query = `
        SELECT ae.*, a.nombre as alumno_nombre, a.apellido as alumno_apellido, e.titulo as examen_titulo, e.id as examen_id, e.fecha_aplicacion as fecha_examen
        FROM alumnos_examenes ae
        JOIN alumnos a ON ae.alumno_id = a.id
        JOIN examenes e ON ae.examen_id = e.id
        WHERE ae.evaluador_id = $1
      `

      const params = [evaluadorId]

      if (estado && estado !== "todos") {
        query += ` AND ae.estado = $2`
        params.push(estado)
      }

      query += ` ORDER BY ae.fecha_inicio DESC NULLS FIRST, e.titulo`

      console.log(`Ejecutando consulta: ${query} con parámetros:`, params)

      // Intentamos ejecutar la consulta
      try {
        const result = await executeQuery(query, params)
        console.log(`Exámenes asignados encontrados: ${result.length}`)
        return result
      } catch (error) {
        console.error("Error en la consulta principal:", error)

        // Si falla, intentamos una consulta más simple
        console.log("Intentando consulta alternativa...")
        const alternativeQuery = `
          SELECT ae.* 
          FROM alumnos_examenes ae
          WHERE ae.evaluador_id = $1
        `

        const alternativeResult = await executeQuery(alternativeQuery, params)
        console.log(`Consulta alternativa encontró: ${alternativeResult.length} registros`)

        // Enriquecer los resultados con información adicional
        for (const examen of alternativeResult) {
          try {
            // Obtener información del alumno
            const alumnoQuery = `SELECT nombre, apellido FROM alumnos WHERE id = $1`
            const alumnoResult = await executeQuery(alumnoQuery, [examen.alumno_id])
            if (alumnoResult.length > 0) {
              examen.alumno_nombre = alumnoResult[0].nombre
              examen.alumno_apellido = alumnoResult[0].apellido
            }

            // Obtener información del examen
            const examenQuery = `SELECT titulo FROM examenes WHERE id = $1`
            const examenResult = await executeQuery(examenQuery, [examen.examen_id])
            if (examenResult.length > 0) {
              examen.examen_titulo = examenResult[0].titulo
            }
          } catch (err) {
            console.error("Error al enriquecer datos:", err)
          }
        }

        return alternativeResult
      }
    } catch (error) {
      console.error("Error en evaluadorService.getExamenesAsignados:", error)
      throw error
    }
  },

  // Iniciar un examen (actualizar estado y fecha de inicio)
  async iniciarExamen(alumnoExamenId: number): Promise<AlumnoExamen | null> {
    try {
      console.log(`Iniciando alumno_examen con ID: ${alumnoExamenId}`)

      // Verificar si el alumno_examen existe
      const checkQuery = `SELECT * FROM alumnos_examenes WHERE id = $1`
      const checkResult = await executeQuery(checkQuery, [alumnoExamenId])

      if (checkResult.length === 0) {
        console.error(`El alumno_examen con ID ${alumnoExamenId} no existe`)
        return null
      }

      console.log(`Alumno_examen encontrado:`, checkResult[0])

      // Actualizar el estado a "En Progreso" y establecer la fecha de inicio
      const query = `
        UPDATE alumnos_examenes
        SET estado = 'En Progreso', fecha_inicio = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `

      console.log(`Ejecutando consulta: ${query} con parámetro: ${alumnoExamenId}`)
      const result = await executeQuery(query, [alumnoExamenId])

      console.log(`Resultado de la actualización:`, result)

      if (result.length === 0) {
        console.error(`No se pudo actualizar el alumno_examen con ID ${alumnoExamenId}`)
        return null
      }

      return result[0]
    } catch (error) {
      console.error(`Error en evaluadorService.iniciarExamen(${alumnoExamenId}):`, error)
      throw error
    }
  },

  // Finalizar un examen (actualizar estado y fecha de fin)
  async finalizarExamen(
    alumnoExamenId: number,
    calificacion?: number,
    observaciones?: string,
  ): Promise<AlumnoExamen | null> {
    try {
      console.log(
        `Finalizando alumno_examen con ID: ${alumnoExamenId}, calificación: ${calificacion}, observaciones: ${observaciones}`,
      )

      // Verificar si el alumno_examen existe
      const checkQuery = `SELECT * FROM alumnos_examenes WHERE id = $1`
      const checkResult = await executeQuery(checkQuery, [alumnoExamenId])

      if (checkResult.length === 0) {
        console.error(`El alumno_examen con ID ${alumnoExamenId} no existe`)
        return null
      }

      console.log(`Alumno_examen encontrado:`, checkResult[0])

      // Actualizar el estado a "Completado", establecer la fecha de fin y guardar calificación y observaciones
      const query = `
        UPDATE alumnos_examenes
        SET estado = 'Completado', 
            fecha_fin = CURRENT_TIMESTAMP,
            calificacion = $2,
            observaciones = $3
        WHERE id = $1
        RETURNING *
      `

      console.log(`Ejecutando consulta: ${query} con parámetros: ${alumnoExamenId}, ${calificacion}, ${observaciones}`)
      const result = await executeQuery(query, [
        alumnoExamenId,
        calificacion !== undefined ? calificacion : null,
        observaciones || null,
      ])

      console.log(`Resultado de la actualización:`, result)

      if (result.length === 0) {
        console.error(`No se pudo actualizar el alumno_examen con ID ${alumnoExamenId}`)
        return null
      }

      return result[0]
    } catch (error) {
      console.error(`Error en evaluadorService.finalizarExamen(${alumnoExamenId}):`, error)
      throw error
    }
  },

  // Guardar una respuesta
  async guardarRespuesta(respuesta: Respuesta): Promise<Respuesta | null> {
    try {
      console.log("Guardando respuesta:", respuesta)

      // Verificar si el alumno_examen existe
      const checkAlumnoExamenQuery = `SELECT * FROM alumnos_examenes WHERE id = $1`
      const checkAlumnoExamenResult = await executeQuery(checkAlumnoExamenQuery, [respuesta.alumno_examen_id])

      if (checkAlumnoExamenResult.length === 0) {
        console.error(`El alumno_examen con ID ${respuesta.alumno_examen_id} no existe`)
        return null
      }

      // Primero, obtener el puntaje de la pregunta si no se proporciona
      if (respuesta.puntaje === undefined) {
        const puntajeQuery = `
          SELECT puntaje FROM preguntas WHERE id = $1
        `
        const puntajeResult = await executeQuery(puntajeQuery, [respuesta.pregunta_id])
        if (puntajeResult.length > 0) {
          respuesta.puntaje = puntajeResult[0].puntaje || 0
        }
      }

      // Verificar la estructura de la tabla respuestas_alumnos
      const tableInfoQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'respuestas_alumnos'
      `
      const tableInfo = await executeQuery(tableInfoQuery, [])
      console.log("Estructura de la tabla respuestas_alumnos:", tableInfo)

      // Determinar el nombre de la columna para la respuesta
      const respuestaColumnName = tableInfo.some((col) => col.column_name === "respuesta_texto")
        ? "respuesta_texto"
        : tableInfo.some((col) => col.column_name === "respuesta")
          ? "respuesta"
          : null

      if (!respuestaColumnName) {
        console.error("No se encontró una columna para almacenar la respuesta en la tabla respuestas_alumnos")
        return null
      }

      console.log(`Usando columna '${respuestaColumnName}' para almacenar la respuesta`)

      // Verificar si ya existe una respuesta para esta pregunta y alumno_examen
      const checkQuery = `
        SELECT id FROM respuestas_alumnos
        WHERE alumno_examen_id = $1 AND pregunta_id = $2
      `
      const existingResponses = await executeQuery(checkQuery, [respuesta.alumno_examen_id, respuesta.pregunta_id])

      console.log(
        `Respuestas existentes para alumno_examen_id=${respuesta.alumno_examen_id} y pregunta_id=${respuesta.pregunta_id}:`,
        existingResponses,
      )

      let result
      if (existingResponses.length > 0) {
        // Actualizar respuesta existente
        const updateQuery = `
          UPDATE respuestas_alumnos
          SET ${respuestaColumnName} = $1, puntaje = $2, comentario = $3, fecha_respuesta = CURRENT_TIMESTAMP
          WHERE alumno_examen_id = $4 AND pregunta_id = $5
          RETURNING *
        `
        result = await executeQuery(updateQuery, [
          respuesta.respuesta_texto || "",
          respuesta.puntaje || 0,
          respuesta.comentario || "",
          respuesta.alumno_examen_id,
          respuesta.pregunta_id,
        ])

        console.log("Respuesta actualizada:", result)
      } else {
        // Crear nueva respuesta
        const insertQuery = `
          INSERT INTO respuestas_alumnos (alumno_examen_id, pregunta_id, ${respuestaColumnName}, puntaje, comentario, fecha_respuesta)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          RETURNING *
        `
        result = await executeQuery(insertQuery, [
          respuesta.alumno_examen_id,
          respuesta.pregunta_id,
          respuesta.respuesta_texto || "",
          respuesta.puntaje || 0,
          respuesta.comentario || "",
        ])

        console.log("Nueva respuesta creada:", result)
      }

      return result.length > 0 ? result[0] : null
    } catch (error) {
      console.error("Error en evaluadorService.guardarRespuesta:", error)
      throw error
    }
  },

  // Guardar resultado de una estación
  async guardarResultadoEstacion(resultado: ResultadoEstacion): Promise<ResultadoEstacion | null> {
    try {
      console.log("Guardando resultado de estación:", resultado)

      // Si no se proporciona calificación, calcularla como el promedio de los puntajes de las preguntas
      if (resultado.calificacion === undefined) {
        const puntajesQuery = `
          SELECT AVG(r.puntaje) as promedio
          FROM respuestas_alumnos r
          JOIN preguntas p ON r.pregunta_id = p.id
          WHERE r.alumno_examen_id = $1 AND p.estacion_id = $2
        `
        const puntajesResult = await executeQuery(puntajesQuery, [resultado.alumno_examen_id, resultado.estacion_id])

        if (puntajesResult.length > 0 && puntajesResult[0].promedio !== null) {
          resultado.calificacion = Number.parseFloat(puntajesResult[0].promedio)
        } else {
          resultado.calificacion = 0
        }
      }

      // Verificar si ya existe un resultado para esta estación y alumno_examen
      const checkQuery = `
        SELECT id FROM resultados_estaciones
        WHERE alumno_examen_id = $1 AND estacion_id = $2
      `
      const existingResults = await executeQuery(checkQuery, [resultado.alumno_examen_id, resultado.estacion_id])

      console.log(
        `Resultados existentes para alumno_examen_id=${resultado.alumno_examen_id} y estacion_id=${resultado.estacion_id}:`,
        existingResults,
      )

      let result
      if (existingResults.length > 0) {
        // Actualizar resultado existente
        const updateQuery = `
          UPDATE resultados_estaciones
          SET calificacion = $1, observaciones = $2, fecha_evaluacion = CURRENT_TIMESTAMP
          WHERE alumno_examen_id = $3 AND estacion_id = $4
          RETURNING *
        `
        result = await executeQuery(updateQuery, [
          resultado.calificacion,
          resultado.observaciones || "",
          resultado.alumno_examen_id,
          resultado.estacion_id,
        ])

        console.log("Resultado de estación actualizado:", result)
      } else {
        // Crear nuevo resultado
        const insertQuery = `
          INSERT INTO resultados_estaciones (alumno_examen_id, estacion_id, calificacion, observaciones, fecha_evaluacion)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          RETURNING *
        `
        result = await executeQuery(insertQuery, [
          resultado.alumno_examen_id,
          resultado.estacion_id,
          resultado.calificacion,
          resultado.observaciones || "",
        ])

        console.log("Nuevo resultado de estación creado:", result)
      }

      return result.length > 0 ? result[0] : null
    } catch (error) {
      console.error("Error en evaluadorService.guardarResultadoEstacion:", error)
      throw error
    }
  },

  // Obtener respuestas de un alumno para un examen
  async getRespuestasAlumnoExamen(alumnoExamenId: number): Promise<any[]> {
    try {
      // Verificar la estructura de la tabla respuestas_alumnos
      const tableInfoQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'respuestas_alumnos'
      `
      const tableInfo = await executeQuery(tableInfoQuery, [])
      console.log("Estructura de la tabla respuestas_alumnos:", tableInfo)

      // Determinar el nombre de la columna para la respuesta
      const respuestaColumnName = tableInfo.some((col) => col.column_name === "respuesta_texto")
        ? "respuesta_texto"
        : tableInfo.some((col) => col.column_name === "respuesta")
          ? "respuesta"
          : null

      if (!respuestaColumnName) {
        console.error("No se encontró una columna para almacenar la respuesta en la tabla respuestas_alumnos")
        return []
      }

      const query = `
        SELECT r.*, p.texto as pregunta_texto, p.tipo as pregunta_tipo, 
               e.id as estacion_id, e.titulo as estacion_titulo,
               r.${respuestaColumnName} as respuesta
        FROM respuestas_alumnos r
        JOIN preguntas p ON r.pregunta_id = p.id
        JOIN estaciones e ON p.estacion_id = e.id
        WHERE r.alumno_examen_id = $1
        ORDER BY e.orden, p.orden
      `

      const result = await executeQuery(query, [alumnoExamenId])
      return result
    } catch (error) {
      console.error(`Error en evaluadorService.getRespuestasAlumnoExamen(${alumnoExamenId}):`, error)
      throw error
    }
  },

  // Obtener resultados de estaciones para un alumno y examen
  async getResultadosEstaciones(alumnoExamenId: number): Promise<any[]> {
    try {
      const query = `
        SELECT re.*, e.titulo as estacion_titulo, e.orden
        FROM resultados_estaciones re
        JOIN estaciones e ON re.estacion_id = e.id
        WHERE re.alumno_examen_id = $1
        ORDER BY e.orden
      `

      const result = await executeQuery(query, [alumnoExamenId])
      return result
    } catch (error) {
      console.error(`Error en evaluadorService.getResultadosEstaciones(${alumnoExamenId}):`, error)
      throw error
    }
  },

  // Obtener detalles de un alumno_examen específico - OPTIMIZADO
  async getAlumnoExamenById(alumnoExamenId: number): Promise<any | null> {
    try {
      console.log(`Obteniendo alumno_examen con ID: ${alumnoExamenId} (versión optimizada)`)

      // 1. Verificar si el alumno_examen existe
      const checkQuery = `SELECT * FROM alumnos_examenes WHERE id = $1`
      const checkResult = await executeQuery(checkQuery, [alumnoExamenId])

      if (checkResult.length === 0) {
        console.error(`El alumno_examen con ID ${alumnoExamenId} no existe`)
        return null
      }

      // 2. Obtener información básica del examen con una sola consulta
      const basicInfoQuery = `
        SELECT 
          ae.*, 
          a.nombre as alumno_nombre, 
          a.apellido as alumno_apellido,
          e.titulo as examen_titulo, 
          e.descripcion as examen_descripcion,
          e.id as examen_id
        FROM alumnos_examenes ae
        JOIN alumnos a ON ae.alumno_id = a.id
        JOIN examenes e ON ae.examen_id = e.id
        WHERE ae.id = $1
      `

      const basicInfoResult = await executeQuery(basicInfoQuery, [alumnoExamenId])

      if (basicInfoResult.length === 0) {
        console.log(`No se encontró información básica para alumno_examen con ID: ${alumnoExamenId}`)
        return null
      }

      const alumnoExamen = basicInfoResult[0]
      console.log(`Información básica obtenida para alumno_examen con ID: ${alumnoExamenId}`, alumnoExamen)

      // 3. Obtener todas las estaciones del examen en una sola consulta
      const estacionesQuery = `
        SELECT * FROM estaciones 
        WHERE examen_id = $1 
        ORDER BY orden
      `
      const estaciones = await executeQuery(estacionesQuery, [alumnoExamen.examen_id])
      console.log(`Estaciones obtenidas para examen_id ${alumnoExamen.examen_id}:`, estaciones.length)

      // 4. Obtener todas las preguntas para todas las estaciones en una sola consulta
      const estacionIds = estaciones.map((e: any) => e.id).join(",")

      let preguntas: any[] = []
      if (estacionIds) {
        const preguntasQuery = `
          SELECT * FROM preguntas 
          WHERE estacion_id IN (${estacionIds}) 
          ORDER BY estacion_id, orden
        `
        try {
          preguntas = await executeQuery(preguntasQuery, [])
          console.log(`Preguntas obtenidas para todas las estaciones:`, preguntas.length)
        } catch (error) {
          console.error(`Error al obtener preguntas para estaciones ${estacionIds}:`, error)
          // Continuar con un array vacío de preguntas
        }
      }

      // 5. Obtener todas las opciones para todas las preguntas en una sola consulta
      const preguntaIds = preguntas.map((p: any) => p.id).join(",")

      let opciones: any[] = []
      if (preguntaIds) {
        const opcionesQuery = `
          SELECT * FROM opciones 
          WHERE pregunta_id IN (${preguntaIds}) 
          ORDER BY pregunta_id, orden
        `
        try {
          opciones = await executeQuery(opcionesQuery, [])
          console.log(`Opciones obtenidas para todas las preguntas:`, opciones.length)
        } catch (error) {
          console.error(`Error al obtener opciones para preguntas ${preguntaIds}:`, error)
          // Continuar con un array vacío de opciones
        }
      }

      // 6. Obtener todas las respuestas para este alumno_examen en una sola consulta
      // Verificar la estructura de la tabla respuestas_alumnos
      const tableInfoQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'respuestas_alumnos'
      `
      const tableInfo = await executeQuery(tableInfoQuery, [])

      // Determinar el nombre de la columna para la respuesta
      const respuestaColumnName = tableInfo.some((col) => col.column_name === "respuesta_texto")
        ? "respuesta_texto"
        : tableInfo.some((col) => col.column_name === "respuesta")
          ? "respuesta"
          : null

      let respuestas: any[] = []
      if (respuestaColumnName) {
        const respuestasQuery = `
          SELECT id, alumno_examen_id, pregunta_id, puntaje, comentario, fecha_respuesta, 
                 ${respuestaColumnName} as respuesta
          FROM respuestas_alumnos
          WHERE alumno_examen_id = $1
        `
        try {
          respuestas = await executeQuery(respuestasQuery, [alumnoExamenId])
          console.log(`Respuestas obtenidas para alumno_examen_id ${alumnoExamenId}:`, respuestas.length)
        } catch (error) {
          console.error(`Error al obtener respuestas para alumno_examen_id ${alumnoExamenId}:`, error)
          // Continuar con un array vacío de respuestas
        }
      }

      // 7. Obtener todos los resultados de estaciones para este alumno_examen en una sola consulta
      let resultadosEstaciones: any[] = []
      const resultadosQuery = `
        SELECT * FROM resultados_estaciones
        WHERE alumno_examen_id = $1
      `
      try {
        resultadosEstaciones = await executeQuery(resultadosQuery, [alumnoExamenId])
        console.log(
          `Resultados de estaciones obtenidos para alumno_examen_id ${alumnoExamenId}:`,
          resultadosEstaciones.length,
        )
      } catch (error) {
        console.error(`Error al obtener resultados de estaciones para alumno_examen_id ${alumnoExamenId}:`, error)
        // Continuar con un array vacío de resultados
      }

      // 8. Estructurar los datos para devolverlos
      // Asignar preguntas a estaciones
      const preguntasPorEstacion: { [key: string]: any[] } = {}
      preguntas.forEach((pregunta: any) => {
        if (!preguntasPorEstacion[pregunta.estacion_id]) {
          preguntasPorEstacion[pregunta.estacion_id] = []
        }
        preguntasPorEstacion[pregunta.estacion_id].push(pregunta)
      })

      // Asignar opciones a preguntas
      const opcionesPorPregunta: { [key: string]: any[] } = {}
      opciones.forEach((opcion: any) => {
        if (!opcionesPorPregunta[opcion.pregunta_id]) {
          opcionesPorPregunta[opcion.pregunta_id] = []
        }
        opcionesPorPregunta[opcion.pregunta_id].push(opcion)
      })

      // Asignar respuestas a preguntas
      const respuestasPorPregunta: { [key: string]: any } = {}
      respuestas.forEach((respuesta: any) => {
        respuestasPorPregunta[respuesta.pregunta_id] = respuesta
      })

      // Asignar resultados a estaciones
      const resultadosPorEstacion: { [key: string]: any } = {}
      resultadosEstaciones.forEach((resultado: any) => {
        resultadosPorEstacion[resultado.estacion_id] = resultado
      })

      // Construir el objeto final
      alumnoExamen.estaciones = estaciones.map((estacion: any) => {
        // Asignar preguntas a la estación
        estacion.preguntas = (preguntasPorEstacion[estacion.id] || []).map((pregunta: any) => {
          // Asignar opciones a la pregunta
          pregunta.opciones = opcionesPorPregunta[pregunta.id] || []

          // Asignar respuesta a la pregunta
          const respuesta = respuestasPorPregunta[pregunta.id]
          if (respuesta) {
            pregunta.respuesta = respuesta.respuesta
            pregunta.puntaje_asignado = respuesta.puntaje
            pregunta.comentario = respuesta.comentario
          }

          return pregunta
        })

        // Asignar resultado a la estación
        estacion.resultado = resultadosPorEstacion[estacion.id] || null

        return estacion
      })

      return alumnoExamen
    } catch (error) {
      console.error(`Error en evaluadorService.getAlumnoExamenById(${alumnoExamenId}):`, error)
      throw error
    }
  },
}
