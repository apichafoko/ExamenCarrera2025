import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { hashPassword } from "@/lib/auth-service"

export async function PUT(request: Request) {
  try {
    const { id, nombre, email, newPassword } = await request.json()

    console.log("PUT /api/auth/update-profile - Datos recibidos:", { id, nombre, email, newPassword })

    if (!id || !nombre || !email) {
      console.warn("PUT /api/auth/update-profile - Datos incompletos")
      return NextResponse.json({ error: "ID, nombre y email son requeridos" }, { status: 400 })
    }

    // Verify that the user exists
    const checkUserQuery = "SELECT id FROM usuarios WHERE id = $1"
    const checkUserParams = [id]
    const checkUserResult = await executeQuery(checkUserQuery, checkUserParams)

    if (checkUserResult.length === 0) {
      console.warn("PUT /api/auth/update-profile - Usuario no encontrado")
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Construir la consulta base
    let query = "UPDATE usuarios SET nombre = $1, email = $2 WHERE id = $3"
    const params: any[] = [nombre, email, id]

    // Si se proporciona una nueva contraseña, hashearla y agregarla a la consulta
    if (newPassword) {
      const hashedPassword = await hashPassword(newPassword)
      query = "UPDATE usuarios SET nombre = $1, email = $2, password = $4 WHERE id = $3"
      params.push(hashedPassword) // Agregar la contraseña hasheada a los parámetros
    }

    console.log("PUT /api/auth/update-profile - Consulta SQL:", query)
    console.log("PUT /api/auth/update-profile - Parámetros:", params)

    const result = await executeQuery(query, params)

    // Verificar el número de filas afectadas
    if (result.rowCount === 0) {
      console.warn("PUT /api/auth/update-profile - No se actualizó ningún usuario")
      return NextResponse.json({ error: "Usuario no encontrado o no se actualizó" }, { status: 404 })
    }

    console.log("PUT /api/auth/update-profile - Perfil actualizado correctamente")
    return NextResponse.json({ success: true, message: "Perfil actualizado correctamente" }, { status: 200 })
  } catch (error) {
    console.error("PUT /api/auth/update-profile - Error:", error)
    return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 })
  }
}
