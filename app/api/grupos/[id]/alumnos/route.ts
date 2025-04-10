import { type NextRequest, NextResponse } from "next/server"
import { gruposService } from "@/lib/db-service"
import { handleApiError, createSuccessResponse } from "@/lib/api-utils"
import { executeQuery } from "@/lib/db"

// GET /api/grupos/[id]/alumnos - Obtener alumnos de un grupo
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de grupo inválido" }, { status: 400 })
    }

    // Consulta para obtener los alumnos del grupo
    const query = `
      SELECT a.*, h.nombre as hospital_nombre
      FROM alumnos a
      LEFT JOIN hospitales h ON a.hospital_id = h.id
      LEFT JOIN alumnos_grupos ag ON a.id = ag.alumno_id
      WHERE ag.grupo_id = $1
      ORDER BY a.apellido, a.nombre
    `
    const alumnos = await executeQuery(query, [id])

    return createSuccessResponse(alumnos)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/grupos/[id]/alumnos - Asignar un alumno al grupo
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de grupo inválido" }, { status: 400 })
    }

    const { alumnoId } = await request.json()
    if (!alumnoId) {
      return NextResponse.json({ error: "Se requiere el ID del alumno" }, { status: 400 })
    }

    const resultado = await gruposService.asignarAlumno(id, alumnoId)
    if (resultado) {
      return createSuccessResponse({ success: true, message: "Alumno asignado correctamente" })
    } else {
      return NextResponse.json({ error: "No se pudo asignar el alumno al grupo" }, { status: 400 })
    }
  } catch (error) {
    return handleApiError(error)
  }
}
