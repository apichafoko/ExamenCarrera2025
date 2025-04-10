import { executeQuery } from "./db"

export async function getDatabaseStats() {
  try {
    // Obtener conteos de las tablas principales
    const hospitalCount = await executeQuery("SELECT COUNT(*) as count FROM hospitales")
    const alumnoCount = await executeQuery("SELECT COUNT(*) as count FROM alumnos")
    const evaluadorCount = await executeQuery("SELECT COUNT(*) as count FROM evaluadores")
    const examenCount = await executeQuery("SELECT COUNT(*) as count FROM examenes")
    const grupoCount = await executeQuery("SELECT COUNT(*) as count FROM grupos")
    const estacionCount = await executeQuery("SELECT COUNT(*) as count FROM estaciones")
    const preguntaCount = await executeQuery("SELECT COUNT(*) as count FROM preguntas")
    const respuestaCount = await executeQuery("SELECT COUNT(*) as count FROM respuestas")

    // Obtener estadísticas de exámenes por estado
    const examenesEstado = await executeQuery(`
      SELECT estado, COUNT(*) as count 
      FROM alumnos_examenes 
      GROUP BY estado
    `)

    // Obtener top 5 alumnos con mejores calificaciones
    const topAlumnos = await executeQuery(`
      SELECT a.id, a.nombre, a.apellido, AVG(ae.calificacion) as promedio
      FROM alumnos a
      JOIN alumnos_examenes ae ON a.id = ae.alumno_id
      WHERE ae.calificacion IS NOT NULL
      GROUP BY a.id, a.nombre, a.apellido
      ORDER BY promedio DESC
      LIMIT 5
    `)

    // Obtener distribución de calificaciones por estación
    const calificacionesEstacion = await executeQuery(`
      SELECT e.nombre, AVG(re.calificacion) as promedio
      FROM estaciones e
      JOIN resultados_estaciones re ON e.id = re.estacion_id
      GROUP BY e.nombre
      ORDER BY promedio DESC
    `)

    return {
      counts: {
        hospitales: hospitalCount[0].count,
        alumnos: alumnoCount[0].count,
        evaluadores: evaluadorCount[0].count,
        examenes: examenCount[0].count,
        grupos: grupoCount[0].count,
        estaciones: estacionCount[0].count,
        preguntas: preguntaCount[0].count,
        respuestas: respuestaCount[0].count,
      },
      examenesEstado,
      topAlumnos,
      calificacionesEstacion,
    }
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    throw error
  }
}

export async function getRecentActivity() {
  try {
    // Obtener las respuestas más recientes (simulado con LIMIT ya que no tenemos timestamps)
    const recentResponses = await executeQuery(`
      SELECT a.nombre as alumno, p.descripcion as pregunta, r.texto_respuesta as respuesta, r.comentario as comentarios
      FROM respuestas r
      JOIN alumnos a ON r.alumno_id = a.id
      JOIN preguntas p ON r.pregunta_id = p.id
      ORDER BY r.id DESC
      LIMIT 5
    `)

    // Obtener los exámenes más recientes por estado
    const recentExams = await executeQuery(`
      SELECT a.nombre as alumno, e.titulo as examen, ae.estado, ev.nombre as evaluador
      FROM alumnos_examenes ae
      JOIN alumnos a ON ae.alumno_id = a.id
      JOIN examenes e ON ae.examen_id = e.id
      LEFT JOIN evaluadores ev ON ae.evaluador_id = ev.id
      ORDER BY ae.alumno_id DESC
      LIMIT 5
    `)

    return {
      recentResponses,
      recentExams,
    }
  } catch (error) {
    console.error("Error obteniendo actividad reciente:", error)
    throw error
  }
}

export const statsService = {
  getDashboardStats: async () => {
    try {
      // Obtener conteos de las tablas principales
      const alumnosCount = await executeQuery("SELECT COUNT(*) as count FROM alumnos")
      const examenesCount = await executeQuery("SELECT COUNT(*) as count FROM examenes")
      const evaluadoresCount = await executeQuery("SELECT COUNT(*) as count FROM evaluadores")
      const gruposCount = await executeQuery("SELECT COUNT(*) as count FROM grupos")

      // Obtener estadísticas de exámenes por estado
      const examenesEstado = await executeQuery(`
        SELECT estado, COUNT(*) as count 
        FROM alumnos_examenes 
        GROUP BY estado
      `)

      // Obtener top 5 alumnos con mejores calificaciones
      const topAlumnos = await executeQuery(`
        SELECT a.id, a.nombre, a.apellido, AVG(ae.calificacion) as promedio
        FROM alumnos a
        JOIN alumnos_examenes ae ON a.id = ae.alumno_id
        WHERE ae.calificacion IS NOT NULL
        GROUP BY a.id, a.nombre, a.apellido
        ORDER BY promedio DESC
        LIMIT 5
      `)

      // Obtener actividad reciente
      const actividadReciente = await executeQuery(`
        SELECT a.nombre as alumno_nombre, a.apellido as alumno_apellido, 
               e.titulo as examen_titulo, ae.estado, 
               ae.fecha_fin as fecha, 
               ev.nombre as evaluador_nombre, ev.apellido as evaluador_apellido
        FROM alumnos_examenes ae
        JOIN alumnos a ON ae.alumno_id = a.id
        JOIN examenes e ON ae.examen_id = e.id
        LEFT JOIN evaluadores ev ON ae.evaluador_id = ev.id
        ORDER BY ae.fecha_fin DESC NULLS LAST, ae.fecha_inicio DESC NULLS LAST
        LIMIT 10
      `)

      return {
        counts: {
          alumnos: alumnosCount[0].count,
          examenes: examenesCount[0].count,
          evaluadores: evaluadoresCount[0].count,
          grupos: gruposCount[0].count,
        },
        examenesEstado,
        topAlumnos,
        actividadReciente,
      }
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error)
      throw error
    }
  },
}
