import { type NextRequest, NextResponse } from "next/server"
import * as bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const password = "12345"

    // Generar un hash
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    // Verificar el hash
    const isValid = await bcrypt.compare(password, hash)

    return NextResponse.json({
      password,
      hash,
      isValid,
      message: isValid ? "Hash verificado correctamente" : "Error en la verificación del hash",
    })
  } catch (error) {
    console.error("Error en test-bcrypt:", error)
    return NextResponse.json({ error: "Error al probar bcrypt" }, { status: 500 })
  }
}
