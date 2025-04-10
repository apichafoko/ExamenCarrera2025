import { type NextRequest, NextResponse } from "next/server"
import { examenesService } from "@/lib/db-service"

export async function GET(request: NextRequest) {
  try {
    // Obtener el parámetro limite de la URL, por defecto 5
    const url = new URL(request.url)
    const limite = Number.parseInt(url.searchParams.get("limite") || "5")

    // Obtener los próximos exámenes
    const examenes = await examenesService.getProximos(limite)

    // Devolver los exámenes con encabezados para evitar caché
    return NextResponse.json(examenes, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error en GET /api/examenes/proximos:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener los próximos exámenes" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}
