import { executeQuery } from "./db"
import * as bcrypt from "bcryptjs"

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "secret"

export async function validateJWT(token: string): Promise<any> {
  // Placeholder implementation - replace with actual JWT validation logic
  // This function should verify the token and return the user data if valid, or null if invalid
  // For now, it just returns a dummy user object
  if (!token) {
    return null
  }

  try {
    // Simulate JWT verification
    const decoded = {
      id: 1,
      nombre: "Admin",
      email: "admin@example.com",
      role: "admin",
    }

    return decoded
  } catch (error) {
    console.error("JWT verification error:", error)
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

/**
 * Verifica las credenciales de un usuario contra la base de datos
 */
export async function verificarCredenciales(email: string, password: string): Promise<any | null> {
  try {
    const query = `SELECT id, nombre, email, password, role FROM usuarios WHERE email = $1`
    const result = await executeQuery(query, [email])

    if (!result || result.length === 0) {
      return null
    }

    const usuario = result[0]

    // Verificar la contraseña
    let passwordValida = false

    try {
      // Intentar verificar con bcrypt
      if (usuario.password.startsWith("$2")) {
        // Verificar la contraseña almacenada
        passwordValida = await bcrypt.compare(password, usuario.password)
      }
      // Comparación directa (para contraseñas en texto plano)
      else {
        passwordValida = usuario.password === password
      }
    } catch (error) {
      console.error("Error al verificar contraseña:", error)
      return null
    }

    if (!passwordValida) {
      return null
    }

    return usuario
  } catch (error) {
    console.error("Error al verificar credenciales:", error)
    return null
  }
}
