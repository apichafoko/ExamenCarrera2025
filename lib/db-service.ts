
/**
 * Este archivo contiene los servicios relacionados con la base de datos para manejar
 * las operaciones CRUD de las entidades principales de la aplicación, como alumnos,
 * hospitales, evaluadores, exámenes, grupos y la relación entre alumnos y exámenes.
 * 
 * Cada servicio está diseñado para interactuar con la base de datos utilizando consultas SQL
 * y devolver los datos en un formato estructurado. A continuación, se describen los servicios
 * principales y sus métodos:
 * 
 * ## Servicios
 * 
 * ### `alumnosService`
 * - Maneja las operaciones relacionadas con los alumnos.
 * - Métodos:
 *   - `getAll`: Obtiene todos los alumnos con información básica y su hospital asociado.
 *   - `getById`: Obtiene un alumno por su ID, incluyendo los exámenes asignados.
 *   - `create`: Crea un nuevo alumno en la base de datos.
 *   - `update`: Actualiza la información de un alumno existente.
 *   - `delete`: Elimina un alumno por su ID.
 * 
 * ### `hospitalesService`
 * - Maneja las operaciones relacionadas con los hospitales.
 * - Métodos:
 *   - `getAll`: Obtiene todos los hospitales con el conteo de alumnos asociados.
 *   - `getById`: Obtiene un hospital por su ID.
 *   - `create`: Crea un nuevo hospital en la base de datos.
 *   - `update`: Actualiza la información de un hospital existente.
 *   - `delete`: Elimina un hospital por su ID.
 * 
 * ### `evaluadoresService`
 * - Maneja las operaciones relacionadas con los evaluadores.
 * - Métodos:
 *   - `getAll`: Obtiene todos los evaluadores.
 *   - `getByUserId`: Obtiene un evaluador por el ID de usuario asociado.
 *   - `getAllConExamenes`: Obtiene evaluadores que tienen exámenes asignados.
 *   - `getById`: Obtiene un evaluador por su ID.
 *   - `create`: Crea un nuevo evaluador y, opcionalmente, un usuario asociado.
 *   - `update`: Actualiza la información de un evaluador existente.
 *   - `delete`: Elimina un evaluador por su ID.
 *   - `tieneExamenesAsignados`: Verifica si un evaluador tiene exámenes asignados.
 *   - `tieneExamenesTomados`: Verifica si un evaluador ha tomado exámenes.
 * 
 * ### `examenesService`
 * - Maneja las operaciones relacionadas con los exámenes.
 * - Métodos:
 *   - `getAll`: Obtiene todos los exámenes con información adicional como evaluadores y alumnos asignados.
 *   - `getById`: Obtiene un examen por su ID, incluyendo estaciones, preguntas y evaluadores asignados.
 *   - `getByAsignacionId`: Obtiene un examen basado en una asignación específica.
 *   - `create`: Crea un nuevo examen en la base de datos.
 *   - `update`: Actualiza la información de un examen existente, incluyendo estaciones y preguntas.
 *   - `delete`: Elimina un examen por su ID, verificando que no tenga alumnos asignados.
 *   - `getProximos`: Obtiene los próximos exámenes según una fecha límite.
 * 
 * ### `gruposService`
 * - Maneja las operaciones relacionadas con los grupos.
 * - Métodos:
 *   - `getAll`: Obtiene todos los grupos con el conteo de alumnos asociados.
 *   - `getById`: Obtiene un grupo por su ID.
 *   - `update`: Actualiza la información de un grupo existente.
 *   - `delete`: Elimina un grupo por su ID.
 *   - `asignarAlumno`: Asigna un alumno a un grupo.
 *   - `eliminarAlumno`: Elimina un alumno de un grupo.
 *   - `getAlumnos`: Obtiene los alumnos asociados a un grupo.
 * 
 * ### `alumnosExamenesService`
 * - Maneja las operaciones relacionadas con la tabla de relación entre alumnos y exámenes.
 * - Métodos:
 *   - `tieneExamenAsignado`: Verifica si un alumno tiene un examen asignado.
 *   - `asignarExamen`: Asigna un examen a un alumno con un evaluador.
 *   - `getExamenesDeAlumno`: Obtiene los exámenes asignados a un alumno.
 *   - `getAlumnosDeExamen`: Obtiene los alumnos asignados a un examen.
 * 
 * ## Notas adicionales
 * - Este archivo utiliza `executeQuery` para ejecutar las consultas SQL. Se espera que esta función
 *   maneje la conexión a la base de datos y devuelva los resultados en un formato adecuado.
 * - Se incluyen validaciones básicas, como la verificación de emails y la existencia de relaciones
 *   antes de eliminar registros.
 * - Las transacciones se utilizan en operaciones críticas para garantizar la consistencia de los datos.
 * 
 * Este archivo es esencial para la lógica de negocio de la aplicación y debe mantenerse actualizado
 * con los cambios en la estructura de la base de datos.
 */
