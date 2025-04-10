import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Agregar encabezados para evitar el almacenamiento en caché
    const headers = {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400, headers })
    }

    // Consulta para obtener las opciones de la pregunta
    const query = `
      SELECT *
      FROM opciones
      WHERE pregunta_id = $1
      ORDER BY id
    `
    const opciones = await executeQuery(query, [id])

    // Si no hay opciones, intentar buscar en la tabla de preguntas por si las opciones están almacenadas como JSON
    if (!opciones || opciones.length === 0) {
      const preguntaQuery = `
        SELECT opciones
        FROM preguntas
        WHERE id = $1
      `
      const preguntaResult = await executeQuery(preguntaQuery, [id])

      if (preguntaResult.length > 0 && preguntaResult[0].opciones) {
        // Si las opciones están almacenadas como JSON en la columna opciones
        try {
          let opcionesFromJson = preguntaResult[0].opciones

          // Si es un string, intentar parsearlo como JSON
          if (typeof opcionesFromJson === "string") {
            opcionesFromJson = JSON.parse(opcionesFromJson)
          }

          // Si es un array, devolverlo
          if (Array.isArray(opcionesFromJson)) {
            return NextResponse.json(opcionesFromJson, { headers })
          }
        } catch (error) {
          console.error(`Error al parsear opciones JSON para pregunta ${id}:`, error)
        }
      }
    }

    return NextResponse.json(opciones, { headers })
  } catch (error) {
    console.error(`Error en GET /api/preguntas/${params.id}/opciones:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener las opciones" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
