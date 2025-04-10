import { type NextRequest, NextResponse } from "next/server"
import { evaluadoresService } from "@/lib/db-service"
import { handleApiError, createSuccessResponse } from "@/lib/api-utils"
import { successResponse, errorResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const evaluador = await evaluadoresService.getById(id)

    if (!evaluador) {
      return NextResponse.json({ error: "Evaluador no encontrado" }, { status: 404 })
    }

    return createSuccessResponse(evaluador)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const data = await request.json()
    const evaluador = await evaluadoresService.update(id, data)

    if (!evaluador) {
      return NextResponse.json({ error: "Evaluador no encontrado" }, { status: 404 })
    }

    return createSuccessResponse(evaluador)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id, 10)
    if (isNaN(id)) {
      return errorResponse("ID inválido", 400)
    }

    // Verificar si el evaluador tiene exámenes asignados usando el método existente
    const tieneExamenes = await evaluadoresService.tieneExamenesAsignados(id)
    if (tieneExamenes) {
      return errorResponse("No se puede eliminar el evaluador porque tiene exámenes asignados", 409)
    }

    // Proceder con la eliminación
    const result = await evaluadoresService.delete(id)
    if (!result) {
      return errorResponse("Evaluador no encontrado", 404)
    }

    return successResponse({ message: "Evaluador eliminado" })
  } catch (error) {
    console.error("Error en DELETE /api/evaluadores/[id]:", error)
    return errorResponse(error)
  }
}
