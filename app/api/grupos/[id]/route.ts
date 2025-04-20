import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

// GET: Retrieve a group by ID with its students
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    // Query the group and count of students
    const grupoQuery = `
      SELECT g.*, 
             COUNT(ga.alumno_id) AS total_alumnos
      FROM grupos g
      LEFT JOIN alumnos_grupos ga ON g.id = ga.grupo_id
      WHERE g.id = $1
      GROUP BY g.id
    `
    const grupoResult = await executeQuery(grupoQuery, [id])

    if (grupoResult.length === 0) {
      return NextResponse.json({ message: "Grupo no encontrado" }, { status: 404 })
    }

    const grupo = grupoResult[0]

    // Query students in the group
    const alumnosQuery = `
      SELECT a.*, h.nombre as hospital_nombre
      FROM alumnos a
      LEFT JOIN hospitales h ON a.hospital_id = h.id
      JOIN alumnos_grupos ga ON a.id = ga.alumno_id
      WHERE ga.grupo_id = $1
      ORDER BY a.apellido, a.nombre
    `
    const alumnosResult = await executeQuery(alumnosQuery, [id])

    // Add students to the group object
    grupo.alumnos = alumnosResult || []

    return NextResponse.json(grupo, { status: 200 })
  } catch (error) {
    console.error("Error en GET /api/grupos/[id]:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener el grupo" },
      { status: 500 },
    )
  }
}

// PUT: Update a group by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    const data = await request.json()

    // Update the group
    const updateQuery = `
      UPDATE grupos
      SET nombre = $1, 
          descripcion = $2,
          activo = $3
      WHERE id = $4
      RETURNING *
    `
    const result = await executeQuery(updateQuery, [
      data.nombre,
      data.descripcion || null,
      data.activo,
      id,
    ])

    if (result.length === 0) {
      return NextResponse.json({ message: "Grupo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result[0], { status: 200 })
  } catch (error) {
    console.error("Error en PUT /api/grupos/[id]:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al actualizar el grupo" },
      { status: 500 },
    )
  }
}

// DELETE: Delete a group by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    // Check if the group has assigned students
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM alumnos_grupos
      WHERE grupo_id = $1
    `
    const checkResult = await executeQuery(checkQuery, [id])

    const count = Number.parseInt(checkResult[0].count)

    if (count > 0) {
      return NextResponse.json(
        { message: "No se puede eliminar el grupo porque tiene alumnos asignados" },
        { status: 409 },
      )
    }

    // Delete the group
    const deleteQuery = `
      DELETE FROM grupos
      WHERE id = $1
      RETURNING id
    `
    const result = await executeQuery(deleteQuery, [id])

    if (result.length === 0) {
      return NextResponse.json({ message: "Grupo no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Grupo eliminado correctamente" }, { status: 200 })
  } catch (error) {
    console.error("Error en DELETE /api/grupos/[id]:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al eliminar el grupo" },
      { status: 500 },
    )
  }
}
