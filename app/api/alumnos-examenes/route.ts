import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { alumnoId, examenId, evaluadorId } = await request.json()

    if (!alumnoId || !examenId || !evaluadorId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Verificar si ya existe una asignación previa
    const checkQuery = `
      SELECT id FROM alumnos_examenes
      WHERE alumno_id = $1 AND examen_id = $2
    `
    const checkResult = await executeQuery(checkQuery, [alumnoId, examenId])
    if (checkResult.length > 0) {
      return NextResponse.json({ error: "El examen ya está asignado a este alumno." }, { status: 409 })
    }

    // Si no existe, insertar nueva asignación
    const insertQuery = `
      INSERT INTO alumnos_examenes (alumno_id, examen_id, evaluador_id, fecha_inicio, estado)
      VALUES ($1, $2, $3, NOW(), 'Pendiente')
      RETURNING *
    `
    const result = await executeQuery(insertQuery, [alumnoId, examenId, evaluadorId])

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error en POST /api/alumnos-examenes:", error)
    return NextResponse.json({ error: "No se pudo asignar el examen" }, { status: 500 })
  }
}
