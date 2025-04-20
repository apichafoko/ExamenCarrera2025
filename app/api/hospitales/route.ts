import type { NextRequest } from "next/server"
import { hospitalesService } from "@/lib/db-service"
import { successResponse, errorResponse } from "@/lib/api-utils"
import logger from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    logger.log("Ejecutando GET /api/hospitales")
    const hospitales = await hospitalesService.getAll()
    logger.log(`Hospitales obtenidos: ${hospitales.length}`)

    return successResponse(hospitales)
  } catch (error) {
    logger.error("Error en GET /api/hospitales:", error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const nuevoHospital = await hospitalesService.create(data)

    if (!nuevoHospital) {
      return errorResponse("No se pudo crear el hospital", 400)
    }

    return successResponse(nuevoHospital, 201)
  } catch (error) {
    logger.error("Error en POST /api/hospitales:", error)
    return errorResponse(error)
  }
}
