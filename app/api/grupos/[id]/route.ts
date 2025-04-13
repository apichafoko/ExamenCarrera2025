import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    // Consulta directa a la base de datos usando @vercel/postgres
    const grupoResult = await sql`
      SELECT g.*, 
             COUNT(ga.alumno_id) AS total_alumnos
      FROM grupos g
      LEFT JOIN alumnos_grupos ga ON g.id = ga.grupo_id
      WHERE g.id = ${id}
      GROUP BY g.id
    `

    if (grupoResult.rows.length === 0) {
      return NextResponse.json({ message: "Grupo no encontrado" }, { status: 404 })
    }

    const grupo = grupoResult.rows[0]

    // Obtener los alumnos del grupo
    const alumnosResult = await sql`
      SELECT a.*, h.nombre as hospital_nombre
      FROM alumnos a
      LEFT JOIN hospitales h ON a.hospital_id = h.id
      JOIN alumnos_grupos ga ON a.id = ga.alumno_id
      WHERE ga.grupo_id = ${id}
      ORDER BY a.apellido, a.nombre
    `

    // Añadir los alumnos al objeto grupo
    grupo.alumnos = alumnosResult.rows || []

    return NextResponse.json(grupo, { status: 200 })
  } catch (error) {
    console.error("Error en GET /api/grupos/[id]:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener el grupo" },
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

    // Actualizar el grupo en la base de datos
    const result = await sql`
      UPDATE grupos
      SET nombre = ${data.nombre}, 
          descripcion = ${data.descripcion || null},
          activo = ${data.activo}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Grupo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0], { status: 200 })
  } catch (error) {
    console.error("Error en PUT /api/grupos/[id]:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al actualizar el grupo" },
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

    // Verificar si el grupo tiene alumnos
    const checkResult = await sql`
      SELECT COUNT(*) as count
      FROM alumnos_grupos
      WHERE grupo_id = ${id}
    `

    const count = Number.parseInt(checkResult.rows[0].count)

    if (count > 0) {
      return NextResponse.json(
        { message: "No se puede eliminar el grupo porque tiene alumnos asignados" },
        { status: 409 },
      )
    }

    // Eliminar el grupo
    const result = await sql`
      DELETE FROM grupos
      WHERE id = ${id}
      RETURNING id
    `

    if (result.rows.length === 0) {
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
