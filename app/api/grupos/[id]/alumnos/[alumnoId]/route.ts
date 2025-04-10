import { type NextRequest, NextResponse } from "next/server"
import { gruposService } from "@/lib/db-service"
import { handleApiError, createSuccessResponse } from "@/lib/api-utils"

// DELETE /api/grupos/[id]/alumnos/[alumnoId] - Eliminar un alumno del grupo
export async function DELETE(request: NextRequest, { params }: { params: { id: string; alumnoId: string } }) {
  try {
    const grupoId = Number.parseInt(params.id)
    const alumnoId = Number.parseInt(params.alumnoId)

    if (isNaN(grupoId) || isNaN(alumnoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const resultado = await gruposService.eliminarAlumno(grupoId, alumnoId)

    if (resultado) {
      return createSuccessResponse({
        success: true,
        message: "Alumno eliminado del grupo correctamente",
      })
    } else {
      return NextResponse.json(
        {
          error: "No se pudo eliminar el alumno del grupo",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    return handleApiError(error)
  }
}
