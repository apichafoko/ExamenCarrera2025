// /app/api/examenes/[id]/duplicar/route.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { executeQuery } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-utils"
import logger from "@/lib/logger"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  
  const { id } = req.query
  const { fechaAplicacion } = req.body

  if (!id || !fechaAplicacion) {
    return res.status(400).json({ error: "ID del examen y fecha de aplicación son requeridos" })
  }

  try {
    logger.log(`Duplicando examen ID ${id} para la fecha ${fechaAplicacion}`)

    // Validar la fecha
    const newDate = new Date(fechaAplicacion)
    if (isNaN(newDate.getTime())) {
      return res.status(400).json({ error: "Fecha de aplicación inválida" })
    }

    // Iniciar transacción
    await executeQuery("BEGIN")

    // 1. Obtener el examen original
    const examenQuery = `
      SELECT * FROM examenes WHERE id = $1
    `
    const examenResult = await executeQuery(examenQuery, [id])
    if (examenResult.length === 0) {
      throw new Error("Examen no encontrado")
    }
    const examen = examenResult[0]

    // 2. Crear el nuevo examen
    const newExamenQuery = `
      INSERT INTO examenes (titulo, descripcion, fecha_aplicacion, estado)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `
    const newExamenResult = await executeQuery(newExamenQuery, [
      `${examen.titulo} (Copia ${formatDate(newDate)})`,
      examen.descripcion,
      newDate.toISOString(),
      examen.estado,
    ])
    const newExamenId = newExamenResult[0].id

    // 3. Duplicar estaciones
    const estacionesQuery = `
      SELECT * FROM estaciones WHERE examen_id = $1
    `
    const estaciones = await executeQuery(estacionesQuery, [id])

    const estacionIdMap = new Map<number, number>() // Mapa de IDs antiguos a nuevos

    for (const estacion of estaciones) {
      const newEstacionQuery = `
        INSERT INTO estaciones (examen_id, titulo, descripcion, duracion_minutos)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `
      const newEstacionResult = await executeQuery(newEstacionQuery, [
        newExamenId,
        estacion.titulo,
        estacion.descripcion,
        estacion.duracion_minutos,
      ])
      const newEstacionId = newEstacionResult[0].id
      estacionIdMap.set(estacion.id, newEstacionId)

      // 4. Duplicar preguntas
      const preguntasQuery = `
        SELECT * FROM preguntas WHERE estacion_id = $1
      `
      const preguntas = await executeQuery(preguntasQuery, [estacion.id])

      for (const pregunta of preguntas) {
        const newPreguntaQuery = `
          INSERT INTO preguntas (estacion_id, texto, tipo, puntaje)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `
        const newPreguntaResult = await executeQuery(newPreguntaQuery, [
          newEstacionId,
          pregunta.texto,
          pregunta.tipo,
          pregunta.puntaje,
        ])
        const newPreguntaId = newPreguntaResult[0].id

        // 5. Duplicar opciones
        const opcionesQuery = `
          SELECT * FROM opciones WHERE pregunta_id = $1
        `
        const opciones = await executeQuery(opcionesQuery, [pregunta.id])

        for (const opcion of opciones) {
          const newOpcionQuery = `
            INSERT INTO opciones (pregunta_id, texto, es_correcta)
            VALUES ($1, $2, $3)
          `
          await executeQuery(newOpcionQuery, [newPreguntaId, opcion.texto, opcion.es_correcta])
        }
      }
    }

    // 6. Duplicar evaluadores
    const evaluadoresQuery = `
      SELECT * FROM examen_evaluadores WHERE examen_id = $1
    `
    const evaluadores = await executeQuery(evaluadoresQuery, [id])

    for (const evaluador of evaluadores) {
      const newEvaluadorQuery = `
        INSERT INTO examen_evaluadores (examen_id, evaluador_id)
        VALUES ($1, $2)
      `
      await executeQuery(newEvaluadorQuery, [newExamenId, evaluador.evaluador_id])
    }

    // Confirmar transacción
    await executeQuery("COMMIT")

    logger.log(`Examen ID ${id} duplicado exitosamente como ID ${newExamenId}`)
    return successResponse({ id: newExamenId }, 201)
  } catch (error) {
    await executeQuery("ROLLBACK")
    logger.error("Error duplicando examen:", error)
    return errorResponse(error)
  }
}

// Utilidad para formatear la fecha (puedes usar la misma que en el frontend)
function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
