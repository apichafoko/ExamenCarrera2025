
/**
 * Este archivo contiene funciones relacionadas con la autenticación de usuarios,
 * incluyendo la validación de JWT, el hash de contraseñas, la verificación de credenciales
 * y la generación de tokens JWT. Estas funciones son esenciales para manejar la seguridad
 * y autenticación en la aplicación.
 *
 * ## Funciones principales:
 *
 * ### `validateJWT(token: string): Promise<any>`
 * Valida un token JWT utilizando la clave secreta definida en el entorno o una clave por defecto.
 * 
 * - **Parámetros**:
 *   - `token`: El token JWT que se desea validar.
 * - **Retorno**: La carga útil (`payload`) del token si es válido, o `null` si no lo es.
 * - **Errores**: Registra errores en caso de que la validación falle.
 *
 * ---
 *
 * ### `hashPassword(password: string): Promise<string>`
 * Genera un hash seguro para una contraseña utilizando bcrypt.
 * 
 * - **Parámetros**:
 *   - `password`: La contraseña en texto plano que se desea hashear.
 * - **Retorno**: El hash generado de la contraseña.
 * - **Errores**: Lanza un error si ocurre un problema durante el proceso de hash.
 * 
 * ---
 *
 * ### `verificarCredenciales(email: string, password: string): Promise<any | null>`
 * Verifica las credenciales de un usuario contra la base de datos.
 * 
 * - **Parámetros**:
 *   - `email`: El correo electrónico del usuario.
 *   - `password`: La contraseña en texto plano del usuario.
 * - **Retorno**: Un objeto de usuario si las credenciales son válidas, o `null` si no lo son.
 * - **Detalles**:
 *   - Intenta verificar la contraseña utilizando bcrypt si está hasheada.
 *   - Si la contraseña está en texto plano, realiza una comparación directa.
 * - **Errores**: Registra errores si ocurre un problema durante la verificación.
 * 
 * ---
 *
 * ### `signJWT(payload: any, options?: { exp: string }): Promise<string>`
 * Genera un token JWT firmado con una carga útil específica.
 * 
 * - **Parámetros**:
 *   - `payload`: La información que se desea incluir en el token.
 *   - `options`: Opcional. Un objeto que puede incluir el tiempo de expiración (`exp`).
 * - **Retorno**: El token JWT generado.
 * - **Errores**: Lanza un error si ocurre un problema durante la generación del token.
 *
 * ---
 *
 * ## Notas adicionales:
 * - Se recomienda usar un número de rondas de salt más alto en producción para mayor seguridad.
 * - La clave secreta para los JWT debe ser configurada en las variables de entorno para evitar
 *   exponerla en el código fuente.
 * - Este archivo depende de un módulo de base de datos (`executeQuery`) para interactuar con la base de datos.
 */
import { executeQuery } from "./db"
import * as bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "secret"

export async function validateJWT(token: string): Promise<any> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET_KEY)
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    })

    return payload
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

export async function signJWT(payload: any, options?: { exp: string }) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET_KEY)
    const alg = "HS256"

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime(options?.exp || "24h")
      .sign(secret)

    return jwt
  } catch (error) {
    console.error("Error signing JWT:", error)
    throw error
  }
}
