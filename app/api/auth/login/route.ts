import { type NextRequest, NextResponse } from "next/server";
import { verificarCredenciales } from "@/lib/auth-service";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Correo electrónico y contraseña son requeridos" }, { status: 400 });
    }

    console.log(`Intento de login para: ${email}`);

    const usuario = await verificarCredenciales(email, password);

    if (!usuario) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Ejecutar actualización de estado de exámenes en segundo plano
    fetch(`/api/cron/update-exam-status`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    }).catch((error) => {
      logger.error("Error al actualizar estado de exámenes durante login:", error);
    });

    // Devolver los datos del usuario (sin la contraseña)
    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error en la API de login:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
