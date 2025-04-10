import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

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

    return NextResponse.json(examen, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
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
        data.descripcion,
        data.fecha_aplicacion,
        data.estado || "Activo",
        id,
      ])

      if (examenResult.length === 0) {
        throw new Error("No se pudo actualizar el examen")
      }

      // 2. Actualizar los evaluadores asignados
      if (data.evaluadores_ids) {
        // Primero eliminar todas las asignaciones existentes
        //await executeQuery("DELETE FROM examenes_evaluadores WHERE examen_id = $1", [id])

        // Luego insertar las nuevas asignaciones
        if (data.evaluadores_ids.length > 0) {
          for (const evaluadorId of data.evaluadores_ids) {
            await executeQuery("INSERT INTO examenes_evaluadores (examen_id, evaluador_id) VALUES ($1, $2)", [
              id,
              evaluadorId,
            ])
          }
        }
      }

      // 3. Actualizar las estaciones
      if (data.estaciones && data.estaciones.length > 0) {
        for (const estacion of data.estaciones) {
          let estacionId

          // Si la estación ya existe, actualizarla
          if (estacion.id && estacion.id > 0) {
            const estacionQuery = `
              UPDATE estaciones
              SET titulo = $1, descripcion = $2, duracion_minutos = $3, orden = $4, activo = $5
              WHERE id = $6
              RETURNING id
            `

            const estacionResult = await executeQuery(estacionQuery, [
              estacion.titulo,
              estacion.descripcion,
              estacion.duracion_minutos,
              estacion.orden,
              estacion.activo,
              estacion.id,
            ])

            if (estacionResult.length > 0) {
              estacionId = estacionResult[0].id
            }
          }
          // Si es una nueva estación, crearla
          else {
            const estacionQuery = `
              INSERT INTO estaciones (examen_id, titulo, descripcion, duracion_minutos, orden, activo)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING id
            `

            const estacionResult = await executeQuery(estacionQuery, [
              id,
              estacion.titulo,
              estacion.descripcion,
              estacion.duracion_minutos,
              estacion.orden,
              estacion.activo,
            ])

            if (estacionResult.length > 0) {
              estacionId = estacionResult[0].id
            }
          }

          // Si tenemos un ID de estación válido, procesar sus preguntas
          if (estacionId && estacion.preguntas && estacion.preguntas.length > 0) {
            for (const pregunta of estacion.preguntas) {
              let preguntaId

              // Si la pregunta ya existe, actualizarla
              if (pregunta.id && pregunta.id > 0) {
                const preguntaQuery = `
                  UPDATE preguntas
                  SET texto = $1, tipo = $2, obligatoria = $3, orden = $4, valor_minimo = $5, valor_maximo = $6, puntaje = $7
                  WHERE id = $8
                  RETURNING id
                `

                const preguntaResult = await executeQuery(preguntaQuery, [
                  pregunta.texto,
                  pregunta.tipo,
                  pregunta.obligatoria,
                  pregunta.orden,
                  pregunta.valor_minimo,
                  pregunta.valor_maximo,
                  pregunta.puntaje,
                  pregunta.id,
                ])

                if (preguntaResult.length > 0) {
                  preguntaId = preguntaResult[0].id
                }
              }
              // Si es una nueva pregunta, crearla
              else {
                const preguntaQuery = `
                  INSERT INTO preguntas (estacion_id, texto, tipo, obligatoria, orden, valor_minimo, valor_maximo, puntaje)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                  RETURNING id
                `

                const preguntaResult = await executeQuery(preguntaQuery, [
                  estacionId,
                  pregunta.texto,
                  pregunta.tipo,
                  pregunta.obligatoria,
                  pregunta.orden,
                  pregunta.valor_minimo,
                  pregunta.valor_maximo,
                  pregunta.puntaje,
                ])

                if (preguntaResult.length > 0) {
                  preguntaId = preguntaResult[0].id
                }
              }

              // Si tenemos un ID de pregunta válido y la pregunta tiene opciones, procesarlas
              if (preguntaId && pregunta.opciones && pregunta.opciones.length > 0) {
                // Primero eliminar todas las opciones existentes
                await executeQuery("DELETE FROM opciones WHERE pregunta_id = $1", [preguntaId])

                // Luego insertar las nuevas opciones
                for (const opcion of pregunta.opciones) {
                  await executeQuery(
                    `INSERT INTO opciones (pregunta_id, texto, es_correcta, orden)
                     VALUES ($1, $2, $3, $4)`,
                    [preguntaId, opcion.texto, opcion.es_correcta, opcion.orden],
                  )
                }
              }
            }
          }
        }
      }

      // Confirmar la transacción
      await executeQuery("COMMIT")

      // Devolver el examen actualizado
      return NextResponse.json(examenResult[0], {
        headers: { "Cache-Control": "no-store" },
      })
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
