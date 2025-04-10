import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    // Verificar si DATABASE_URL está definido
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "La variable de entorno DATABASE_URL no está definida",
        },
        { status: 500 },
      )
    }

    // Realizar una consulta simple para verificar la conexión
    const result = await executeQuery("SELECT 1 as test", [])

    if (result && result.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Conexión a la base de datos establecida correctamente",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "La consulta de prueba no devolvió resultados",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error en la prueba de conexión a la base de datos:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al conectar con la base de datos",
      },
      { status: 500 },
    )
  }
}
