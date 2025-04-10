import { type NextRequest, NextResponse } from "next/server"
import { evaluadorService } from "@/lib/evaluador-service"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const evaluadorId = url.searchParams.get("evaluadorId")
    const estado = url.searchParams.get("estado")

    if (!evaluadorId) {
      console.error("Se requiere el parámetro evaluadorId")
      return NextResponse.json({ message: "Se requiere el parámetro evaluadorId" }, { status: 400 })
    }

    // Convertir evaluadorId a número y verificar que sea válido
    const evaluadorIdNum = Number(evaluadorId)
    if (isNaN(evaluadorIdNum)) {
      console.error(`ID de evaluador inválido: "${evaluadorId}"`)
      return NextResponse.json({ message: "ID de evaluador inválido" }, { status: 400 })
    }

    console.log(`GET /api/evaluador/examenes?evaluadorId=${evaluadorIdNum}&estado=${estado || "todos"}`)

    // Verificar si hay registros en la tabla alumnos_examenes
    const checkTableQuery = `
      SELECT COUNT(*) as total FROM alumnos_examenes
    `
    const tableCheck = await executeQuery(checkTableQuery)
    console.log(`Total de registros en alumnos_examenes: ${tableCheck[0]?.total || 0}`)

    // Verificar si hay registros para este evaluador específico
    const checkEvaluadorQuery = `
      SELECT COUNT(*) as total FROM alumnos_examenes WHERE evaluador_id = $1
    `
    const evaluadorCheck = await executeQuery(checkEvaluadorQuery, [evaluadorIdNum])
    console.log(`Registros para evaluador ${evaluadorIdNum}: ${evaluadorCheck[0]?.total || 0}`)

    // Si el estado es "todos", pasamos undefined para obtener todos los estados
    const examenes = await evaluadorService.getExamenesAsignados(
      evaluadorIdNum,
      estado === "todos" ? undefined : estado || undefined,
    )

    console.log(`Exámenes encontrados para evaluador ${evaluadorIdNum}: ${examenes.length}`)

    // Si no se encontraron exámenes pero sabemos que hay registros para este evaluador,
    // intentar una consulta más simple para depurar
    if (examenes.length === 0 && evaluadorCheck[0]?.total > 0) {
      console.log("Intentando consulta directa para depurar...")
      const directQuery = `
        SELECT ae.* 
        FROM alumnos_examenes ae
        WHERE ae.evaluador_id = $1
      `
      const directResult = await executeQuery(directQuery, [evaluadorIdNum])
      console.log(`Consulta directa encontró ${directResult.length} registros:`, directResult)

      // Si encontramos registros con la consulta directa, intentemos obtener los datos relacionados
      if (directResult.length > 0) {
        const manualExamenes = []
        for (const ae of directResult) {
          try {
            // Obtener datos del alumno
            const alumnoQuery = `SELECT nombre, apellido FROM alumnos WHERE id = $1`
            const alumnoResult = await executeQuery(alumnoQuery, [ae.alumno_id])

            // Obtener datos del examen
            const examenQuery = `SELECT titulo FROM examenes WHERE id = $1`
            const examenResult = await executeQuery(examenQuery, [ae.examen_id])

            if (alumnoResult.length > 0 && examenResult.length > 0) {
              manualExamenes.push({
                ...ae,
                alumno_nombre: alumnoResult[0].nombre,
                alumno_apellido: alumnoResult[0].apellido,
                examen_titulo: examenResult[0].titulo,
                examen_id: ae.examen_id,
              })
            }
          } catch (err) {
            console.error(`Error al obtener datos relacionados para registro ${ae.id}:`, err)
          }
        }

        console.log(`Construidos manualmente ${manualExamenes.length} registros`)

        if (manualExamenes.length > 0) {
          return NextResponse.json(manualExamenes, {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          })
        }
      }
    }

    return NextResponse.json(examenes, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error en GET /api/evaluador/examenes:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al obtener los exámenes" },
      { status: 500 },
    )
  }
}
