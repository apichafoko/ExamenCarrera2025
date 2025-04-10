import { executeQuery } from "./db"

// Tipos para nuestros datos
type Alumno = {
  id: number
  nombre: string
  email: string
  telefono: string
  hospital: string
  examenes?: Array<{
    id: number
    nombre: string
    fecha: string
    estado: string
  }>
}

type Hospital = {
  id: number
  nombre: string
  direccion: string
  ciudad: string
  tipo: string
  alumnos?: Array<{
    id: number
    nombre: string
    email: string
  }>
}

// Función para sincronizar alumnos
export async function syncAlumnos() {
  try {
    // Obtener alumnos de localStorage
    const localAlumnos = JSON.parse(localStorage.getItem("alumnos") || "[]")

    // Para cada alumno en localStorage
    for (const alumno of localAlumnos) {
      // Buscar el hospital_id basado en el nombre del hospital
      const hospitalQuery = await executeQuery("SELECT id FROM hospitales WHERE nombre = $1", [alumno.hospital])

      let hospital_id = null
      if (hospitalQuery.length > 0) {
        hospital_id = hospitalQuery[0].id
      }

      // Verificar si el alumno ya existe en la base de datos
      const existingAlumno = await executeQuery("SELECT id FROM alumnos WHERE id = $1", [alumno.id])

      if (existingAlumno.length === 0) {
        // Insertar nuevo alumno
        await executeQuery(
          "INSERT INTO alumnos (id, nombre, email, telefono, hospital_id) VALUES ($1, $2, $3, $4, $5)",
          [alumno.id, alumno.nombre, alumno.email, alumno.telefono, hospital_id],
        )
      } else {
        // Actualizar alumno existente
        await executeQuery(
          "UPDATE alumnos SET nombre = $1, email = $2, telefono = $3, hospital_id = $4 WHERE id = $5",
          [alumno.nombre, alumno.email, alumno.telefono, hospital_id, alumno.id],
        )
      }

      // Sincronizar exámenes del alumno
      if (alumno.examenes && alumno.examenes.length > 0) {
        for (const examen of alumno.examenes) {
          // Verificar si la relación alumno-examen ya existe
          const existingRelation = await executeQuery(
            "SELECT * FROM alumnos_examenes WHERE alumno_id = $1 AND examen_id = $2",
            [alumno.id, examen.id],
          )

          if (existingRelation.length === 0) {
            // Insertar nueva relación
            await executeQuery("INSERT INTO alumnos_examenes (alumno_id, examen_id, estado) VALUES ($1, $2, $3)", [
              alumno.id,
              examen.id,
              examen.estado,
            ])
          } else {
            // Actualizar relación existente
            await executeQuery("UPDATE alumnos_examenes SET estado = $1 WHERE alumno_id = $2 AND examen_id = $3", [
              examen.estado,
              alumno.id,
              examen.id,
            ])
          }
        }
      }
    }

    // Obtener alumnos de la base de datos para actualizar localStorage
    const dbAlumnos = await executeQuery(`
      SELECT a.id, a.nombre, a.email, a.telefono, h.nombre as hospital
      FROM alumnos a
      LEFT JOIN hospitales h ON a.hospital_id = h.id
    `)

    // Para cada alumno, obtener sus exámenes
    for (let i = 0; i < dbAlumnos.length; i++) {
      const examenesQuery = await executeQuery(
        `
        SELECT e.id, e.nombre, e.fecha, ae.estado
        FROM alumnos_examenes ae
        JOIN examenes e ON ae.examen_id = e.id
        WHERE ae.alumno_id = $1
      `,
        [dbAlumnos[i].id],
      )

      dbAlumnos[i].examenes = examenesQuery
    }

    // Actualizar localStorage con los datos de la base de datos
    localStorage.setItem("alumnos", JSON.stringify(dbAlumnos))

    return { success: true, message: "Alumnos sincronizados correctamente" }
  } catch (error) {
    console.error("Error sincronizando alumnos:", error)
    return { success: false, message: "Error sincronizando alumnos" }
  }
}

