import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")
    const paramsStr = searchParams.get("params")

    if (!query) {
      return NextResponse.json({ error: "Se requiere el parámetro query" }, { status: 400 })
    }

    const params = paramsStr ? JSON.parse(paramsStr) : []

    console.log(`Ejecutando consulta directa: ${query} con parámetros:`, params)

    const result = await executeQuery(query, params)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error en la consulta directa:", error)
    return NextResponse.json(
      {
        error: "Error al ejecutar la consulta",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
