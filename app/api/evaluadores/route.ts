import type { NextRequest } from "next/server"
import { evaluadoresService } from "@/lib/db-service"
import { successResponse, errorResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conExamenes = searchParams.get("conExamenes") === "true" // Verifica si el parámetro es "true"

    console.log(`Ejecutando GET /api/evaluadores${conExamenes ? " con exámenes" : ""}`)

    // Elegir el método del servicio según el parámetro
    const evaluadores = conExamenes ? await evaluadoresService.getAllConExamenes() : await evaluadoresService.getAll()

    console.log(`Evaluadores obtenidos: ${evaluadores.length}`)
    return successResponse(evaluadores)
  } catch (error) {
    console.error("Error en GET /api/evaluadores:", error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log("POST /api/evaluadores - Datos recibidos:", JSON.stringify(data, null, 2))

    const nuevoEvaluador = await evaluadoresService.create(data)

    if (!nuevoEvaluador) {
      console.error("No se pudo crear el evaluador - resultado nulo")
      return errorResponse("No se pudo crear el evaluador", 400)
    }

    console.log("Evaluador creado exitosamente:", JSON.stringify(nuevoEvaluador, null, 2))
    return successResponse(nuevoEvaluador, 201)
  } catch (error) {
    console.error("Error en POST /api/evaluadores:", error)
    return errorResponse(`Error: ${error.message || "Error desconocido"}`, 500)
  }
}
