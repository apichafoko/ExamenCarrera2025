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
        h.id, 
        h.nombre, 
        h.direccion, 
        h.ciudad, 
        h.tipo, 
        COUNT(a.id) as total_alumnos
      FROM 
        hospitales h
      LEFT JOIN 
        alumnos a ON h.id = a.hospital_id
      WHERE 
        h.id = $1
      GROUP BY 
        h.id, h.nombre, h.direccion, h.ciudad, h.tipo
    `

    const result = await executeQuery(query, [id])

    if (result.length === 0) {
      return NextResponse.json({ error: "Hospital no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result[0], {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error al obtener hospital:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido al obtener hospital" },
      { status: 500 },
    )
  }
}