// Función para sincronizar hospitales
export async function syncHospitales() {
  try {
    // Obtener hospitales de localStorage
    const localHospitales = JSON.parse(localStorage.getItem("hospitales") || "[]")

    // Para cada hospital en localStorage
    for (const hospital of localHospitales) {
      // Verificar si el hospital ya existe en la base de datos
      const existingHospital = await executeQuery("SELECT id FROM hospitales WHERE id = $1", [hospital.id])

      if (existingHospital.length === 0) {
        // Insertar nuevo hospital
        await executeQuery("INSERT INTO hospitales (id, nombre, direccion, ciudad, tipo) VALUES ($1, $2, $3, $4, $5)", [
          hospital.id,
          hospital.nombre,
          hospital.direccion,
          hospital.ciudad,
          hospital.tipo,
        ])
      } else {
        // Actualizar hospital existente
        await executeQuery("UPDATE hospitales SET nombre = $1, direccion = $2, ciudad = $3, tipo = $4 WHERE id = $5", [
          hospital.nombre,
          hospital.direccion,
          hospital.ciudad,
          hospital.tipo,
          hospital.id,
        ])
      }
    }

    // Obtener hospitales de la base de datos para actualizar localStorage
    const dbHospitales = await executeQuery(`
      SELECT h.id, h.nombre, h.direccion, h.ciudad, h.tipo
      FROM hospitales h
    `)

    // Para cada hospital, obtener sus alumnos
    for (let i = 0; i < dbHospitales.length; i++) {
      const alumnosQuery = await executeQuery(
        `
        SELECT a.id, a.nombre, a.email
        FROM alumnos a
        WHERE a.hospital_id = $1
      `,
        [dbHospitales[i].id],
      )

      dbHospitales[i].alumnos = alumnosQuery
    }

    // Actualizar localStorage con los datos de la base de datos
    localStorage.setItem("hospitales", JSON.stringify(dbHospitales))

    return { success: true, message: "Hospitales sincronizados correctamente" }
  } catch (error) {
    console.error("Error sincronizando hospitales:", error)
    return { success: false, message: "Error sincronizando hospitales" }
  }
}

