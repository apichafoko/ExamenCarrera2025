import type { NextRequest } from "next/server"
import { examenesService } from "@/lib/db-service"
import { successResponse, errorResponse } from "@/lib/api-utils"
import logger from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    logger.log("Ejecutando GET /api/examenes")
    const examenes = await examenesService.getAll()
    logger.log(`Exámenes obtenidos: ${examenes.length}`)

    return successResponse(examenes)
  } catch (error) {
    logger.error("Error en GET /api/examenes:", error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const nuevoExamen = await examenesService.create(data)

    if (!nuevoExamen) {
      return errorResponse("No se pudo crear el examen", 400)
    }

    return successResponse(nuevoExamen, 201)
  } catch (error) {
    logger.error("Error en POST /api/examenes:", error)
    return errorResponse(error)
  }
}
