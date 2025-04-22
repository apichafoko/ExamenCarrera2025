import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { alumnoId, examenId, evaluadorId } = await request.json()

    if (!alumnoId || !examenId || !evaluadorId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Iniciar transacción
    await executeQuery("BEGIN")

    // Verificar si ya existe una asignación previa para el mismo examen y alumno
    const checkQuery = `
      SELECT id FROM alumnos_examenes
      WHERE alumno_id = $1 AND examen_id = $2
    `
    const checkResult = await executeQuery(checkQuery, [alumnoId, examenId])
    if (checkResult.length > 0) {
      await executeQuery("ROLLBACK")
      return NextResponse.json({ error: "El examen ya está asignado a este alumno." }, { status: 409 })
    }

    // Obtener la fecha del examen que se está asignando
    const examenQuery = `
      SELECT fecha_aplicacion FROM examenes
      WHERE id = $1
    `
    const examenResult = await executeQuery(examenQuery, [examenId])
    if (examenResult.length === 0) {
      await executeQuery("ROLLBACK")
      return NextResponse.json({ error: "El examen especificado no existe" }, { status: 404 })
    }
    const fechaExamen = examenResult[0].fecha_aplicacion

    // Verificar si el alumno tiene otros exámenes en la misma fecha y obtener el numero_identificacion
    const fechaInicioDia = new Date(fechaExamen).setHours(0, 0, 0, 0)
    const fechaFinDia = new Date(fechaExamen).setHours(23, 59, 59, 999)
    const otrosExamenesQuery = `
      SELECT ae.numero_identificacion
      FROM alumnos_examenes ae
      JOIN examenes e ON ae.examen_id = e.id
      WHERE ae.alumno_id = $1
      AND e.fecha_aplicacion >= $2
      AND e.fecha_aplicacion <= $3
      AND ae.numero_identificacion IS NOT NULL
      LIMIT 1
    `
    const otrosExamenesResult = await executeQuery(otrosExamenesQuery, [
      alumnoId,
      new Date(fechaInicioDia).toISOString(),
      new Date(fechaFinDia).toISOString(),
    ])

    let numeroIdentificacion = null
    if (otrosExamenesResult.length > 0) {
      numeroIdentificacion = otrosExamenesResult[0].numero_identificacion
      console.log(`Reutilizando numero_identificacion: ${numeroIdentificacion} para el alumno ${alumnoId}`)
    }

    // Insertar nueva asignación con fecha_inicio como NULL
    const insertQuery = `
      INSERT INTO alumnos_examenes (alumno_id, examen_id, evaluador_id, fecha_inicio, estado, numero_identificacion)
      VALUES ($1, $2, $3, NULL, 'Pendiente', $4)
      RETURNING *
    `
    const insertParams = [alumnoId, examenId, evaluadorId, numeroIdentificacion]
    const result = await executeQuery(insertQuery, insertParams)

    // Confirmar transacción
    await executeQuery("COMMIT")

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error en POST /api/alumnos-examenes:", error)
    await executeQuery("ROLLBACK")
    return NextResponse.json({ error: "No se pudo asignar el examen" }, { status: 500 })
  }
}
