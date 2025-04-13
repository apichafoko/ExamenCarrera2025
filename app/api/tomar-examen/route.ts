import { type NextRequest, NextResponse } from "next/server"
import { evaluadoresService } from "@/lib/db-service"
import { handleApiError, createSuccessResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const estado = searchParams.get("estado")

    if (!userId) {
      return NextResponse.json(
        { message: "El parámetro userId es requerido" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      )
    }

    const parsedUserId = Number.parseInt(userId)
    if (isNaN(parsedUserId)) {
      return NextResponse.json(
        { message: "El userId debe ser un número válido" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      )
    }

    // Obtener el evaluador asociado al usuario
    const evaluador = await evaluadoresService.getByUserId(parsedUserId)
    if (!evaluador) {
      return NextResponse.json(
        { message: "No se encontró un evaluador asociado a este usuario" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      )
    }

    // Obtener los exámenes asignados al evaluador
    const examenes = await evaluadoresService.getExamenesAsignados(evaluador.id)

    // Filtrar por estado si se proporciona
    const filteredExamenes =
      estado && estado !== "todos" ? examenes.filter((examen: any) => examen.estado === estado) : examenes

    return createSuccessResponse(filteredExamenes, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return handleApiError(error)
  }
}
