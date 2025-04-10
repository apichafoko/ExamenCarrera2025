import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    // Crear tabla de hospitales si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS hospitales (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        direccion VARCHAR(255),
        telefono VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Crear tabla de evaluadores si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS evaluadores (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        apellido VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        hospital_id INTEGER REFERENCES hospitales(id),
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Crear tabla de alumnos si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS alumnos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        apellido VARCHAR(255) NOT NULL,
        dni VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        telefono VARCHAR(50),
        fecha_nacimiento DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Crear tabla de grupos si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS grupos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Crear tabla de relación entre alumnos y grupos
    await sql`
      CREATE TABLE IF NOT EXISTS alumnos_grupos (
        alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
        grupo_id INTEGER REFERENCES grupos(id) ON DELETE CASCADE,
        PRIMARY KEY (alumno_id, grupo_id)
      )
    `

    // Crear tabla de exámenes si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS examenes (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES evaluadores(id)
      )
    `

    // Crear tabla de preguntas si no existe (con campo puntaje)
    await sql`
      CREATE TABLE IF NOT EXISTS preguntas (
        id SERIAL PRIMARY KEY,
        examen_id INTEGER REFERENCES examenes(id) ON DELETE CASCADE,
        texto TEXT NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        opciones JSONB,
        puntaje INTEGER DEFAULT 1,
        orden INTEGER
      )
    `

    // Crear tabla de asignaciones de exámenes
    await sql`
      CREATE TABLE IF NOT EXISTS asignaciones_examenes (
        id SERIAL PRIMARY KEY,
        examen_id INTEGER REFERENCES examenes(id) ON DELETE CASCADE,
        alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
        evaluador_id INTEGER REFERENCES evaluadores(id),
        fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_completado TIMESTAMP,
        estado VARCHAR(50) DEFAULT 'pendiente',
        UNIQUE(examen_id, alumno_id)
      )
    `

    // Crear tabla de respuestas
    await sql`
      CREATE TABLE IF NOT EXISTS respuestas (
        id SERIAL PRIMARY KEY,
        asignacion_id INTEGER REFERENCES asignaciones_examenes(id) ON DELETE CASCADE,
        pregunta_id INTEGER REFERENCES preguntas(id) ON DELETE CASCADE,
        respuesta JSONB,
        fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(asignacion_id, pregunta_id)
      )
    `

    // Insertar datos de ejemplo en hospitales si la tabla está vacía
    const hospitalesCount = await sql`SELECT COUNT(*) as count FROM hospitales`
    if (hospitalesCount[0].count === 0) {
      await sql`
        INSERT INTO hospitales (nombre, direccion, telefono, email)
        VALUES 
          ('Hospital San Martín', 'Av. San Martín 1234', '011-4567-8901', 'info@hsanmartin.com'),
          ('Hospital Italiano', 'Calle Italia 567', '011-2345-6789', 'contacto@hitaliano.com'),
          ('Sanatorio Güemes', 'Av. Córdoba 3456', '011-7890-1234', 'info@sguemes.com')
      `
    }

    // Insertar un evaluador administrador si la tabla está vacía
    const evaluadoresCount = await sql`SELECT COUNT(*) as count FROM evaluadores`
    if (evaluadoresCount[0].count === 0) {
      await sql`
        INSERT INTO evaluadores (nombre, apellido, email, password, is_admin)
        VALUES ('Admin', 'Sistema', 'admin@sistema.com', 'admin123', TRUE)
      `
    }

    return NextResponse.json({
      success: true,
      message: "Tablas creadas/actualizadas correctamente",
    })
  } catch (error) {
    console.error("Error creando tablas:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
