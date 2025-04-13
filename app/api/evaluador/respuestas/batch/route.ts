import { type NextRequest, NextResponse } from "next/server"
import { validateJWT } from "@/lib/auth-service"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.split(" ")[1] || request.cookies.get("token")?.value || ""
    const userData = await validateJWT(token)

    if (!userData) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[SERVER]\nDatos recibidos en POST /api/evaluador/respuestas/batch:", JSON.stringify(body))

    // Validar que se proporcionen los campos requeridos
    if (!body.respuestas || !Array.isArray(body.respuestas) || body.respuestas.length === 0) {
      console.error("Formato de datos inválido:", body)
      return NextResponse.json(
        { message: "Formato de datos inválido. Se espera un array de respuestas." },
        { status: 400 },
      )
    }

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

    if (!respuestaColumnName) {
      console.error("No se encontró una columna para almacenar la respuesta en la tabla respuestas_alumnos")
      return NextResponse.json({ message: "Error en la estructura de la base de datos" }, { status: 500 })
    }

    // Procesar todas las respuestas en una transacción
    const resultados = []

    // Iniciar transacción
    await executeQuery("BEGIN", [])

    try {
      for (const respuesta of body.respuestas) {
        // Normalizar los datos
        const alumnoExamenId = Number(respuesta.alumno_examen_id)
        const preguntaId = Number(respuesta.pregunta_id)
        const respuestaTexto = respuesta.respuesta_texto !== undefined ? respuesta.respuesta_texto : respuesta.respuesta
        const puntaje = respuesta.puntaje !== undefined ? Number(respuesta.puntaje) : 0
        const comentario = respuesta.comentario || ""

        // Verificar si ya existe una respuesta para esta pregunta y alumno_examen
        const checkQuery = `
          SELECT id FROM respuestas_alumnos
          WHERE alumno_examen_id = $1 AND pregunta_id = $2
        `
        const existingResponses = await executeQuery(checkQuery, [alumnoExamenId, preguntaId])

        let result
        if (existingResponses.length > 0) {
          // Actualizar respuesta existente
          const updateQuery = `
            UPDATE respuestas_alumnos
            SET ${respuestaColumnName} = $1, puntaje = $2, comentario = $3, fecha_respuesta = CURRENT_TIMESTAMP
            WHERE alumno_examen_id = $4 AND pregunta_id = $5
            RETURNING *
          `
          result = await executeQuery(updateQuery, [respuestaTexto, puntaje, comentario, alumnoExamenId, preguntaId])
        } else {
          // Crear nueva respuesta
          const insertQuery = `
            INSERT INTO respuestas_alumnos (alumno_examen_id, pregunta_id, ${respuestaColumnName}, puntaje, comentario, fecha_respuesta)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING *
          `
          result = await executeQuery(insertQuery, [alumnoExamenId, preguntaId, respuestaTexto, puntaje, comentario])
        }

        if (result.length > 0) {
          resultados.push(result[0])
        }
      }

      // Confirmar transacción
      await executeQuery("COMMIT", [])

      return NextResponse.json({
        message: `${resultados.length} respuestas guardadas correctamente`,
        respuestas: resultados,
      })
    } catch (error) {
      // Revertir transacción en caso de error
      await executeQuery("ROLLBACK", [])
      throw error
    }
  } catch (error) {
    console.error("Error al guardar respuestas por lotes:", error)
    return NextResponse.json(
      {
        message: "Error al guardar las respuestas",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
