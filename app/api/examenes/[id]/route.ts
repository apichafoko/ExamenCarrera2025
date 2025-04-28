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

// Implementar la función PUT para actualizar el examen completo
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400, headers: { "Cache-Control": "no-store" } })
    }

    const data = await request.json()
    console.log("Datos recibidos para actualizar:", JSON.stringify(data, null, 2))

    // Validar datos básicos
    if (!data.titulo || !data.fecha_aplicacion) {
      return NextResponse.json({ message: "Faltan campos requeridos (titulo, fecha_aplicacion)" }, { status: 400 })
    }

    // Iniciar una transacción
    await executeQuery("BEGIN")

    try {
      // 1. Actualizar la información básica del examen
      const examenQuery = `
        UPDATE examenes
        SET titulo = $1, descripcion = $2, fecha_aplicacion = $3, estado = $4
        WHERE id = $5
        RETURNING *
      `
      const examenResult = await executeQuery(examenQuery, [
        data.titulo,
        data.descripcion || null,
        data.fecha_aplicacion,
        data.estado || "Activo",
        id,
      ])

      if (examenResult.length === 0) {
        throw new Error("Examen no encontrado o no se pudo actualizar")
      }

      // 2. Actualizar los evaluadores asignados
      if (data.evaluadores_ids) {
        // Obtener evaluadores actuales
        const evaluadoresActuales = await executeQuery(
          "SELECT evaluador_id FROM examenes_evaluadores WHERE examen_id = $1",
          [id],
        )
        const evaluadoresActualesIds = evaluadoresActuales.map((e: any) => e.evaluador_id)

        // Identificar evaluadores a agregar o eliminar
        const evaluadoresNuevos = data.evaluadores_ids.filter((eid: number) => !evaluadoresActualesIds.includes(eid))
        const evaluadoresAEliminar = evaluadoresActualesIds.filter((eid: number) => !data.evaluadores_ids.includes(eid))

        // Agregar nuevos evaluadores
        if (evaluadoresNuevos.length > 0) {
          const values = evaluadoresNuevos.map((eid: number, index: number) => `($1, $${index + 2})`).join(",")
          const query = `INSERT INTO examenes_evaluadores (examen_id, evaluador_id) VALUES ${values}`
          await executeQuery(query, [id, ...evaluadoresNuevos])
        }

        // Eliminar evaluadores no deseados
        if (evaluadoresAEliminar.length > 0) {
          await executeQuery("DELETE FROM examenes_evaluadores WHERE examen_id = $1 AND evaluador_id = ANY($2)", [
            id,
            evaluadoresAEliminar,
          ])
        }
      }

      // 3. Obtener estaciones existentes
      const estacionesExistentes = await executeQuery("SELECT id FROM estaciones WHERE examen_id = $1", [id])
      const estacionesExistentesIds = estacionesExistentes.map((e: any) => e.id)

      // 4. Procesar estaciones
      const estacionesNuevasIds: number[] = []
      if (data.estaciones && data.estaciones.length > 0) {
        for (const estacion of data.estaciones) {
          let estacionId

          // Validar datos de la estación
          if (!estacion.titulo || !estacion.duracion_minutos || estacion.orden == null) {
            throw new Error("Faltan campos requeridos en la estación (titulo, duracion_minutos, orden)")
          }

          // Actualizar estación existente
          if (estacion.id && estacionesExistentesIds.includes(estacion.id)) {
            const estacionQuery = `
              UPDATE estaciones
              SET titulo = $1, descripcion = $2, duracion_minutos = $3, orden = $4, activo = $5
              WHERE id = $6
              RETURNING id
            `
            const estacionResult = await executeQuery(estacionQuery, [
              estacion.titulo,
              estacion.descripcion || null,
              estacion.duracion_minutos,
              estacion.orden,
              estacion.activo ?? true,
              estacion.id,
            ])
            estacionId = estacionResult[0]?.id
          }
          // Crear nueva estación
          else {
            const estacionQuery = `
              INSERT INTO estaciones (examen_id, titulo, descripcion, duracion_minutos, orden, activo)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING id
            `
            const estacionResult = await executeQuery(estacionQuery, [
              id,
              estacion.titulo,
              estacion.descripcion || null,
              estacion.duracion_minutos,
              estacion.orden,
              estacion.activo ?? true,
            ])
            estacionId = estacionResult[0]?.id
          }

          if (!estacionId) {
            throw new Error("No se pudo crear o actualizar la estación")
          }
          estacionesNuevasIds.push(estacionId)

          // 5. Obtener preguntas existentes para la estación
          const preguntasExistentes = await executeQuery("SELECT id FROM preguntas WHERE estacion_id = $1", [
            estacionId,
          ])
          const preguntasExistentesIds = preguntasExistentes.map((p: any) => p.id)

          // 6. Procesar preguntas
          const preguntasNuevasIds: number[] = []
          if (estacion.preguntas && estacion.preguntas.length > 0) {
            for (const pregunta of estacion.preguntas) {
              let preguntaId

              // Validar datos de la pregunta
              if (!pregunta.texto || !pregunta.tipo || pregunta.orden == null) {
                throw new Error("Faltan campos requeridos en la pregunta (texto, tipo, orden)")
              }

              // Verificar si la pregunta tiene respuestas asociadas
              if (pregunta.id && preguntasExistentesIds.includes(pregunta.id)) {
                const respuestasCount = await executeQuery(
                  "SELECT COUNT(*) FROM respuestas_alumnos WHERE pregunta_id = $1",
                  [pregunta.id],
                )
                if (Number.parseInt(respuestasCount[0].count) > 0 && pregunta.eliminado) {
                  throw new Error(
                    `No se puede eliminar la pregunta con ID ${pregunta.id} porque tiene respuestas asociadas`,
                  )
                }
              }

              // Actualizar pregunta existente
              if (pregunta.id && preguntasExistentesIds.includes(pregunta.id) && !pregunta.eliminado) {
                const preguntaQuery = `
                  UPDATE preguntas
                  SET texto = $1, tipo = $2, obligatoria = $3, orden = $4, valor_minimo = $5, valor_maximo = $6, puntaje = $7
                  WHERE id = $8
                  RETURNING id
                `
                const preguntaResult = await executeQuery(preguntaQuery, [
                  pregunta.texto,
                  pregunta.tipo,
                  pregunta.obligatoria ?? false,
                  pregunta.orden,
                  pregunta.valor_minimo ?? null,
                  pregunta.valor_maximo ?? null,
                  pregunta.puntaje ?? null,
                  pregunta.id,
                ])
                preguntaId = preguntaResult[0]?.id
              }
              // Crear nueva pregunta
              else if (!pregunta.eliminado) {
                const preguntaQuery = `
                  INSERT INTO preguntas (estacion_id, texto, tipo, obligatoria, orden, valor_minimo, valor_maximo, puntaje)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                  RETURNING id
                `
                const preguntaResult = await executeQuery(preguntaQuery, [
                  estacionId,
                  pregunta.texto,
                  pregunta.tipo,
                  pregunta.obligatoria ?? false,
                  pregunta.orden,
                  pregunta.valor_minimo ?? null,
                  pregunta.valor_maximo ?? null,
                  pregunta.puntaje ?? null,
                ])
                preguntaId = preguntaResult[0]?.id
              }

              if (preguntaId) {
                preguntasNuevasIds.push(preguntaId)

                // 7. Procesar opciones
                if (pregunta.opciones && pregunta.opciones.length > 0) {
                  // Obtener opciones existentes
                  const opcionesExistentes = await executeQuery("SELECT id FROM opciones WHERE pregunta_id = $1", [
                    preguntaId,
                  ])
                  const opcionesExistentesIds = opcionesExistentes.map((o: any) => o.id)

                  const opcionesNuevasIds: number[] = []
                  for (const opcion of pregunta.opciones) {
                    let opcionId

                    // Validar datos de la opción
                    if (!opcion.texto || opcion.orden == null) {
                      throw new Error("Faltan campos requeridos en la opción (texto, orden)")
                    }

                    // Actualizar opción existente
                    if (opcion.id && opcionesExistentesIds.includes(opcion.id) && !opcion.eliminado) {
                      const opcionQuery = `
                        UPDATE opciones
                        SET texto = $1, es_correcta = $2, orden = $3
                        WHERE id = $4
                        RETURNING id
                      `
                      const opcionResult = await executeQuery(opcionQuery, [
                        opcion.texto,
                        opcion.es_correcta ?? false,
                        opcion.orden,
                        opcion.id,
                      ])
                      opcionId = opcionResult[0]?.id
                    }
                    // Crear nueva opción
                    else if (!opcion.eliminado) {
                      const opcionQuery = `
                        INSERT INTO opciones (pregunta_id, texto, es_correcta, orden)
                        VALUES ($1, $2, $3, $4)
                        RETURNING id
                      `
                      const opcionResult = await executeQuery(opcionQuery, [
                        preguntaId,
                        opcion.texto,
                        opcion.es_correcta ?? false,
                        opcion.orden,
                      ])
                      opcionId = opcionResult[0]?.id
                    }

                    if (opcionId) {
                      opcionesNuevasIds.push(opcionId)
                    }
                  }

                  // Eliminar opciones marcadas como eliminadas o no incluidas
                  const opcionesAEliminar = opcionesExistentesIds.filter(
                    (oid: number) =>
                      !opcionesNuevasIds.includes(oid) ||
                      pregunta.opciones.some((o: any) => o.id === oid && o.eliminado),
                  )
                  if (opcionesAEliminar.length > 0) {
                    await executeQuery("DELETE FROM opciones WHERE id = ANY($1)", [opcionesAEliminar])
                  }
                }
              }
            }
          }

          // 8. Eliminar preguntas marcadas como eliminadas o no incluidas
          const preguntasAEliminar = preguntasExistentesIds.filter(
            (pid: number) =>
              !preguntasNuevasIds.includes(pid) || estacion.preguntas.some((p: any) => p.id === pid && p.eliminado),
          )
          if (preguntasAEliminar.length > 0) {
            // Verificar si alguna pregunta tiene respuestas asociadas
            const respuestasCount = await executeQuery(
              "SELECT COUNT(*) FROM respuestas_alumnos WHERE pregunta_id = ANY($1)",
              [preguntasAEliminar],
            )
            if (Number.parseInt(respuestasCount[0].count) > 0) {
              throw new Error("No se pueden eliminar preguntas porque tienen respuestas asociadas")
            }
            await executeQuery("DELETE FROM preguntas WHERE id = ANY($1)", [preguntasAEliminar])
          }

            // NUEVO: Calcular y actualizar el puntaje_maximo de la estación
            const puntajeMaximoQuery = `
              SELECT COALESCE(SUM(puntaje), 0) as puntaje_maximo
              FROM preguntas
              WHERE estacion_id = $1 AND puntaje IS NOT NULL
            `;
            const puntajeMaximoResult = await executeQuery(puntajeMaximoQuery, [estacionId]);
            const puntajeMaximo = Number.parseFloat(puntajeMaximoResult[0].puntaje_maximo);

            const updatePuntajeMaximoQuery = `
              UPDATE estaciones
              SET puntaje_maximo = $1
              WHERE id = $2
            `;
            await executeQuery(updatePuntajeMaximoQuery, [puntajeMaximo, estacionId]);
        }
      }

      // 9. Eliminar estaciones marcadas como eliminadas o no incluidas
      const estacionesAEliminar = estacionesExistentesIds.filter(
        (eid: number) =>
          !estacionesNuevasIds.includes(eid) || data.estaciones.some((e: any) => e.id === eid && e.eliminado),
      )
      if (estacionesAEliminar.length > 0) {
        // Verificar si alguna estación tiene preguntas con respuestas asociadas
        const respuestasCount = await executeQuery(
          `
          SELECT COUNT(*) 
          FROM respuestas_alumnos ra
          JOIN preguntas p ON ra.pregunta_id = p.id
          JOIN estaciones e ON p.estacion_id = e.id
          WHERE e.id = ANY($1)
        `,
          [estacionesAEliminar],
        )
        if (Number.parseInt(respuestasCount[0].count) > 0) {
          throw new Error("No se pueden eliminar estaciones porque tienen preguntas con respuestas asociadas")
        }
        await executeQuery("DELETE FROM estaciones WHERE id = ANY($1)", [estacionesAEliminar])
      }

      // Confirmar la transacción
      await executeQuery("COMMIT")

      // Devolver el examen actualizado
      return NextResponse.json(examenResult[0], { headers: { "Cache-Control": "no-store" } })
    } catch (error) {
      // Revertir la transacción en caso de error
      await executeQuery("ROLLBACK")
      throw error
    }
  } catch (error) {
    console.error(`Error en PUT /api/examenes/${params.id}:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al actualizar el examen" },
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
