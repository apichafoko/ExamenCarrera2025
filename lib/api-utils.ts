import { NextResponse } from "next/server"

// Función para crear respuestas exitosas con cabeceras anti-caché
export function successResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}

// Función para crear respuestas de error con cabeceras anti-caché
export function errorResponse(error: any, status = 500) {
  const message = error instanceof Error ? error.message : String(error)

  console.error(`API Error (${status}):`, message)

  return NextResponse.json(
    {
      error: true,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  )
}

export function handleApiError(error: any) {
  const message = error instanceof Error ? error.message : String(error)
  console.error("API Error:", message)
  return NextResponse.json({ error: message }, { status: 500, headers: { "Cache-Control": "no-store" } })
}

export function createSuccessResponse(data: any, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } })
}
