import { type NextRequest, NextResponse } from "next/server"
import { syncEvaluadoresWithUsers } from "@/lib/sync-users"
import logger from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const result = await syncEvaluadoresWithUsers()

    if (result.success) {
      return NextResponse.json({ message: result.message })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    logger.error("Error al sincronizar usuarios:", error)
    return NextResponse.json({ error: "Error al sincronizar usuarios" }, { status: 500 })
  }
}
