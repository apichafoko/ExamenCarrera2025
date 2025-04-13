import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { gruposService } from "@/lib/db-service"
import { successResponse, errorResponse } from "@/lib/api-utils"
import { executeQuery } from "@/lib/db"

// Modificar la consulta para incluir el campo activo en el listado de grupos
export async function GET(request: NextRequest) {
  try {
    // Verificar si existe la columna activo en la tabla grupos
    const columnsResult = await executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'grupos' AND column_name = 'activo'
    `)

    const hasActivoColumn = columnsResult.length > 0

    // Si la columna no existe, intentar crearla
    if (!hasActivoColumn) {
      try {
        await executeQuery(`
          ALTER TABLE grupos 
          ADD COLUMN activo BOOLEAN DEFAULT TRUE
        `)
        console.log("Columna 'activo' añadida a la tabla grupos")
      } catch (error) {
        console.error("Error al añadir columna 'activo' a la tabla grupos:", error)
      }
    }

    // Obtener todos los grupos incluyendo el campo activo
    const grupos = await gruposService.getAll()
    return successResponse(grupos)
  } catch (error) {
    console.error("Error en GET /api/grupos:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener los grupos" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nombre, fecha, alumnos_ids } = await request.json()

    if (!nombre || !Array.isArray(alumnos_ids) || alumnos_ids.length === 0) {
      return errorResponse("Faltan datos obligatorios: nombre y alumnos", 400)
    }

    // Crear grupo
    const grupoInsertResult = await executeQuery(
      `INSERT INTO grupos (nombre, fecha_creacion) VALUES ($1, $2) RETURNING *`,
      [nombre, fecha],
    )

    const nuevoGrupo = grupoInsertResult[0]
    if (!nuevoGrupo) {
      return errorResponse("No se pudo crear el grupo", 400)
    }

    // Validar que los alumnos no estén ya asignados al grupo
    const placeholders = alumnos_ids.map((_, idx) => `$${idx + 2}`).join(", ")
    const alumnosYaAsignados = await executeQuery(
      `SELECT alumno_id FROM alumnos_grupos WHERE grupo_id = $1 AND alumno_id IN (${placeholders})`,
      [nuevoGrupo.id, ...alumnos_ids],
    )

    if (alumnosYaAsignados.length > 0) {
      const idsRepetidos = alumnosYaAsignados.map((r: any) => r.alumno_id).join(", ")
      return errorResponse(`Los siguientes alumnos ya están asignados al grupo: ${idsRepetidos}`, 400)
    }

    // Insertar alumnos asignados al grupo
    const values = alumnos_ids.map((_, i) => `($1, $${i + 2})`).join(", ")
    await executeQuery(`INSERT INTO alumnos_grupos (grupo_id, alumno_id) VALUES ${values}`, [
      nuevoGrupo.id,
      ...alumnos_ids,
    ])

    return successResponse(nuevoGrupo, 201)
  } catch (error) {
    console.error("Error en POST /api/grupos:", error)
    return errorResponse("Error interno al crear el grupo", 500)
  }
}
