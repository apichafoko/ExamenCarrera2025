import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Datos recibidos:", JSON.stringify(body))

    const {
      alumno_examen_id,
      estacion_id,
      respuestas,
      puntaje_estacion,
      observaciones_estacion,
      calificacion_examen,
      observaciones_examen,
    } = body

    if (!alumno_examen_id || !estacion_id || !respuestas || respuestas.length === 0) {
      return NextResponse.json(
        {
          message: "Faltan campos requeridos",
          received: { alumno_examen_id, estacion_id, respuestasCount: respuestas?.length },
        },
        { status: 400 }
      )
    }

    const sql = neon(process.env.DATABASE_URL!)

    try {
      await sql`BEGIN`

      console.log(`Procesando ${respuestas.length} respuestas para alumno_examen_id=${alumno_examen_id}`)
      
      /*
      // Escape seguro del texto de respuesta
      const escape = (texto: string) =>
        texto.replace(/'/g, "''") // escapa comillas simples
      
      const insertValues = respuestas
        .map((r) => `(${r.alumno_examen_id}, ${r.pregunta_id}, '${escape(r.respuesta_texto || "")}', ${r.puntaje ?? 0})`)
        .join(", ")

      await sql.unsafe(`
        INSERT INTO respuestas_alumnos (alumno_examen_id, pregunta_id, respuesta, puntaje)
        VALUES ${insertValues}
        ON CONFLICT (alumno_examen_id, pregunta_id)
        DO UPDATE SET
          respuesta = EXCLUDED.respuesta,
          puntaje = EXCLUDED.puntaje
      `)*/

      // Insertar respuestas usando consulta parametrizada
      for (const r of respuestas) {
        await sql`
          INSERT INTO respuestas_alumnos (alumno_examen_id, pregunta_id, respuesta, puntaje)
          VALUES (${r.alumno_examen_id}, ${r.pregunta_id}, ${r.respuesta_texto || ""}, ${r.puntaje ?? 0})
          ON CONFLICT (alumno_examen_id, pregunta_id)
          DO UPDATE SET
            respuesta = EXCLUDED.respuesta,
            puntaje = EXCLUDED.puntaje
        `;
      }

      // UPSERT para resultado de estación
      await sql`
        INSERT INTO resultados_estaciones (
          alumno_examen_id,
          estacion_id,
          calificacion,
          observaciones,
          fecha_evaluacion
        )
        VALUES (
          ${alumno_examen_id},
          ${estacion_id},
          ${puntaje_estacion},
          ${observaciones_estacion || ""},
          NOW()
        )
        ON CONFLICT (alumno_examen_id, estacion_id)
        DO UPDATE SET
          calificacion = EXCLUDED.calificacion,
          observaciones = EXCLUDED.observaciones,
          fecha_evaluacion = EXCLUDED.fecha_evaluacion
      `

      // Finalizar examen
      await sql`
        UPDATE alumnos_examenes 
        SET estado = 'Completado', 
            calificacion = ${calificacion_examen}, 
            observaciones = ${observaciones_examen || ""}, 
            fecha_fin = NOW() 
        WHERE id = ${alumno_examen_id}
      `

      await sql`COMMIT`
      console.log("Transacción completada exitosamente")

      return NextResponse.json({
        message: "Examen finalizado correctamente",
        alumno_examen_id,
        estacion_id,
        calificacion_examen,
      })
    } catch (error) {
      await sql`ROLLBACK`
      console.error("Error en la transacción:", error)
      return NextResponse.json(
        {
          message: "Error durante la transacción",
          error: String(error),
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error al finalizar el examen:", error)
    return NextResponse.json(
      {
        message: "Error al finalizar el examen",
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
