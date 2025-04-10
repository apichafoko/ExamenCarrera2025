import { executeQuery } from "./db"

export async function syncEvaluadoresWithUsers() {
  try {
    // Obtener todos los evaluadores de la base de datos
    const evaluadores = await executeQuery(`
      SELECT id, nombre, apellido, email, especialidad
      FROM evaluadores
      WHERE activo = true OR activo IS NULL
    `)

    // Verificar si existe la tabla users
    const tablaExiste = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as existe;
    `)

    const existeTablaUsers = tablaExiste[0]?.existe || false

    // Si no existe la tabla users, crearla
    if (!existeTablaUsers) {
      await executeQuery(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
    }

    // Para cada evaluador, verificar si existe un usuario con ese email
    for (const evaluador of evaluadores) {
      const userExists = await executeQuery(
        `
        SELECT 1 FROM users WHERE email = $1
      `,
        [evaluador.email],
      )

      // Si no existe, crear el usuario
      if (userExists.length === 0) {
        await executeQuery(
          `
          INSERT INTO users (email, password, name, role)
          VALUES ($1, $2, $3, $4)
        `,
          [
            evaluador.email,
            // Contraseña por defecto: 'password'
            "$2b$10$8OuFHKR6MjVXP.eUEpA9pOVEJr1tedJ3FZc3jQB6zPz.j6wUJBEQe",
            `${evaluador.nombre} ${evaluador.apellido}`,
            "evaluador",
          ],
        )
        console.log(`Usuario creado para evaluador: ${evaluador.nombre} ${evaluador.apellido}`)
      }
    }

    return { success: true, message: "Usuarios sincronizados correctamente" }
  } catch (error) {
    console.error("Error al sincronizar usuarios:", error)
    return { success: false, error: "Error al sincronizar usuarios" }
  }
}
