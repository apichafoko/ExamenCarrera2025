"use client"

import dynamic from "next/dynamic"

// Importar el componente dinámicamente con ssr: false para evitar problemas de hidratación
const DatabaseConnectionStatus = dynamic(
  () => import("@/components/database-connection-status-dynamic").then((mod) => mod.DatabaseConnectionStatus),
  { ssr: false },
)

export function DatabaseConnectionStatusWrapper() {
  return <DatabaseConnectionStatus />
}
