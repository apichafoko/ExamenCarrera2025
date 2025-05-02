import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import logger from "@/lib/logger";

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { examen_ids, fecha_aplicacion } = await req.json();

    if (!Array.isArray(examen_ids) || examen_ids.length === 0) {
      return NextResponse.json({ error: "Se requiere al menos un ID de examen" }, { status: 400 });
    }

    if (!fecha_aplicacion) {
      return NextResponse.json({ error: "Fecha de aplicación requerida" }, { status: 400 });
    }

    const newDate = new Date(fecha_aplicacion);
    if (isNaN(newDate.getTime())) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }

    console.log("🧪 Iniciando duplicación masiva de exámenes:", examen_ids);
    await executeQuery("BEGIN");

    const result = await executeQuery(
      `
      SELECT 
        e.id AS examen_id, e.titulo AS examen_titulo, e.descripcion AS examen_descripcion, e.estado AS examen_estado,
        est.id AS estacion_id, est.titulo AS estacion_titulo, est.descripcion AS estacion_descripcion,
        est.duracion_minutos, est.orden AS estacion_orden, est.activo AS estacion_activo,
        p.id AS pregunta_id, p.texto AS pregunta_texto, p.tipo AS pregunta_tipo, p.obligatoria AS pregunta_obligatoria,
        p.orden AS pregunta_orden, p.valor_minimo, p.valor_maximo, p.puntaje,
        o.id AS opcion_id, o.texto AS opcion_texto, o.es_correcta, o.orden AS opcion_orden
      FROM examenes e
      LEFT JOIN estaciones est ON est.examen_id = e.id
      LEFT JOIN preguntas p ON p.estacion_id = est.id
      LEFT JOIN opciones o ON o.pregunta_id = p.id
      WHERE e.id = ANY($1)
      ORDER BY e.id, est.orden, p.orden, o.orden
      `,
      [examen_ids]
    );

    const examenes = new Map();

    for (const row of result) {
      if (!examenes.has(row.examen_id)) {
        examenes.set(row.examen_id, {
          original_id: row.examen_id,
          titulo: row.examen_titulo,
          descripcion: row.examen_descripcion,
          estado: row.examen_estado,
          estaciones: new Map(),
        });
      }
      const examen = examenes.get(row.examen_id);

      if (row.estacion_id) {
        if (!examen.estaciones.has(row.estacion_id)) {
          examen.estaciones.set(row.estacion_id, {
            titulo: row.estacion_titulo,
            descripcion: row.estacion_descripcion,
            duracion_minutos: row.duracion_minutos,
            orden: row.estacion_orden,
            activo: row.estacion_activo,
            preguntas: new Map(),
          });
        }
        const estacion = examen.estaciones.get(row.estacion_id);

        if (row.pregunta_id) {
          if (!estacion.preguntas.has(row.pregunta_id)) {
            estacion.preguntas.set(row.pregunta_id, {
              texto: row.pregunta_texto,
              tipo: row.pregunta_tipo,
              obligatoria: row.obligatoria,
              orden: row.pregunta_orden,
              valor_minimo: row.valor_minimo,
              valor_maximo: row.valor_maximo,
              puntaje: row.puntaje,
              opciones: [],
            });
          }
          const pregunta = estacion.preguntas.get(row.pregunta_id);

          if (row.opcion_id) {
            pregunta.opciones.push({
              texto: row.opcion_texto,
              es_correcta: row.es_correcta,
              orden: row.opcion_orden,
            });
          }
        }
      }
    }

    const newExamenIds: number[] = [];

    for (const examen of examenes.values()) {
      const newExamen = await executeQuery(
        `INSERT INTO examenes (titulo, descripcion, fecha_aplicacion, estado)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [`${examen.titulo} (${formatDate(newDate)})`, examen.descripcion, newDate.toISOString(), "ACTIVO"]
      );
      const newExamenId = newExamen[0].id;
      newExamenIds.push(newExamenId);

      for (const estacion of examen.estaciones.values()) {
        const inserted = await executeQuery(
          `INSERT INTO estaciones (examen_id, titulo, descripcion, duracion_minutos, orden, activo)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [newExamenId, estacion.titulo, estacion.descripcion, estacion.duracion_minutos, estacion.orden, estacion.activo]
        );
        const newEstacionId = inserted[0].id;

        for (const pregunta of estacion.preguntas.values()) {
          const insertedPregunta = await executeQuery(
            `INSERT INTO preguntas (estacion_id, texto, tipo, obligatoria, orden, valor_minimo, valor_maximo, puntaje)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
              newEstacionId,
              pregunta.texto,
              pregunta.tipo,
              pregunta.obligatoria,
              pregunta.orden,
              pregunta.valor_minimo,
              pregunta.valor_maximo,
              pregunta.puntaje,
            ]
          );
          const newPreguntaId = insertedPregunta[0].id;

          if (pregunta.opciones.length > 0) {
            const placeholders = [];
            const values = [];
            pregunta.opciones.forEach((op, i) => {
              const offset = i * 4;
              placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
              values.push(newPreguntaId, op.texto, op.es_correcta ?? false, op.orden || 0);
            });

            await executeQuery(
              `INSERT INTO opciones (pregunta_id, texto, es_correcta, orden) VALUES ${placeholders.join(", ")}`,
              values
            );
          }
        }
      }
    }

    await executeQuery("COMMIT");
    return NextResponse.json({ ids: newExamenIds }, { status: 201 });
  } catch (error: any) {
    try {
      await executeQuery("ROLLBACK");
    } catch (_) {}

    logger.error("❌ Error duplicando exámenes masivamente:", error);
    console.error("❌ Error atrapado en duplicar-masivo:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error inesperado duplicando exámenes" },
      { status: 500 }
    );
  }
}
