import { type NextRequest, NextResponse } from "next/server"
import { evaluadorService } from "@/lib/evaluador-service"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { alumno_examen_id, estacion_id, calificacion, observaciones } = data

    console.log("Datos recibidos en POST /api/evaluador/resultados-estaciones:", data)

    // Validar datos requeridos
    if (!alumno_examen_id || !estacion_id) {
      return NextResponse.json(
        { message: "Faltan datos requeridos: alumno_examen_id y estacion_id son obligatorios" },
        { status: 400 },
      )
    }

    const result = await evaluadorService.guardarResultadoEstacion({
      alumno_examen_id,
      estacion_id,
      calificacion: calificacion !== undefined ? calificacion : 0,
      observaciones,
    })

    if (!result) {
      return NextResponse.json({ message: "No se pudo guardar el resultado de la estación" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error en POST /api/evaluador/resultados-estaciones:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al guardar el resultado de la estación" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const alumnoExamenId = url.searchParams.get("alumnoExamenId")

    if (!alumnoExamenId) {
      return NextResponse.json({ message: "Se requiere el parámetro alumnoExamenId" }, { status: 400 })
    }

    const resultados = await evaluadorService.getResultadosEstaciones(Number.parseInt(alumnoExamenId))

    return NextResponse.json(resultados, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error en GET /api/evaluador/resultados-estaciones:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener los resultados de estaciones" },
      { status: 500 },
    )
  }
}