// Función para sincronizar exámenes
export async function syncExamenes() {
  try {
    // Obtener exámenes de localStorage
    const localExamenes = JSON.parse(localStorage.getItem("examenes") || "[]")

    // Para cada examen en localStorage
    for (const examen of localExamenes) {
      // Verificar si el examen ya existe en la base de datos
      const existingExamen = await executeQuery("SELECT id FROM examenes WHERE id = $1", [examen.id])

      if (existingExamen.length === 0) {
        // Insertar nuevo examen
        await executeQuery("INSERT INTO examenes (id, nombre, fecha) VALUES ($1, $2, $3)", [
          examen.id,
          examen.nombre,
          examen.fecha,
        ])
      } else {
        // Actualizar examen existente
        await executeQuery("UPDATE examenes SET nombre = $1, fecha = $2 WHERE id = $3", [
          examen.nombre,
          examen.fecha,
          examen.id,
        ])
      }

      // Sincronizar estaciones del examen
      if (examen.estaciones && examen.estaciones.length > 0) {
        for (let i = 0; i < examen.estaciones.length; i++) {
          const estacion = examen.estaciones[i]

          // Verificar si la estación ya existe
          const existingEstacion = await executeQuery(
            "SELECT id FROM estaciones WHERE examen_id = $1 AND nombre = $2",
            [examen.id, estacion.nombre],
          )

          let estacionId

          if (existingEstacion.length === 0) {
            // Insertar nueva estación
            const result = await executeQuery(
              "INSERT INTO estaciones (examen_id, nombre, orden) VALUES ($1, $2, $3) RETURNING id",
              [examen.id, estacion.nombre, i + 1],
            )
            estacionId = result[0].id
          } else {
            // Actualizar estación existente
            await executeQuery("UPDATE estaciones SET nombre = $1, orden = $2 WHERE id = $3", [
              estacion.nombre,
              i + 1,
              existingEstacion[0].id,
            ])
            estacionId = existingEstacion[0].id
          }

          // Sincronizar preguntas de la estación
          if (estacion.preguntas && estacion.preguntas.length > 0) {
            for (let j = 0; j < estacion.preguntas.length; j++) {
              const pregunta = estacion.preguntas[j]

              // Verificar si la pregunta ya existe
              const existingPregunta = await executeQuery(
                "SELECT id FROM preguntas WHERE estacion_id = $1 AND descripcion = $2",
                [estacionId, pregunta.descripcion],
              )

              let preguntaId

              if (existingPregunta.length === 0) {
                // Insertar nueva pregunta
                const result = await executeQuery(
                  "INSERT INTO preguntas (estacion_id, descripcion, categoria, tipo, orden, escala_min, escala_max) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
                  [
                    estacionId,
                    pregunta.descripcion,
                    pregunta.categoria,
                    pregunta.tipo || "texto_libre",
                    j + 1,
                    pregunta.escalaMin,
                    pregunta.escalaMax,
                  ],
                )
                preguntaId = result[0].id
              } else {
                // Actualizar pregunta existente
                await executeQuery(
                  "UPDATE preguntas SET descripcion = $1, categoria = $2, tipo = $3, orden = $4, escala_min = $5, escala_max = $6 WHERE id = $7",
                  [
                    pregunta.descripcion,
                    pregunta.categoria,
                    pregunta.tipo || "texto_libre",
                    j + 1,
                    pregunta.escalaMin,
                    pregunta.escalaMax,
                    existingPregunta[0].id,
                  ],
                )
                preguntaId = existingPregunta[0].id
              }

              // Sincronizar opciones de la pregunta si existen
              if (pregunta.opciones && pregunta.opciones.length > 0) {
                // Primero eliminar opciones existentes para evitar duplicados
                await executeQuery("DELETE FROM opciones WHERE pregunta_id = $1", [preguntaId])

                // Insertar nuevas opciones
                for (let k = 0; k < pregunta.opciones.length; k++) {
                  const opcion = pregunta.opciones[k]
                  await executeQuery(
                    "INSERT INTO opciones (pregunta_id, texto, correcta, orden) VALUES ($1, $2, $3, $4)",
                    [preguntaId, opcion.texto, opcion.correcta || false, k + 1],
                  )
                }
              }
            }
          }
        }
      }

      // Sincronizar alumnos asignados al examen
      if (examen.alumnos && examen.alumnos.length > 0) {
        for (const alumno of examen.alumnos) {
          // Verificar si la relación alumno-examen ya existe
          const existingRelation = await executeQuery(
            "SELECT * FROM alumnos_examenes WHERE alumno_id = $1 AND examen_id = $2",
            [alumno.id, examen.id],
          )

          if (existingRelation.length === 0) {
            // Insertar nueva relación
            await executeQuery("INSERT INTO alumnos_examenes (alumno_id, examen_id, estado) VALUES ($1, $2, $3)", [
              alumno.id,
              examen.id,
              alumno.estado,
            ])
          } else {
            // Actualizar relación existente
            await executeQuery("UPDATE alumnos_examenes SET estado = $1 WHERE alumno_id = $2 AND examen_id = $3", [
              alumno.estado,
              alumno.id,
              examen.id,
            ])
          }
        }
      }
    }

    // Obtener exámenes de la base de datos para actualizar localStorage
    const dbExamenes = await executeQuery("SELECT id, nombre, fecha FROM examenes")

    // Para cada examen, obtener sus estaciones, preguntas y alumnos
    for (let i = 0; i < dbExamenes.length; i++) {
      // Obtener estaciones
      const estacionesQuery = await executeQuery(
        `
        SELECT id, nombre
        FROM estaciones
        WHERE examen_id = $1
        ORDER BY orden
      `,
        [dbExamenes[i].id],
      )

      const estaciones = []

      for (const estacion of estacionesQuery) {
        // Obtener preguntas de la estación
        const preguntasQuery = await executeQuery(
          `
          SELECT id, descripcion, categoria, tipo, escala_min as "escalaMin", escala_max as "escalaMax"
          FROM preguntas
          WHERE estacion_id = $1
          ORDER BY orden
        `,
          [estacion.id],
        )

        // Para cada pregunta, obtener sus opciones
        for (let j = 0; j < preguntasQuery.length; j++) {
          const opcionesQuery = await executeQuery(
            `
            SELECT id, texto, correcta
            FROM opciones
            WHERE pregunta_id = $1
            ORDER BY orden
          `,
            [preguntasQuery[j].id],
          )

          if (opcionesQuery.length > 0) {
            preguntasQuery[j].opciones = opcionesQuery
          }
        }

        estaciones.push({
          ...estacion,
          preguntas: preguntasQuery,
        })
      }

      dbExamenes[i].estaciones = estaciones

      // Obtener alumnos asignados al examen
      const alumnosQuery = await executeQuery(
        `
        SELECT a.id, a.nombre, ae.estado
        FROM alumnos_examenes ae
        JOIN alumnos a ON ae.alumno_id = a.id
        WHERE ae.examen_id = $1
      `,
        [dbExamenes[i].id],
      )

      dbExamenes[i].alumnos = alumnosQuery
    }

    // Actualizar localStorage con los datos de la base de datos
    localStorage.setItem("examenes", JSON.stringify(dbExamenes))

    return { success: true, message: "Exámenes sincronizados correctamente" }
  } catch (error) {
    console.error("Error sincronizando exámenes:", error)
    return { success: false, message: "Error sincronizando exámenes" }
  }
}

// Función para sincronizar todos los datos
export async function syncAllData() {
  try {
    await syncHospitales()
    await syncAlumnos()
    await syncExamenes()

    return { success: true, message: "Todos los datos sincronizados correctamente" }
  } catch (error) {
    console.error("Error sincronizando todos los datos:", error)
    return { success: false, message: "Error sincronizando todos los datos" }
  }
}
