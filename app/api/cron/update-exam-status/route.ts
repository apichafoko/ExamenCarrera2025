import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import logger from "@/lib/logger";

const CRON_SECRET = process.env.CRON_SECRET || "tu-clave-secreta";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      logger.warn("Intento de acceso no autorizado a la ruta de actualización de estado de exámenes");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    logger.info("Iniciando actualización de estado de exámenes");

    const updateQuery = `
      UPDATE examenes
      SET estado = 'INACTIVO'
      WHERE fecha_aplicacion < CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Buenos_Aires'      
      AND estado != 'INACTIVO'
      RETURNING id, titulo, fecha_aplicacion`;

    const updatedExams = await executeQuery(updateQuery, []);

    logger.info(`Actualizados ${updatedExams.length} exámenes a estado INACTIVO`, {
      updatedExams: updatedExams.map((exam: any) => ({
        id: exam.id,
        titulo: exam.titulo,
        fecha_aplicacion: exam.fecha_aplicacion,
      })),
    });

    return NextResponse.json({
      message: `Se han actualizdo ${updatedExams.length} exámenes a estado INACTIVO`,
      updatedExams,
    }, { status: 200 });
  } catch (error) {
    logger.error("Error al actualizar el estado de los exámenes:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al actualizar exámenes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