import { executeQuery } from "./db"
import { hashPassword } from "@/lib/auth-service"

// Tipos para nuestros datos
export type Alumno = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  hospital_id: number | null;
  hospital_nombre: string | null;
  fecha_nacimiento: string | null;
  promocion: number | null;
  sede: string | null;
  documento: number | null;
  examenes?: any[]
}

export type Hospital = {
  id: number
  nombre: string
  direccion: string
  ciudad: string
  tipo: string
  telefono?: string
  email?: string
  alumnos?: Array<{
    id: number
    nombre: string
    email: string
  }>
}

export type Evaluador = {
  id: number
  nombre: string
  apellido: string
  email: string
  especialidad: string
  categoria?: string
  activo: boolean
}

export type Examen = {
  id: number
  titulo: string
  descripcion: string
  fecha_aplicacion: string
  estado: string
  estaciones?: any[]
  evaluadores?: any[]
}

export type Grupo = {
  id: number
  nombre: string
  descripcion: string
  fecha_creacion: string
  cant_alumnos: number
}

// Servicio para alumnos
export const alumnosService = {
  getAll: async (): Promise<Alumno[]> => {
    const query = `
      SELECT 
        a.id,
        a.nombre,
        a.apellido,
        a.email,
        a.telefono,
        a.hospital_id,
        a.fecha_nacimiento,
        a.promocion,
        a.sede,
        a.documento,
        h.nombre as hospital_nombre
      FROM alumnos a
      LEFT JOIN hospitales h ON a.hospital_id = h.id
      ORDER BY a.apellido, a.nombre
    `
    return executeQuery(query)
  },
  getById: async (id: number): Promise<Alumno | null> => {
    const query = `
      SELECT 
        a.id,
        a.nombre,
        a.apellido,
        a.email,
        a.telefono,
        a.hospital_id,
        a.fecha_nacimiento,
        a.promocion,
        a.sede,
        a.documento,
        h.nombre as hospital_nombre
      FROM alumnos a
      LEFT JOIN hospitales h ON a.hospital_id = h.id
      WHERE a.id = $1
    `
    const result = await executeQuery<Alumno>(query, [id])

    if (result.length === 0) return null

    // Obtener los exámenes asignados
    const queryExamenes = `
      SELECT e.*, ae.estado
      FROM examenes e
      JOIN alumnos_examenes ae ON e.id = ae.examen_id
      WHERE ae.alumno_id = $1
    `
    const examenes = await executeQuery<any>(queryExamenes, [id])

    result[0].examenes = examenes

    return result[0]
  },
  create: async (alumno: Omit<Alumno, "id" | "hospital_nombre" | "examenes">): Promise<Alumno | null> => {
    const { nombre, apellido, email, telefono, hospital_id, fecha_nacimiento, promocion, sede, documento } = alumno
    const query = `
      INSERT INTO alumnos (
        nombre, 
        apellido, 
        email, 
        telefono, 
        hospital_id, 
        fecha_nacimiento, 
        promocion, 
        sede, 
        documento
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `
    const result = await executeQuery<Alumno>(query, [
      nombre,
      apellido,
      email,
      telefono,
      hospital_id,
      fecha_nacimiento,
      promocion,
      sede,
      documento,
    ])
  
    return result.length > 0 ? result[0] : null
  },
  update: async (id: number, alumno: Partial<Omit<Alumno, "id" | "hospital_nombre" | "examenes">>): Promise<Alumno | null> => {
    const { nombre, apellido, email, telefono, hospital_id, fecha_nacimiento, promocion, sede, documento } = alumno
    const query = `
      UPDATE alumnos
      SET 
        nombre = $1, 
        apellido = $2, 
        email = $3, 
        telefono = $4, 
        hospital_id = $5, 
        fecha_nacimiento = $6, 
        promocion = $7, 
        sede = $8, 
        documento = $9
      WHERE id = $10
      RETURNING *
    `
    const result = await executeQuery<Alumno>(query, [
      nombre,
      apellido,
      email,
      telefono,
      hospital_id,
      fecha_nacimiento,
      promocion,
      sede,
      documento,
      id,
    ])
    return result.length > 0 ? result[0] : null
  },
  delete: async (id: number): Promise<boolean> => {
    const query = `DELETE FROM alumnos WHERE id = $1`
    await executeQuery(query, [id])
    return true
  },
}

