import { type NextRequest, NextResponse } from "next/server"
import { evaluadorService } from "@/lib/evaluador-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[SERVER]\nDatos recibidos en POST /api/evaluador/respuestas:", JSON.stringify(body))

    // Validar que se proporcionen los campos requeridos
    if (
      !body.alumno_examen_id ||
      !body.pregunta_id ||
      (body.respuesta_texto === undefined && body.respuesta === undefined)
    ) {
      console.error("Faltan datos requeridos:", body)
      return NextResponse.json(
        { message: "Faltan datos requeridos: alumno_examen_id, pregunta_id y respuesta son obligatorios" },
        { status: 400 },
      )
    }

    // Normalizar los datos para manejar tanto respuesta como respuesta_texto
    const respuestaData = {
      alumno_examen_id: Number(body.alumno_examen_id),
      pregunta_id: Number(body.pregunta_id),
      respuesta_texto: body.respuesta_texto !== undefined ? body.respuesta_texto : body.respuesta,
      puntaje: body.puntaje !== undefined ? Number(body.puntaje) : undefined,
      comentario: body.comentario || "",
    }

    console.log("Datos normalizados para guardar respuesta:", respuestaData)

    const respuesta = await evaluadorService.guardarRespuesta(respuestaData)

    if (!respuesta) {
      return NextResponse.json({ message: "No se pudo guardar la respuesta" }, { status: 500 })
    }

    return NextResponse.json(respuesta)
  } catch (error) {
    console.error("Error en POST /api/evaluador/respuestas:", error)
    return NextResponse.json(
      {
        message: "Error al guardar la respuesta",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const alumnoExamenId = searchParams.get("alumnoExamenId")

    if (!alumnoExamenId) {
      return NextResponse.json({ message: "Se requiere el parámetro alumnoExamenId" }, { status: 400 })
    }

    const respuestas = await evaluadorService.getRespuestasAlumnoExamen(Number(alumnoExamenId))

    return NextResponse.json(respuestas)
  } catch (error) {
    console.error("Error en GET /api/evaluador/respuestas:", error)
    return NextResponse.json({ message: "Error al obtener las respuestas" }, { status: 500 })
  }
}
