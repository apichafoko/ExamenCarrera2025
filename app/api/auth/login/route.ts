import { type NextRequest, NextResponse } from "next/server"
import { verificarCredenciales } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Correo electrónico y contraseña son requeridos" }, { status: 400 })
    }

    const usuario = await verificarCredenciales(email, password)

    if (!usuario) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Devolver los datos del usuario (sin la contraseña)
    return NextResponse.json(usuario)
  } catch (error) {
    console.error("Error en la API de login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