// Servicio para hospitales
export const hospitalesService = {
  getAll: async (): Promise<Hospital[]> => {
    const query = `SELECT 
    h.*, 
    COUNT(a.id) AS total_alumnos
  FROM hospitales h
  LEFT JOIN alumnos a ON a.hospital_id = h.id
  GROUP BY h.id
  ORDER BY h.nombre`
    return executeQuery(query)
  },
  getById: async (id: number): Promise<Hospital | null> => {
    const query = `SELECT * FROM hospitales WHERE id = $1`
    const result = await executeQuery<Hospital>(query, [id])
    return result.length > 0 ? result[0] : null
  },
  create: async (hospital: Omit<Hospital, "id">): Promise<Hospital | null> => {
    const { nombre, direccion, ciudad, tipo } = hospital
    const query = `
      INSERT INTO hospitales (nombre, direccion, ciudad, tipo)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const result = await executeQuery<Hospital>(query, [nombre, direccion, ciudad, tipo])
    return result.length > 0 ? result[0] : null
  },
  update: async (id: number, hospital: Partial<Hospital>): Promise<Hospital | null> => {
    const { nombre, direccion, ciudad, tipo } = hospital
    const query = `
      UPDATE hospitales
      SET nombre = $1, direccion = $2, ciudad = $3, tipo = $4
      WHERE id = $5
      RETURNING *
    `
    const result = await executeQuery<Hospital>(query, [nombre, direccion, ciudad, tipo, id])
    return result.length > 0 ? result[0] : null
  },
  delete: async (id: number): Promise<boolean> => {
    const query = `DELETE FROM hospitales WHERE id = $1`
    await executeQuery(query, [id])
    return true
  },
}

// Función auxiliar para validar email básico
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Servicio para evaluadores
export const evaluadoresService = {
  getAll: async (): Promise<Evaluador[]> => {
    const query = `SELECT * FROM evaluadores ORDER BY apellido, nombre`
    return executeQuery(query)
  },
  getByUserId: async (userId: number): Promise<Evaluador | null> => {
    const query = `SELECT * FROM evaluadores WHERE usuario_id = $1`
    const result = await executeQuery<Evaluador>(query, [userId])
    return result.length > 0 ? result[0] : null
  },
  getAllConExamenes: async (): Promise<Evaluador[]> => {
    const query = `SELECT DISTINCT e.*
FROM evaluadores e
INNER JOIN alumnos_examenes ae ON e.id = ae.evaluador_id
ORDER BY e.apellido, e.nombre;`
    return executeQuery(query)
  },
  getById: async (id: number): Promise<Evaluador | null> => {
    const query = `SELECT * FROM evaluadores WHERE id = $1`
    const result = await executeQuery<Evaluador>(query, [id])
    return result.length > 0 ? result[0] : null
  },
  create: async (
    evaluador: Omit<Evaluador, "id">,
  ): Promise<{ evaluador: Evaluador | null; usuarioCreado: boolean; mensaje?: string }> => {
    const { nombre, apellido, email, especialidad, activo } = evaluador

    // Validación del email
    if (!isValidEmail(email)) {
      console.warn(`Email inválido: ${email}`)
      return { evaluador: null, usuarioCreado: false, mensaje: "El email proporcionado no es válido" }
    }

    try {
      // 1. Iniciar transacción
      await executeQuery("BEGIN")
      console.log("Transacción iniciada")

      // 2. Verificar si ya existe un usuario con este email
      const checkUserQuery = "SELECT id FROM usuarios WHERE email = $1"
      const checkUserResult = await executeQuery<any>(checkUserQuery, [email])
      const usuarioExistente = checkUserResult.length > 0
      console.log(`Usuario existente con email ${email}: ${usuarioExistente}`)

      // 3. Crear el evaluador
      const evaluadorQuery = `
        INSERT INTO evaluadores (nombre, apellido, email, especialidad, activo)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `
      const evaluadorResult = await executeQuery<Evaluador>(evaluadorQuery, [
        nombre,
        apellido,
        email,
        especialidad,
        activo,
      ])

      if (evaluadorResult.length === 0) {
        await executeQuery("ROLLBACK")
        throw new Error("No se pudo crear el evaluador")
      }

      const nuevoEvaluador = evaluadorResult[0]
      console.log(`Evaluador creado con ID ${nuevoEvaluador.id}`)

      // 4. Si no existe un usuario con ese email, crearlo
      let usuarioCreado = false
      if (!usuarioExistente) {
        const defaultPassword = "12345"
        const hashedPassword = await hashPassword(defaultPassword)

        const usuarioQuery = `
          INSERT INTO usuarios (nombre, email, password, role, activo, fecha_creacion, ultima_actualizacion, primer_login)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `

        const fechaActual = new Date().toISOString()
        const usuarioParams = [
          `${nombre} ${apellido}`, // Combinamos nombre y apellido
          email,
          hashedPassword,
          "evaluador",
          activo,
          fechaActual,
          fechaActual,
          true,
        ]

        const usuarioResult = await executeQuery<any>(usuarioQuery, usuarioParams)

        if (usuarioResult.length === 0) {
          await executeQuery("ROLLBACK")
          throw new Error("No se pudo crear el usuario asociado al evaluador")
        }

        usuarioCreado = true
        console.log(`Usuario creado para el evaluador ${email} con ID ${usuarioResult[0].id}`)
      
        // 5. Actualizar el evaluador con el ID del usuario
        const updateEvaluadorQuery = `
        UPDATE evaluadores
        SET usuario_id = $1
        WHERE id = $2
        `;
        await executeQuery(updateEvaluadorQuery, [usuarioResult[0].id, nuevoEvaluador.id]);
        console.log(`Evaluador con ID ${nuevoEvaluador.id} actualizado con usuario_id ${usuarioResult[0].id}`);
      }

      // 5. Confirmar transacción
      await executeQuery("COMMIT")
      console.log("Transacción completada con éxito")

      // Devolver resultado con notificación
      return {
        evaluador: nuevoEvaluador,
        usuarioCreado,
        mensaje: usuarioCreado
          ? "Evaluador y usuario creados. La contraseña por defecto es '12345'."
          : "Evaluador creado. Ya existía un usuario con este email.",
      }
    } catch (error) {
      // Revertir transacción en caso de error
      try {
        await executeQuery("ROLLBACK")
        console.log("Transacción revertida debido a un error")
      } catch (rollbackError) {
        console.error("Error al ejecutar ROLLBACK:", rollbackError)
      }

      console.error("Error creando evaluador y/o usuario:", error)
      return {
        evaluador: null,
        usuarioCreado: false,
        mensaje: `Error al crear el evaluador y/o usuario: ${(error as Error).message}`,
      }
    }
  },
  update: async (id: number, evaluador: Partial<Evaluador>): Promise<Evaluador | null> => {
    const { nombre, apellido, email, especialidad, categoria, activo } = evaluador
    const query = `
      UPDATE evaluadores
      SET nombre = $1, apellido = $2, email = $3, especialidad = $4, categoria = $5, activo = $6
      WHERE id = $7
      RETURNING *
    `
    const result = await executeQuery<Evaluador>(query, [nombre, apellido, email, especialidad, categoria, activo, id])
    return result.length > 0 ? result[0] : null
  },
  delete: async (id: number): Promise<boolean> => {
    const query = `DELETE FROM evaluadores WHERE id = $1 RETURNING id`
    const result = await executeQuery(query, [id])
    return result.length > 0 // True si se eliminó un registro, false si no se encontró
  },
  tieneExamenesAsignados: async (evaluadorId: number): Promise<boolean> => {
    try {
      const query = `
        SELECT EXISTS (
          SELECT 1
          FROM examenes_evaluadores
          WHERE evaluador_id = $1
        )
      `
      const result = await executeQuery(query, [evaluadorId])
      return result[0]?.exists || false
    } catch (error) {
      console.error("Error al verificar exámenes asignados:", error)
      return false
    }
  },
  tieneExamenesTomados: async (evaluadorId: number): Promise<boolean> => {
    try {
      const query = `
        SELECT EXISTS (
          SELECT 1
          FROM alumnos_examenes
          WHERE evaluador_id = $1
        )
      `
      const result = await executeQuery(query, [evaluadorId])
      return result[0]?.exists || false
    } catch (error) {
      console.error("Error al verificar exámenes asignados:", error)
      return false
    }
  },
}

// Servicio para examenes
export const examenesService = {
  getAll: async (): Promise<Examen[]> => {
    const query = `SELECT 
  e.*, 
  COALESCE(alumnos.cantidad_alumnos, 0) AS cantidad_alumnos,
  COALESCE(evaluadores.evaluadores, '[]'::json) AS evaluadores
FROM examenes e
LEFT JOIN (
  SELECT examen_id, COUNT(*) AS cantidad_alumnos
  FROM alumnos_examenes
  GROUP BY examen_id
) AS alumnos ON alumnos.examen_id = e.id
LEFT JOIN (
  SELECT 
    ee.examen_id,
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ev.id,
        'nombre', ev.nombre,
        'apellido', ev.apellido
      )
    ) AS evaluadores
  FROM examenes_evaluadores ee
  JOIN evaluadores ev ON ev.id = ee.evaluador_id
  GROUP BY ee.examen_id
) AS evaluadores ON evaluadores.examen_id = e.id
ORDER BY e.fecha_aplicacion DESC
`
    return executeQuery(query)
  },
  getById: async (id: number): Promise<Examen | null> => {
    try {
      // Obtener información básica del examen
      const examenQuery = `SELECT * FROM examenes WHERE id = $1`
      const examenResult = await executeQuery<Examen>(examenQuery, [id])

      if (examenResult.length === 0) {
        return null
      }

      const examen = examenResult[0]

      // Obtener estaciones del examen
      const estacionesQuery = `
        SELECT * 
        FROM estaciones 
        WHERE examen_id = $1
        ORDER BY orden
      `
      const estaciones = await executeQuery(estacionesQuery, [id])

      // Para cada estación, obtener sus preguntas
      for (const estacion of estaciones) {
        const preguntasQuery = `
          SELECT * 
          FROM preguntas 
          WHERE estacion_id = $1
          ORDER BY orden
        `
        const preguntas = await executeQuery(preguntasQuery, [estacion.id])

        // Para cada pregunta, obtener sus opciones si es de tipo selección o múltiple
        for (const pregunta of preguntas) {
          if (
            pregunta.tipo === "opcion_unica" ||
            pregunta.tipo === "opcion_multiple" ||
            pregunta.tipo === "seleccion" ||
            pregunta.tipo === "multiple" ||
            pregunta.tipo === "listado"
          ) {
            const opcionesQuery = `
              SELECT * 
              FROM opciones 
              WHERE pregunta_id = $1
              ORDER BY orden
            `
            const opciones = await executeQuery(opcionesQuery, [pregunta.id])
            pregunta.opciones = opciones
          }
        }

        estacion.preguntas = preguntas
      }

      // Obtener evaluadores asignados al examen
      const evaluadoresQuery = `
        SELECT e.* 
        FROM evaluadores e
        JOIN examenes_evaluadores ee ON e.id = ee.evaluador_id
        WHERE ee.examen_id = $1
      `
      const evaluadores = await executeQuery(evaluadoresQuery, [id])

      // Obtener alumnos asignados al examen desde alumnos_examenes
      const alumnosQuery = `
      SELECT 
        ae.id AS asignacion_id,
        ae.alumno_id,
        a.nombre AS alumno_nombre,
        a.apellido AS alumno_apellido,
        a.email AS alumno_email,
        ae.evaluador_id,
        ev.nombre AS evaluador_nombre,
        ev.apellido AS evaluador_apellido,
        ae.fecha_inicio,
        ae.fecha_fin,
        ae.estado,
        ae.calificacion,
        ae.observaciones
      FROM alumnos_examenes ae
      JOIN alumnos a ON ae.alumno_id = a.id
      LEFT JOIN evaluadores ev ON ae.evaluador_id = ev.id
      WHERE ae.examen_id = $1
    `
      const alumnos = await executeQuery(alumnosQuery, [id])

      // Agregar estaciones y evaluadores al examen
      examen.estaciones = estaciones
      examen.evaluadores = evaluadores
      examen.alumnos = alumnos

      return examen
    } catch (error) {
      console.error(`Error al obtener examen con ID ${id}:`, error)
      return null
    }
  },
  getByAsignacionId: async (id: number): Promise<Examen | null> => {
    try {
      // Obtener información básica del examen
      const examenQuery = `SELECT e.*
  FROM alumnos_examenes ae
  JOIN examenes e ON e.id = ae.examen_id
  WHERE ae.id = $1`
      const examenResult = await executeQuery<Examen>(examenQuery, [id])

      if (examenResult.length === 0) {
        return null
      }

      const examen = examenResult[0]

      // Obtener estaciones del examen
      const estacionesQuery = `
        SELECT * 
        FROM estaciones 
        WHERE examen_id = $1
        ORDER BY orden
      `
      const estaciones = await executeQuery(estacionesQuery, [examen.id])

      // Para cada estación, obtener sus preguntas
      for (const estacion of estaciones) {
        const preguntasQuery = `
          SELECT * 
          FROM preguntas 
          WHERE estacion_id = $1
          ORDER BY orden
        `
        const preguntas = await executeQuery(preguntasQuery, [estacion.id])

        // Para cada pregunta, obtener sus opciones si es de tipo selección o múltiple
        for (const pregunta of preguntas) {
          if (
            pregunta.tipo === "opcion_unica" ||
            pregunta.tipo === "opcion_multiple" ||
            pregunta.tipo === "seleccion" ||
            pregunta.tipo === "multiple" ||
            pregunta.tipo === "listado"
          ) {
            const opcionesQuery = `
              SELECT * 
              FROM opciones 
              WHERE pregunta_id = $1
              ORDER BY orden
            `
            const opciones = await executeQuery(opcionesQuery, [pregunta.id])
            pregunta.opciones = opciones
          }
        }

        estacion.preguntas = preguntas
      }

      // Agregar estaciones y evaluadores al examen
      examen.estaciones = estaciones

      return examen
    } catch (error) {
      console.error(`Error al obtener examen con ID ${id}:`, error)
      return null
    }
  },
  delete: async (id: number): Promise<boolean> => {
    // Verificar si hay alumnos asignados antes de eliminar
    const checkQuery = `
      SELECT COUNT(*) as count FROM alumnos_examenes WHERE examen_id = $1
    `
    const checkResult = await executeQuery<{ count: string }>(checkQuery, [id])
    const alumnosCount = Number(checkResult[0]?.count || 0)
    if (alumnosCount > 0) {
      throw new Error("No se puede eliminar el examen porque tiene alumnos asignados")
    }

    const deleteQuery = `
      DELETE FROM examenes WHERE id = $1 RETURNING id
    `
    const result = await executeQuery<any>(deleteQuery, [id])
    return result.length > 0
  },
  getProximos: async (limite: number): Promise<Examen[]> => {
    const query = `
      SELECT *
      FROM examenes
      WHERE fecha_aplicacion >= CURRENT_DATE
      ORDER BY fecha_aplicacion ASC
      LIMIT $1
    `
    return executeQuery(query, [limite])
  },
}

// Servicio para grupos
export const gruposService = {
  getAll: async (): Promise<Grupo[]> => {
    const query = `
 SELECT 
   g.*, 
   (
     SELECT COUNT(*) 
     FROM alumnos_grupos ag 
     WHERE ag.grupo_id = g.id
   ) AS cant_alumnos
 FROM grupos g
 ORDER BY g.nombre
