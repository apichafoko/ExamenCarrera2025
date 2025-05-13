import type { NextRequest } from "next/server"
import { alumnosService } from "@/lib/db-service"
import { successResponse, errorResponse } from "@/lib/api-utils"
import logger from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    logger.log("Ejecutando GET /api/alumnos")
    const alumnos = await alumnosService.getAll()
    logger.log(`Alumnos obtenidos: ${alumnos.length}`)

    // Serializar los datos para asegurar consistencia
    const serializableAlumnos = alumnos.map((alumno) => ({
      id: alumno.id,
      nombre: alumno.nombre || "",
      apellido: alumno.apellido || "",
      email: alumno.email || "",
      telefono: alumno.telefono || null,
      hospital_id: alumno.hospital_id || null,
      hospital_nombre: alumno.hospital_nombre || null,
      fecha_nacimiento: alumno.fecha_nacimiento ? new Date(alumno.fecha_nacimiento).toISOString() : null,
      promocion: alumno.promocion || null,
      sede: alumno.sede || null,
      documento: alumno.documento || null,
    }))

    return successResponse(serializableAlumnos)
  } catch (error) {
    logger.error("Error en GET /api/alumnos:", error)
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validar campos requeridos
    if (!data.nombre || !data.email) {
      logger.warn("Faltan campos requeridos en POST /api/alumnos:", { data })
      return errorResponse("El nombre y el correo electrónico son obligatorios", 400)
    }

    // Transformar y validar datos
    const alumnoData = {
      nombre: data.nombre,
      apellido: data.apellido || "",
      email: data.email,
      telefono: data.telefono || null,
      hospital_id: data.hospital_id ? Number.parseInt(data.hospital_id) : null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      promocion: data.promocion ? Number.parseInt(data.promocion) : null,
      sede: data.sede || null,
      documento: data.documento ? Number.parseInt(data.documento) : null,
    }

    logger.log("Creando alumno con datos:", alumnoData)
    const nuevoAlumno = await alumnosService.create(alumnoData)

    if (!nuevoAlumno) {
      logger.error("No se pudo crear el alumno:", alumnoData)
      return errorResponse("No se pudo crear el alumno", 500)
    }

    // Serializar la respuesta
    const serializableAlumno = {
      id: nuevoAlumno.id,
      nombre: nuevoAlumno.nombre || "",
      apellido: nuevoAlumno.apellido || "",
      email: nuevoAlumno.email || "",
      telefono: nuevoAlumno.telefono || null,
      hospital_id: nuevoAlumno.hospital_id || null,
      hospital_nombre: nuevoAlumno.hospital_nombre || null,
      fecha_nacimiento: nuevoAlumno.fecha_nacimiento ? new Date(nuevoAlumno.fecha_nacimiento).toISOString() : null,
      promocion: nuevoAlumno.promocion || null,
      sede: nuevoAlumno.sede || null,
      documento: nuevoAlumno.documento || null,
      fecha_creacion: nuevoAlumno.fecha_creacion ? new Date(nuevoAlumno.fecha_creacion).toISOString() : null,
      fecha_actualizacion: nuevoAlumno.fecha_actualizacion
        ? new Date(nuevoAlumno.fecha_actualizacion).toISOString()
        : null,
    }

    logger.log("Alumno creado exitosamente:", serializableAlumno)
    return successResponse(serializableAlumno, 201)
  } catch (error) {
    logger.error("Error en POST /api/alumnos:", error)
    return errorResponse(error)
  }
}