import { type NextRequest, NextResponse } from "next/server"
import { testDatabaseConnection, testUserQuery } from "@/lib/test-auth"

export async function GET(request: NextRequest) {
  try {
    const connectionResult = await testDatabaseConnection()

    let userResult = null
    if (connectionResult) {
      userResult = await testUserQuery("urifrai@gmail.com")
    }

    return NextResponse.json({
      connectionSuccess: connectionResult,
      userQueryResult: userResult,
    })
  } catch (error) {
    console.error("Error en la API de prueba de autenticación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