`
    return executeQuery(query)
  },
  getById: async (id: number): Promise<Grupo | null> => {
    const query = `SELECT * FROM grupos WHERE id = $1`
    const result = await executeQuery<Grupo>(query, [id])
    return result.length > 0 ? result[0] : null
  },
  update: async (id: number, grupo: Partial<Grupo>): Promise<Grupo | null> => {
    const { nombre, descripcion, fecha } = grupo
    const query = `
      UPDATE grupos
      SET nombre = $1, descripcion = $2, fecha_creacion = $3
      WHERE id = $4
      RETURNING *
    `
    const result = await executeQuery<Grupo>(query, [nombre, descripcion, fecha, id])
    return result.length > 0 ? result[0] : null
  },
  delete: async (id: number): Promise<boolean> => {
    const query = `DELETE FROM grupos WHERE id = $1`
    await executeQuery(query, [id])
    return true
  },
  asignarAlumno: async (grupoId: number, alumnoId: number): Promise<boolean> => {
    try {
      const query = `
        INSERT INTO alumnos_grupos (alumno_id, grupo_id)
        VALUES ($1, $2)
      `
      await executeQuery(query, [alumnoId, grupoId])
      return true
    } catch (error) {
      console.error("Error al asignar alumno al grupo:", error)
      return false
    }
  },
  eliminarAlumno: async (grupoId: number, alumnoId: number): Promise<boolean> => {
    try {
      const query = `
        DELETE FROM alumnos_grupos
        WHERE alumno_id = $1 AND grupo_id = $2
      `
      await executeQuery(query, [alumnoId, grupoId])
      return true
    } catch (error) {
      console.error("Error al eliminar alumno del grupo:", error)
      return false
    }
  },
  getAlumnos: async (grupoId: number): Promise<any[]> => {
    const query = `
      SELECT a.*
      FROM alumnos a
      JOIN alumnos_grupos ag ON a.id = ag.alumno_id
      WHERE ag.grupo_id = $1
    `
    return executeQuery(query, [grupoId])
  },
}

// Servicio para la tabla de relación alumnos_examenes
export const alumnosExamenesService = {
  tieneExamenAsignado: async (alumnoId: number, examenId: number): Promise<boolean> => {
    try {
      const query = `
        SELECT EXISTS (
          SELECT 1 
          FROM alumnos_examenes 
          WHERE alumno_id = $1 
          AND examen_id = $2
        )
      `
      const result = await executeQuery(query, [alumnoId, examenId])
      return result[0].exists
    } catch (error) {
      console.error("Error al verificar asignación existente:", error)
      return false
    }
  },

  asignarExamen: async (alumnoId: number, examenId: number, evaluadorId: number): Promise<boolean> => {
    try {
      // Verificar si ya existe la asignación
      const yaAsignado = await alumnosExamenesService.tieneExamenAsignado(alumnoId, examenId)
      if (yaAsignado) {
        return false // Indicamos que no se realizó la asignación
      }

      const query = `
        INSERT INTO alumnos_examenes (alumno_id, examen_id, evaluador_id, estado)
        VALUES ($1, $2, $3, 'Pendiente')
      `
      await executeQuery(query, [alumnoId, examenId, evaluadorId])
      return true
    } catch (error) {
      console.error("Error al asignar examen al alumno:", error)
      return false
    }
  },
  getExamenesDeAlumno: async (alumnoId: number): Promise<any[]> => {
    try {
      const query = `
        SELECT e.*, ae.estado
        FROM examenes e
        JOIN alumnos_examenes ae ON e.id = ae.examen_id
        WHERE ae.alumno_id = $1
      `
      return executeQuery(query, [alumnoId])
    } catch (error) {
      console.error("Error al obtener exámenes del alumno:", error)
      return []
    }
  },
  getAlumnosDeExamen: async (examenId: number): Promise<any[]> => {
    try {
      const query = `
        SELECT a.*, ae.estado
FROM alumnos a
JOIN alumnos_examenes ae ON a.id = ae.alumno_id
WHERE ae.examen_id = $1
ORDER BY a.apellido, a.nombre`
      return executeQuery(query, [examenId])
    } catch (error) {
      console.error("Error al obtener alumnos del examen:", error)
      return []
    }
  },
}

export const dbService = {
  alumnos: alumnosService,
  hospitales: hospitalesService,
  evaluadores: evaluadoresService,
  examenes: examenesService,
  grupos: gruposService,
  alumnosExamenes: alumnosExamenesService,
}
