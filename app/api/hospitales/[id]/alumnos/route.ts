import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID de hospital inválido" }, { status: 400 })
    }

    const query = `
      SELECT 
        id, 
        nombre, 
        apellido,  
        documento
      FROM 
        alumnos
      WHERE 
        hospital_id = $1
      ORDER BY 
        apellido, nombre
    `

    const result = await executeQuery(query, [id])

    return NextResponse.json(result, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error al obtener alumnos del hospital:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido al obtener alumnos del hospital" },
      { status: 500 },
    )
  }
}
