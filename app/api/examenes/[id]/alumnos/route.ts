import { type NextRequest, NextResponse } from "next/server"
import { alumnosExamenesService } from "@/lib/db-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400, headers: { "Cache-Control": "no-store" } })
    }

    const alumnos = await alumnosExamenesService.getAlumnosDeExamen(id)

    return NextResponse.json(alumnos, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error(`Error en GET /api/examenes/${params.id}/alumnos:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener los alumnos del examen" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
