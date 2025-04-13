import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const { alumnoId, fecha, numeroIdentificacion } = await request.json()

    // Validar los datos
    if (!alumnoId) {
      return NextResponse.json({ error: "ID de alumno no proporcionado" }, { status: 400 })
    }
    if (!fecha) {
      return NextResponse.json({ error: "Fecha no proporcionada" }, { status: 400 })
    }
    if (!numeroIdentificacion) {
      return NextResponse.json({ error: "Número de identificación no proporcionado" }, { status: 400 })
    }

    // Verificar si el número de identificación ya está asignado a otro alumno en la misma fecha
    const verificarQuery = `
      SELECT 
        a.id, a.nombre, a.apellido
      FROM 
        alumnos a
      JOIN 
        alumnos_examenes ae ON a.id = ae.alumno_id
      JOIN 
        examenes e ON ae.examen_id = e.id
      WHERE 
        TO_CHAR(e.fecha_aplicacion, 'YYYY-MM-DD') = $1
        AND ae.numero_identificacion = $2
        AND a.id != $3
      LIMIT 1
    `

    const verificarResult = await executeQuery(verificarQuery, [fecha, numeroIdentificacion, alumnoId])

    if (verificarResult.length > 0) {
      return NextResponse.json(
        {
          error: "El número de identificación ya está asignado a otro alumno en esta fecha",
          alumno: verificarResult[0],
        },
        { status: 400 },
      )
    }

    // Actualizar el número de identificación para todos los exámenes del alumno en la fecha especificada
    const updateQuery = `
      UPDATE alumnos_examenes
      SET numero_identificacion = $1
      WHERE alumno_id = $2
        AND examen_id IN (
          SELECT id FROM examenes WHERE TO_CHAR(fecha_aplicacion, 'YYYY-MM-DD') = $3
        )
      RETURNING *
    `

    const updateResult = await executeQuery(updateQuery, [numeroIdentificacion, alumnoId, fecha])

    // Devolver los resultados
    return NextResponse.json(
      {
        message: "Número de identificación asignado correctamente",
        registrosActualizados: updateResult.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al asignar número de identificación:", error)
    return NextResponse.json(
      { error: "Error al asignar número de identificación", message: (error as Error).message },
      { status: 500 },
    )
  }
}
