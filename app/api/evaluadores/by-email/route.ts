import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ message: "Se requiere el parámetro email" }, { status: 400 })
    }

    console.log(`GET /api/evaluadores/by-email?email=${email}`)

    // Verificar si la tabla evaluadores existe
    try {
      const tablaExiste = await executeQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'evaluadores'
        ) as existe;
      `)

      const existeTablaEvaluadores = tablaExiste[0]?.existe || false

      if (!existeTablaEvaluadores) {
        console.log("La tabla evaluadores no existe")
        return NextResponse.json({ message: "La tabla evaluadores no existe en la base de datos" }, { status: 500 })
      }
    } catch (error) {
      console.error("Error al verificar la existencia de la tabla evaluadores:", error)
      // Continuar con la consulta principal incluso si falla la verificación
    }

    // Consulta para obtener el evaluador por email
    const query = `
      SELECT id, nombre, email, hospital_id 
      FROM evaluadores 
      WHERE email = $1
      LIMIT 1
    `

    const result = await executeQuery(query, [email])

    if (!result || result.length === 0) {
      return NextResponse.json({ message: "No se encontró un evaluador con ese email" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error(`Error en GET /api/evaluadores/by-email:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al buscar el evaluador" },
      { status: 500 },
    )
  }
}
