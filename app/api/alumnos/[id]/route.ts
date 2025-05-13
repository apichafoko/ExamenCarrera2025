import { NextResponse } from "next/server"
import { alumnosService } from "@/lib/db-service"
import logger from "@/lib/logger"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    const alumno = await alumnosService.getById(id)

    if (!alumno) {
      return NextResponse.json({ message: "Alumno no encontrado" }, { status: 404 })
    }

    // Transformar el resultado para asegurar que sea serializable
    const serializableAlumno = {
      id: alumno.id,
      nombre: alumno.nombre || "",
      apellido: alumno.apellido || "",
      email: alumno.email || "",
      telefono: alumno.telefono || "",
      hospital_id: alumno.hospital_id || null,
      hospital_nombre: alumno.hospital_nombre || null,
      fecha_nacimiento: alumno.fecha_nacimiento ? new Date(alumno.fecha_nacimiento).toISOString() : null,
      promocion: alumno.promocion || null,
      sede: alumno.sede || null,
      documento: alumno.documento || null,
      // Convertir fechas a strings si existen
      fecha_creacion: alumno.fecha_creacion ? new Date(alumno.fecha_creacion).toISOString() : null,
      fecha_actualizacion: alumno.fecha_actualizacion ? new Date(alumno.fecha_actualizacion).toISOString() : null,
      // Si hay examenes, también los serializamos
      examenes: alumno.examenes
        ? alumno.examenes.map((examen) => ({
            id: examen.id,
            nombre: examen.nombre || examen.titulo || "",
            fecha: examen.fecha ? new Date(examen.fecha).toISOString() : null,
            estado: examen.estado || "Pendiente",
          }))
        : [],
    }

    return NextResponse.json(serializableAlumno, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    logger.error(`Error al obtener alumno con ID ${params.id}:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener el alumno" },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    const data = await request.json()

    // Validar datos
    if (!data.nombre || !data.email) {
      return NextResponse.json({ message: "Faltan campos requeridos" }, { status: 400 })
    }

    const alumno = await alumnosService.update(id, {
      nombre: data.nombre,
      apellido: data.apellido || "",
      email: data.email,
      telefono: data.telefono || "",
      hospital_id: data.hospital_id || null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      promocion: data.promocion ? Number.parseInt(data.promocion) : null,
      sede: data.sede || null,
      documento: data.documento ? Number.parseInt(data.documento) : null,
    })

    if (!alumno) {
      return NextResponse.json({ message: "Alumno no encontrado" }, { status: 404 })
    }

    // Transformar el resultado para asegurar que sea serializable
    const serializableAlumno = {
      id: alumno.id,
      nombre: alumno.nombre || "",
      apellido: alumno.apellido || "",
      email: alumno.email || "",
      telefono: alumno.telefono || "",
      hospital_id: alumno.hospital_id || null,
      hospital_nombre: alumno.hospital_nombre || null,
      fecha_nacimiento: alumno.fecha_nacimiento ? new Date(alumno.fecha_nacimiento).toISOString() : null,
      promocion: alumno.promocion || null,
      sede: alumno.sede || null,
      documento: alumno.documento || null,
      // Convertir fechas a strings si existen
      fecha_creacion: alumno.fecha_creacion ? new Date(alumno.fecha_creacion).toISOString() : null,
      fecha_actualizacion: alumno.fecha_actualizacion ? new Date(alumno.fecha_actualizacion).toISOString() : null,
    }

    return NextResponse.json(serializableAlumno)
  } catch (error) {
    logger.error(`Error al actualizar alumno con ID ${params.id}:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al actualizar el alumno" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    const success = await alumnosService.delete(id)

    if (!success) {
      return NextResponse.json({ message: "Alumno no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Alumno eliminado correctamente" })
  } catch (error) {
    logger.error(`Error al eliminar alumno con ID ${params.id}:`, error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al eliminar el alumno" },
      { status: 500 },
    )
  }
}