import type { NextRequest } from "next/server"
import { evaluadoresService } from "@/lib/db-service"
import { successResponse, errorResponse } from "@/lib/api-utils"
import { executeQuery } from "@/lib/db"
import { hashPassword } from "@/lib/auth-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conExamenes = searchParams.get("conExamenes") === "true" // Verifica si el parámetro es "true"

    console.log(`Ejecutando GET /api/evaluadores${conExamenes ? " con exámenes" : ""}`)

    // Elegir el método del servicio según el parámetro
    const evaluadores = conExamenes ? await evaluadoresService.getAllConExamenes() : await evaluadoresService.getAll()

    console.log(`Evaluadores obtenidos: ${evaluadores.length}`)
    return successResponse(evaluadores)
  } catch (error) {
    console.error("Error en GET /api/evaluadores:", error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log("POST /api/evaluadores - Datos recibidos:", JSON.stringify(data, null, 2))

    const { nombre, apellido, email, especialidad, categoria, activo } = data

    // Validar datos requeridos
    if (!nombre || !apellido || !email) {
      return errorResponse("Nombre, apellido y email son obligatorios", 400)
    }

    // Iniciar transacción
    await executeQuery("BEGIN")

    // 1. Verificar si existe un usuario con el email proporcionado
    const usuarioQuery = `SELECT id FROM usuarios WHERE email = $1`
    const usuarioResult = await executeQuery<any>(usuarioQuery, [email])
    const usuarioExistente = usuarioResult.length > 0 ? usuarioResult[0] : null

    let usuarioId: number
    let usuarioCreado = false

    // 2. Si no existe un usuario con ese email, crearlo
    if (!usuarioExistente) {
      const defaultPassword = "12345" // Podrías generar una contraseña aleatoria o enviarla por email
      const hashedPassword = await hashPassword(defaultPassword)

      const usuarioInsertQuery = `
        INSERT INTO usuarios (nombre, email, password, role, activo, fecha_creacion, ultima_actualizacion, primer_login)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `

      const fechaActual = new Date().toISOString()
      const usuarioParams = [
        `${nombre} ${apellido}`,
        email,
        hashedPassword,
        "evaluador",
        activo,
        fechaActual,
        fechaActual,
        true,
      ]

      const usuarioInsertResult = await executeQuery<any>(usuarioInsertQuery, usuarioParams)

      if (usuarioInsertResult.length === 0) {
        await executeQuery("ROLLBACK")
        return errorResponse("No se pudo crear el usuario asociado al evaluador", 500)
      }

      usuarioId = usuarioInsertResult[0].id
      usuarioCreado = true
      console.log(`Usuario creado para el evaluador ${email} con ID ${usuarioId}`)
    } else {
      usuarioId = usuarioExistente.id
      console.log(`Usuario existente encontrado para el email ${email} con ID ${usuarioId}`)
    }

    // 3. Crear el evaluador con el usuario_id asociado
    const evaluadorQuery = `
      INSERT INTO evaluadores (nombre, apellido, email, especialidad, activo, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `
    const evaluadorParams = [nombre, apellido, email, especialidad || null, activo, usuarioId]
    const evaluadorResult = await executeQuery<any>(evaluadorQuery, evaluadorParams)

    if (evaluadorResult.length === 0) {
      await executeQuery("ROLLBACK")
      return errorResponse("No se pudo crear el evaluador", 500)
    }

    // 4. Confirmar transacción
    await executeQuery("COMMIT")

    const nuevoEvaluador = evaluadorResult[0]
    console.log("Evaluador creado exitosamente:", JSON.stringify(nuevoEvaluador, null, 2))

    return successResponse(nuevoEvaluador, 201)
  } catch (error) {
    console.error("Error en POST /api/evaluadores:", error)
    await executeQuery("ROLLBACK")
    return errorResponse(`Error: ${error.message || "Error desconocido"}`, 500)
  }
}
