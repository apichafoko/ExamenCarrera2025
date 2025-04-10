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
    return NextResponse.json(grupos, {
      headers: { "Cache-Control": "no-store" },
    })
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
    const data = await request.json()
    const nuevoGrupo = await gruposService.create(data)

    if (!nuevoGrupo) {
      return errorResponse("No se pudo crear el grupo", 400)
    }

    return successResponse(nuevoGrupo, 201)
  } catch (error) {
    console.error("Error en POST /api/grupos:", error)
    return errorResponse(error)
  }
}
