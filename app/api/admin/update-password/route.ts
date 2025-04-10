import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { hashPassword } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    // Verificar si el usuario existe
    const users = await executeQuery("SELECT id FROM usuarios WHERE email = $1", [email])

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(password)

    // Actualizar la contraseña en la base de datos
    await executeQuery("UPDATE usuarios SET password = $1 WHERE email = $2", [hashedPassword, email])

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada correctamente",
      hashedPassword,
    })
  } catch (error) {
    console.error("Error al actualizar contraseña:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
