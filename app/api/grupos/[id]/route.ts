import { type NextRequest, NextResponse } from "next/server"
import { gruposService } from "@/lib/db-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400, headers: { "Cache-Control": "no-store" } })
    }

    const grupo = await gruposService.getById(id)
    if (!grupo) {
      return NextResponse.json(
        { message: "Grupo no encontrado" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      )
    }

    // Obtener alumnos del grupo
    const alumnos = await gruposService.getAlumnos(id)
    grupo.alumnos = alumnos

    return NextResponse.json(grupo, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error(`Error en GET /api/grupos/${params.id}:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener el grupo" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
