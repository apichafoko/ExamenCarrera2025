import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Obtener la fecha de la consulta
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha")

    if (!fecha) {
      return NextResponse.json({ error: "Fecha no proporcionada" }, { status: 400 })
    }

    // Consulta SQL para obtener los alumnos con exámenes en la fecha especificada
    const query = `
      SELECT 
        a.id,
        a.nombre,
        a.apellido,
        a.documento,
        COUNT(ae.examen_id) as cantidad_examenes,
        MAX(ae.numero_identificacion) as numero_identificacion
      FROM 
        alumnos a
      JOIN 
        alumnos_examenes ae ON a.id = ae.alumno_id
      JOIN 
        examenes e ON ae.examen_id = e.id
      WHERE 
        TO_CHAR(e.fecha_aplicacion, 'YYYY-MM-DD') = $1
      GROUP BY 
        a.id, a.nombre, a.apellido, a.documento
      ORDER BY 
        a.apellido, a.nombre
    `

    // Ejecutar la consulta
    const result = await executeQuery(query, [fecha])

    // Devolver los resultados
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error al obtener alumnos por fecha:", error)
    return NextResponse.json(
      { error: "Error al obtener alumnos por fecha", message: (error as Error).message },
      { status: 500 },
    )
  }
}
