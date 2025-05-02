import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Consulta SQL para obtener las fechas de exámenes y la cantidad de exámenes por fecha
    const query = `
      SELECT 
        TO_CHAR(fecha_aplicacion, 'YYYY-MM-DD') as fecha,
        COUNT(*) as cantidad
      FROM 
        examenes
      WHERE
        fecha_aplicacion IS NOT NULL AND estado = 'ACTIVO'
      GROUP BY 
        TO_CHAR(fecha_aplicacion, 'YYYY-MM-DD')
      ORDER BY 
        fecha DESC
    `

    // Ejecutar la consulta usando executeQuery
    const result = await executeQuery(query)

    // Devolver los resultados
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error al obtener fechas de exámenes:", error)
    return NextResponse.json(
      { error: "Error al obtener fechas de exámenes", message: (error as Error).message },
      { status: 500 },
    )
  }
}
