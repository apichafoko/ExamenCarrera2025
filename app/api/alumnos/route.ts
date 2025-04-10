import type { NextRequest } from "next/server"
import { alumnosService } from "@/lib/db-service"
import { successResponse, errorResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    console.log("Ejecutando GET /api/alumnos")
    const alumnos = await alumnosService.getAll()
    console.log(`Alumnos obtenidos: ${alumnos.length}`)

    return successResponse(alumnos)
  } catch (error) {
    console.error("Error en GET /api/alumnos:", error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const nuevoAlumno = await alumnosService.create(data)

    if (!nuevoAlumno) {
      return errorResponse("No se pudo crear el alumno", 400)
    }

    return successResponse(nuevoAlumno, 201)
  } catch (error) {
    console.error("Error en POST /api/alumnos:", error)
    return errorResponse(error)
  }
}
