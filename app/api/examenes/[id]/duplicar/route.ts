import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import logger from "@/lib/logger";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID del examen inválido" }, { status: 400 });
    }

    const { fecha_aplicacion } = await request.json();
    if (!fecha_aplicacion) {
      return NextResponse.json({ error: "Fecha de aplicación requerida" }, { status: 400 });
    }

    // Validar la fecha
    const newDate = new Date(fecha_aplicacion);
    if (isNaN(newDate.getTime())) {
      return NextResponse.json({ error: "Fecha de aplicación inválida" }, { status: 400 });
    }

    console.log(`Duplicando examen ID ${id} para la fecha ${fecha_aplicacion}`);
    logger.info(`Duplicando examen ID ${id} para la fecha ${fecha_aplicacion}`);

    // Iniciar transacción
    await executeQuery("BEGIN");

    // 1. Obtener el examen original
    const examenQuery = `SELECT * FROM examenes WHERE id = $1`;
    const examenResult = await executeQuery(examenQuery, [id]);
    if (examenResult.length === 0) {
      throw new Error("Examen no encontrado");
    }
    const examen = examenResult[0];

    // 2. Crear el nuevo examen
    const newExamenQuery = `
      INSERT INTO examenes (titulo, descripcion, fecha_aplicacion, estado)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const newExamenResult = await executeQuery(newExamenQuery, [
      `${examen.titulo} (${formatDate(newDate)})`,
      examen.descripcion || null,
      newDate.toISOString(),
      examen.estado,
    ]);
    const newExamenId = newExamenResult[0].id;

    // 3. Duplicar estaciones
    const estacionesQuery = `SELECT * FROM estaciones WHERE examen_id = $1`;
    const estaciones = await executeQuery(estacionesQuery, [id]);

    const estacionIdMap = new Map<number, number>(); // Mapa de IDs antiguos a nuevos

    for (const estacion of estaciones) {
      const newEstacionQuery = `
        INSERT INTO estaciones (examen_id, titulo, descripcion, duracion_minutos, orden, activo)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      const newEstacionResult = await executeQuery(newEstacionQuery, [
        newExamenId,
        estacion.titulo,
        estacion.descripcion || null,
        estacion.duracion_minutos,
        estacion.orden || 0,
        estacion.activo ?? true,
      ]);
      const newEstacionId = newEstacionResult[0].id;
      estacionIdMap.set(estacion.id, newEstacionId);

      // 4. Duplicar preguntas
      const preguntasQuery = `SELECT * FROM preguntas WHERE estacion_id = $1`;
      const preguntas = await executeQuery(preguntasQuery, [estacion.id]);

      const newPreguntaIds: number[] = [];
      for (const pregunta of preguntas) {
        const newPreguntaQuery = `
          INSERT INTO preguntas (estacion_id, texto, tipo, obligatoria, orden, valor_minimo, valor_maximo, puntaje)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;
        const newPreguntaResult = await executeQuery(newPreguntaQuery, [
          newEstacionId,
          pregunta.texto,
          pregunta.tipo,
          pregunta.obligatoria ?? false,
          pregunta.orden || 0,
          pregunta.valor_minimo || null,
          pregunta.valor_maximo || null,
          pregunta.puntaje || null,
        ]);
        const newPreguntaId = newPreguntaResult[0].id;
        newPreguntaIds.push(newPreguntaId);

        // 5. Duplicar opciones
        const opcionesQuery = `SELECT * FROM opciones WHERE pregunta_id = $1`;
        const opciones = await executeQuery(opcionesQuery, [pregunta.id]);

        for (const opcion of opciones) {
          const newOpcionQuery = `
            INSERT INTO opciones (pregunta_id, texto, es_correcta, orden)
            VALUES ($1, $2, $3, $4)
          `;
          await executeQuery(newOpcionQuery, [
            newPreguntaId,
            opcion.texto,
            opcion.es_correcta ?? false,
            opcion.orden || 0,
          ]);
        }
      }

      // 6. Calcular y actualizar puntaje_maximo de la estación
      const puntajeMaximoQuery = `
        SELECT COALESCE(SUM(puntaje), 0) as puntaje_maximo
        FROM preguntas
        WHERE estacion_id = $1 AND puntaje IS NOT NULL
      `;
      const puntajeMaximoResult = await executeQuery(puntajeMaximoQuery, [newEstacionId]);
      const puntajeMaximo = Number.parseFloat(puntajeMaximoResult[0].puntaje_maximo);

      const updatePuntajeMaximoQuery = `
        UPDATE estaciones
        SET puntaje_maximo = $1
        WHERE id = $2
      `;
      await executeQuery(updatePuntajeMaximoQuery, [puntajeMaximo, newEstacionId]);
    }

    // 7. Duplicar evaluadores
    const evaluadoresQuery = `SELECT * FROM examenes_evaluadores WHERE examen_id = $1`;
    const evaluadores = await executeQuery(evaluadoresQuery, [id]);

    for (const evaluador of evaluadores) {
      const newEvaluadorQuery = `
        INSERT INTO examenes_evaluadores (examen_id, evaluador_id)
        VALUES ($1, $2)
      `;
      await executeQuery(newEvaluadorQuery, [newExamenId, evaluador.evaluador_id]);
    }

    // Confirmar transacción
    await executeQuery("COMMIT");

    logger.info(`Examen ID ${id} duplicado exitosamente como ID ${newExamenId}`);
    return NextResponse.json({ id: newExamenId }, { status: 201 });
  } catch (error) {
    await executeQuery("ROLLBACK");
    logger.error(`Error duplicando examen ID ${params.id}:`, error);
    const message = error instanceof Error ? error.message : "Error desconocido al duplicar el examen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
