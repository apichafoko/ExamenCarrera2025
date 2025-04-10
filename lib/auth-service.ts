import { executeQuery } from "./db"
import * as bcrypt from "bcryptjs"

export type Usuario = {
  id: number
  nombre: string
  email: string
  role: string
  evaluador_id?: number | null
}

/**
 * Verifica las credenciales de un usuario contra la base de datos
 */
export async function verificarCredenciales(email: string, password: string): Promise<Usuario | null> {
  try {
    console.log(`Intento de login para: ${email}`)

    // Consulta mejorada para relacionar usuarios y evaluadores por email
    const query = `
      SELECT u.id, u.nombre, u.email, u.password, u.role, e.id as evaluador_id
      FROM usuarios u
      LEFT JOIN evaluadores e ON u.email = e.email
      WHERE u.email = $1
    `

    const result = await executeQuery(query, [email])

    // Verificar que result sea un array con al menos un elemento
    if (!result || !Array.isArray(result) || result.length === 0) {
      console.log(`No se encontraron datos para: ${email}`)
      return null
    }

    const usuario = result[0]

    // Verificar que usuario tenga la propiedad password
    if (!usuario || typeof usuario.password === "undefined") {
      console.log("El usuario no tiene contraseña definida")
      return null
    }

    // Información para depuración
    console.log("Contraseña ingresada:", password)
    console.log("Contraseña almacenada:", usuario.password)

    // Verificar la contraseña
    let passwordValida = false

    try {
      // Intentar verificar con bcrypt
      if (usuario.password.startsWith("$2")) {
        // Generar un nuevo hash para la misma contraseña (para depuración)
        const nuevoHash = await bcrypt.hash(password, 10)
        console.log("Nuevo hash generado para la misma contraseña:", nuevoHash)

        // Verificar si el nuevo hash es válido
        const nuevoHashValido = await bcrypt.compare(password, nuevoHash)
        console.log("¿El nuevo hash es válido?", nuevoHashValido)

        // Verificar la contraseña almacenada
        passwordValida = await bcrypt.compare(password, usuario.password)
        console.log(`Resultado de bcrypt.compare con hash almacenado:`, passwordValida)

        // Si la verificación falla, intentar con texto plano como fallback
        if (!passwordValida) {
          passwordValida = usuario.password === password
          console.log(`Fallback a comparación directa:`, passwordValida)
        }
      }
      // Comparación directa (para contraseñas en texto plano)
      else {
        passwordValida = usuario.password === password
        console.log(`Comparación directa:`, passwordValida)

        // Si la contraseña es correcta pero está en texto plano, actualizarla a hash
        if (passwordValida) {
          console.log("Actualizando contraseña a formato hash...")
          const hashedPassword = await hashPassword(password)
          await executeQuery("UPDATE usuarios SET password = $1 WHERE id = $2", [hashedPassword, usuario.id])
          console.log("Contraseña actualizada a hash:", hashedPassword)
        }
      }
    } catch (error) {
      console.error("Error al verificar contraseña:", error)
      return null
    }

    if (!passwordValida) {
      console.log("Contraseña incorrecta")
      return null
    }

    console.log("Login exitoso")

    // Devolvemos el usuario sin la contraseña
    const { password: _, ...usuarioSinPassword } = usuario
    return usuarioSinPassword as Usuario
  } catch (error) {
    console.error("Error al verificar credenciales:", error)
    return null
  }
}

/**
 * Obtiene un usuario por su ID
 */
export async function obtenerUsuarioPorId(id: number): Promise<Usuario | null> {
  try {
    const query = `
      SELECT u.id, u.nombre, u.email, u.role, e.id as evaluador_id
      FROM usuarios u
      LEFT JOIN evaluadores e ON u.email = e.email
      WHERE u.id = $1
    `

    const result = await executeQuery(query, [id])

    // Verificar que result sea un array con al menos un elemento
    if (!result || !Array.isArray(result) || result.length === 0) {
      return null
    }

    return result[0] as Usuario
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error)
    return null
  }
}

/**
 * Hashea una contraseña usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Usar un número de rondas más bajo para desarrollo (10) y más alto para producción (12+)
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  } catch (error) {
    console.error("Error al hashear contraseña:", error)
    throw error
  }
}
