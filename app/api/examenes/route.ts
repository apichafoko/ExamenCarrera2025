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

