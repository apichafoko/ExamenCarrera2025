import { executeQuery } from "./db"
import { hashPassword } from "@/lib/auth-service"

// Tipos para nuestros datos
export type Alumno = {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  hospital_id: number | null
  hospital_nombre?: string | null
  fecha_creacion?: string | null
  fecha_actualizacion?: string | null
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
      SELECT a.*, h.nombre as hospital_nombre
      FROM alumnos a
      LEFT JOIN hospitales h ON a.hospital_id = h.id
      ORDER BY a.apellido, a.nombre
    `
    return executeQuery(query)
  },
  getById: async (id: number): Promise<Alumno | null> => {
    const query = `
      SELECT a.*, h.nombre as hospital_nombre
      FROM alumnos a
      LEFT JOIN hospitales h ON a.hospital_id = h.id
      WHERE a.id = $1
    `
    const result = await executeQuery<Alumno>(query, [id])

    if (result.length === 0) return null

    // Luego obtener los exámenes asignados
    const queryExamenes = `
      SELECT e.*, ae.estado
      FROM examenes e
      JOIN alumnos_examenes ae ON e.id = ae.examen_id
      WHERE ae.alumno_id = $1
    `
    const examenes = await executeQuery<any>(queryExamenes, [id])

    result[0].examenes = examenes

    return result.length > 0 ? result[0] : null
  },
  create: async (alumno: Omit<Alumno, "id">): Promise<Alumno | null> => {
    const { nombre, apellido, email, telefono, hospital_id } = alumno
    const query = `
      INSERT INTO alumnos (nombre, apellido, email, telefono, hospital_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await executeQuery<Alumno>(query, [nombre, apellido, email, telefono, hospital_id])

    return result.length > 0 ? result[0] : null
  },
  update: async (id: number, alumno: Partial<Alumno>): Promise<Alumno | null> => {
    const { nombre, apellido, email, telefono, hospital_id } = alumno
    const query = `
      UPDATE alumnos
      SET nombre = $1, apellido = $2, email = $3, telefono = $4, hospital_id = $5
      WHERE id = $6
      RETURNING *
    `
    const result = await executeQuery<Alumno>(query, [nombre, apellido, email, telefono, hospital_id, id])
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
    const query = `SELECT * FROM hospitales ORDER BY nombre`
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
    const query = `
      SELECT * FROM evaluadores WHERE usuario_id = $1
    `
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
  COUNT(ae.alumno_id) AS cantidad_alumnos
FROM examenes e
LEFT JOIN alumnos_examenes ae ON ae.examen_id = e.id
GROUP BY e.id
ORDER BY e.fecha_aplicacion DESC`
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
  create: async (examen: Omit<Examen, "id">): Promise<Examen | null> => {
    const { titulo, descripcion, fecha_aplicacion, estado } = examen
    const query = `
      INSERT INTO examenes (titulo, descripcion, fecha_aplicacion, estado)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const result = await executeQuery<Examen>(query, [titulo, descripcion, fecha_aplicacion, estado])
    return result.length > 0 ? result[0] : null
  },
  update: async (id: number, examenData: any): Promise<Examen | null> => {
    try {
      await executeQuery("BEGIN")

      const {
        titulo,
        descripcion,
        fecha_aplicacion,
        estado,
        evaluadores_ids,
        estaciones,
        deleted_estaciones,
        deleted_preguntas,
        deleted_opciones,
      } = examenData

      // 1. Eliminar elementos marcados para eliminación
      if (deleted_estaciones && deleted_estaciones.length > 0) {
        const deleteEstacionesQuery = `
        DELETE FROM estaciones 
        WHERE id = ANY($1)
      `
        await executeQuery(deleteEstacionesQuery, [deleted_estaciones])
      }

      if (deleted_preguntas && deleted_preguntas.length > 0) {
        const deletePreguntasQuery = `
        DELETE FROM preguntas 
        WHERE id = ANY($1)
      `
        await executeQuery(deletePreguntasQuery, [deleted_preguntas])
      }

      if (deleted_opciones && deleted_opciones.length > 0) {
        const deleteOpcionesQuery = `
        DELETE FROM opciones 
        WHERE id = ANY($1)
      `
        await executeQuery(deleteOpcionesQuery, [deleted_opciones])
      }

      // 2. Actualizar la información básica del examen
      const examenQuery = `
      UPDATE examenes
      SET titulo = $1, descripcion = $2, fecha_aplicacion = $3, estado = $4
      WHERE id = $5
      RETURNING *
    `
      const examenResult = await executeQuery<Examen>(examenQuery, [
        titulo,
        descripcion,
        fecha_aplicacion,
        estado || "Activo",
        id,
      ])

      if (examenResult.length === 0) {
        await executeQuery("ROLLBACK")
        throw new Error("No se pudo actualizar el examen")
      }

      // 3. Actualizar los evaluadores asignados
      if (evaluadores_ids) {
        await executeQuery("DELETE FROM examenes_evaluadores WHERE examen_id = $1", [id])
        if (evaluadores_ids.length > 0) {
          for (const evaluadorId of evaluadores_ids) {
            await executeQuery("INSERT INTO examenes_evaluadores (examen_id, evaluador_id) VALUES ($1, $2)", [
              id,
              evaluadorId,
            ])
          }
        }
      }

      // 4. Actualizar las estaciones
      if (estaciones && estaciones.length > 0) {
        for (const estacion of estaciones) {
          let estacionId

          if (estacion.id && estacion.id > 0) {
            const estacionQuery = `
            UPDATE estaciones
            SET titulo = $1, descripcion = $2, duracion_minutos = $3, orden = $4, activo = $5
            WHERE id = $6
            RETURNING id
          `
            const estacionResult = await executeQuery(estacionQuery, [
              estacion.titulo,
              estacion.descripcion,
              estacion.duracion_minutos,
              estacion.orden,
              estacion.activo,
              estacion.id,
            ])
            if (estacionResult.length > 0) {
              estacionId = estacionResult[0].id
            }
          } else {
            const estacionQuery = `
            INSERT INTO estaciones (examen_id, titulo, descripcion, duracion_minutos, orden, activo)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
          `
            const estacionResult = await executeQuery(estacionQuery, [
              id,
              estacion.titulo,
              estacion.descripcion,
              estacion.duracion_minutos,
              estacion.orden,
              estacion.activo,
            ])
            if (estacionResult.length > 0) {
              estacionId = estacionResult[0].id
            }
          }

          if (estacionId && estacion.preguntas && estacion.preguntas.length > 0) {
            for (const pregunta of estacion.preguntas) {
              let preguntaId

              if (pregunta.id && pregunta.id > 0) {
                const preguntaQuery = `
                UPDATE preguntas
                SET texto = $1, tipo = $2, obligatoria = $3, orden = $4, valor_minimo = $5, valor_maximo = $6, puntaje = $7
                WHERE id = $8
                RETURNING id
              `
                const preguntaResult = await executeQuery(preguntaQuery, [
                  pregunta.texto,
                  pregunta.tipo,
                  pregunta.obligatoria,
                  pregunta.orden,
                  pregunta.valor_minimo,
                  pregunta.valor_maximo,
                  pregunta.puntaje,
                  pregunta.id,
                ])
                if (preguntaResult.length > 0) {
                  preguntaId = preguntaResult[0].id
                }
              } else {
                const preguntaQuery = `
                INSERT INTO preguntas (estacion_id, texto, tipo, obligatoria, orden, valor_minimo, valor_maximo, puntaje)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
              `
                const preguntaResult = await executeQuery(preguntaQuery, [
                  estacionId,
                  pregunta.texto,
                  pregunta.tipo,
                  pregunta.obligatoria,
                  pregunta.orden,
                  pregunta.valor_minimo,
                  pregunta.valor_maximo,
                  pregunta.puntaje,
                ])
                if (preguntaResult.length > 0) {
                  preguntaId = preguntaResult[0].id
                }
              }

              if (preguntaId && pregunta.opciones && pregunta.opciones.length > 0) {
                await executeQuery("DELETE FROM opciones WHERE pregunta_id = $1", [preguntaId])
                for (const opcion of pregunta.opciones) {
                  await executeQuery(
                    `INSERT INTO opciones (pregunta_id, texto, es_correcta, orden)
                   VALUES ($1, $2, $3, $4)`,
                    [preguntaId, opcion.texto, opcion.es_correcta, opcion.orden],
                  )
                }
              }
            }
          }
        }
      }

      await executeQuery("COMMIT")
      return examenResult[0]
    } catch (error) {
      await executeQuery("ROLLBACK")
      console.error("Error al actualizar el examen:", error)
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
  create: async (grupo: Omit<Grupo, "id">): Promise<Grupo | null> => {
    const { nombre, descripcion, fecha } = grupo
    const query = `
      INSERT INTO grupos (nombre, descripcion, fecha_creacion)
      VALUES ($1, $2, $3)
      RETURNING *
    `
    const result = await executeQuery<Grupo>(query, [nombre, descripcion, fecha])
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
      `
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
