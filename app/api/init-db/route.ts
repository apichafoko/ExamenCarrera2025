import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import logger from "@/lib/logger"

export async function GET() {
  try {
    logger.log("Iniciando verificación y creación de tablas...")

    // Verificar si las tablas existen y crearlas si no
    const tablas = [
      {
        nombre: "hospitales",
        query: `
          CREATE TABLE IF NOT EXISTS hospitales (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            direccion VARCHAR(255) NOT NULL,
            telefono VARCHAR(50),
            email VARCHAR(255),
            ciudad VARCHAR(100),
            estado VARCHAR(100),
            codigo_postal VARCHAR(20),
            pais VARCHAR(100),
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `,
      },
      {
        nombre: "evaluadores",
        query: `
          CREATE TABLE IF NOT EXISTS evaluadores (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            apellido VARCHAR(100) NOT NULL,
            especialidad VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            telefono VARCHAR(50),
            hospital_id INTEGER REFERENCES hospitales(id),
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            activo BOOLEAN DEFAULT TRUE
          )
        `,
      },
      {
        nombre: "grupos",
        query: `
          CREATE TABLE IF NOT EXISTS grupos (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `,
      },
      {
        nombre: "alumnos",
        query: `
          CREATE TABLE IF NOT EXISTS alumnos (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            apellido VARCHAR(100) NOT NULL,
            matricula VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(255),
            telefono VARCHAR(50),
            fecha_nacimiento DATE,
            genero VARCHAR(20),
            grupo_id INTEGER REFERENCES grupos(id),
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `,
      },
      {
        nombre: "examenes",
        query: `
          CREATE TABLE IF NOT EXISTS examenes (
            id SERIAL PRIMARY KEY,
            titulo VARCHAR(255) NOT NULL,
            descripcion TEXT,
            fecha_aplicacion DATE,
            estado VARCHAR(50) DEFAULT 'Pendiente',
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `,
      },
      {
        nombre: "estaciones",
        query: `
          CREATE TABLE IF NOT EXISTS estaciones (
            id SERIAL PRIMARY KEY,
            examen_id INTEGER NOT NULL REFERENCES examenes(id),
            nombre VARCHAR(255) NOT NULL,
            descripcion TEXT,
            duracion_minutos INTEGER DEFAULT 15,
            puntaje_maximo DECIMAL(10,2),
            hospital_id INTEGER REFERENCES hospitales(id),
            evaluador_id INTEGER REFERENCES evaluadores(id)
          )
        `,
      },
      {
        nombre: "preguntas",
        query: `
          CREATE TABLE IF NOT EXISTS preguntas (
            id SERIAL PRIMARY KEY,
            estacion_id INTEGER NOT NULL REFERENCES estaciones(id),
            texto TEXT NOT NULL,
            tipo VARCHAR(50) NOT NULL,
            opciones TEXT[],
            respuesta_correcta TEXT,
            puntaje DECIMAL(10,2) DEFAULT 1.0,
            obligatoria BOOLEAN DEFAULT TRUE,
            orden INTEGER
          )
        `,
      },
      {
        nombre: "asignaciones_examenes",
        query: `
          CREATE TABLE IF NOT EXISTS asignaciones_examenes (
            id SERIAL PRIMARY KEY,
            alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
            examen_id INTEGER NOT NULL REFERENCES examenes(id),
            evaluador_id INTEGER REFERENCES evaluadores(id),
            fecha_asignacion DATE NOT NULL,
            UNIQUE(alumno_id, examen_id)
          )
        `,
      },
      {
        nombre: "respuestas_alumnos",
        query: `
          CREATE TABLE IF NOT EXISTS respuestas_alumnos (
            id SERIAL PRIMARY KEY,
            alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
            pregunta_id INTEGER NOT NULL REFERENCES preguntas(id),
            respuesta TEXT,
            puntaje DECIMAL(10,2),
            fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(alumno_id, pregunta_id)
          )
        `,
      },
    ]

    // Crear las tablas en orden
    const resultados = []
    for (const tabla of tablas) {
      try {
        logger.log(`Verificando/creando tabla: ${tabla.nombre}`)
        await sql.query(tabla.query)
        resultados.push({ tabla: tabla.nombre, estado: "OK" })
      } catch (error) {
        logger.error(`Error creando tabla ${tabla.nombre}:`, error)
        resultados.push({
          tabla: tabla.nombre,
          estado: "ERROR",
          mensaje: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Verificar si hay datos de ejemplo y agregarlos si no hay
    const verificarDatos = async (tabla, countQuery) => {
      const result = await sql.query(countQuery)
      return result[0]?.count > 0
    }

    // Verificar y agregar datos de ejemplo si es necesario
    const datosEjemplo = []

    // Hospitales
    const tieneHospitales = await verificarDatos("hospitales", "SELECT COUNT(*) FROM hospitales")
    if (!tieneHospitales) {
      try {
        await sql.query(`
          INSERT INTO hospitales (nombre, direccion, telefono, ciudad, estado) VALUES
          ('Hospital Central', 'Av. Principal 123', '555-1234', 'Ciudad Capital', 'Estado Central'),
          ('Clínica Norte', 'Calle Norte 456', '555-5678', 'Ciudad Norte', 'Estado Norte'),
          ('Hospital Sur', 'Av. Sur 789', '555-9012', 'Ciudad Sur', 'Estado Sur')
        `)
        datosEjemplo.push({ tabla: "hospitales", estado: "Datos de ejemplo agregados" })
      } catch (error) {
        datosEjemplo.push({
          tabla: "hospitales",
          estado: "ERROR al agregar datos",
          mensaje: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Evaluadores
    const tieneEvaluadores = await verificarDatos("evaluadores", "SELECT COUNT(*) FROM evaluadores")
    if (!tieneEvaluadores) {
      try {
        await sql.query(`
          INSERT INTO evaluadores (nombre, apellido, especialidad, email, activo) VALUES
          ('Roberto', 'Gómez', 'Cardiología', 'roberto.gomez@email.com', true),
          ('Elena', 'Vargas', 'Neurología', 'elena.vargas@email.com', true),
          ('Fernando', 'Morales', 'Pediatría', 'fernando.morales@email.com', true),
          ('Carmen', 'Jiménez', 'Cirugía', 'carmen.jimenez@email.com', true),
          ('Alejandro', 'Ortiz', 'Medicina Interna', 'alejandro.ortiz@email.com', true)
        `)
        datosEjemplo.push({ tabla: "evaluadores", estado: "Datos de ejemplo agregados" })
      } catch (error) {
        datosEjemplo.push({
          tabla: "evaluadores",
          estado: "ERROR al agregar datos",
          mensaje: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Grupos
    const tieneGrupos = await verificarDatos("grupos", "SELECT COUNT(*) FROM grupos")
    if (!tieneGrupos) {
      try {
        await sql.query(`
          INSERT INTO grupos (nombre, descripcion) VALUES
          ('Grupo A', 'Estudiantes de primer año'),
          ('Grupo B', 'Estudiantes de segundo año'),
          ('Grupo C', 'Estudiantes de tercer año')
        `)
        datosEjemplo.push({ tabla: "grupos", estado: "Datos de ejemplo agregados" })
      } catch (error) {
        datosEjemplo.push({
          tabla: "grupos",
          estado: "ERROR al agregar datos",
          mensaje: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Alumnos
    const tieneAlumnos = await verificarDatos("alumnos", "SELECT COUNT(*) FROM alumnos")
    if (!tieneAlumnos) {
      try {
        await sql.query(`
          INSERT INTO alumnos (nombre, apellido, matricula, email, grupo_id) VALUES
          ('Juan', 'Pérez', 'A001', 'juan.perez@email.com', 1),
          ('María', 'López', 'A002', 'maria.lopez@email.com', 1),
          ('Carlos', 'Rodríguez', 'A003', 'carlos.rodriguez@email.com', 2),
          ('Ana', 'Martínez', 'A004', 'ana.martinez@email.com', 2),
          ('Pedro', 'Sánchez', 'A005', 'pedro.sanchez@email.com', 3)
        `)
        datosEjemplo.push({ tabla: "alumnos", estado: "Datos de ejemplo agregados" })
      } catch (error) {
        datosEjemplo.push({
          tabla: "alumnos",
          estado: "ERROR al agregar datos",
          mensaje: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Exámenes
    const tieneExamenes = await verificarDatos("examenes", "SELECT COUNT(*) FROM examenes")
    if (!tieneExamenes) {
      try {
        await sql.query(`
          INSERT INTO examenes (titulo, descripcion, fecha_aplicacion, estado) VALUES
          ('Examen de Cardiología', 'Evaluación de conocimientos en cardiología', '2025-04-12', 'Activo'),
          ('Examen de Neurología', 'Evaluación de conocimientos en neurología', '2025-04-17', 'Activo'),
          ('Examen de Pediatría', 'Evaluación de conocimientos en pediatría', '2025-04-22', 'Activo'),
          ('Examen de Cirugía', 'Evaluación de conocimientos en cirugía', '2025-04-27', 'Activo'),
          ('Examen de Medicina Interna', 'Evaluación de conocimientos en medicina interna', '2025-05-02', 'Activo')
        `)
        datosEjemplo.push({ tabla: "examenes", estado: "Datos de ejemplo agregados" })
      } catch (error) {
        datosEjemplo.push({
          tabla: "examenes",
          estado: "ERROR al agregar datos",
          mensaje: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({
      mensaje: "Verificación y creación de tablas completada",
      resultados,
      datosEjemplo,
    })
  } catch (error) {
    logger.error("Error en la inicialización de la base de datos:", error)
    return NextResponse.json(
      {
        mensaje: "Error en la inicialización de la base de datos",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
