import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const alumnoId = Number(params.id)
    const examenId = Number(request.nextUrl.searchParams.get("examenId"))

    if (isNaN(alumnoId) || isNaN(examenId)) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }

    const query = `
      SELECT 1
      FROM alumnos_examenes
      WHERE alumno_id = $1 AND examen_id = $2
      LIMIT 1
    `
    const result = await executeQuery(query, [alumnoId, examenId])

    return NextResponse.json({ asignado: result.length > 0 }, { status: 200 })
  } catch (error) {
    console.error("Error en GET /api/alumnos/[id]/tiene-examen:", error)
    return NextResponse.json({ error: "Error al verificar asignación" }, { status: 500 })
  }
}
