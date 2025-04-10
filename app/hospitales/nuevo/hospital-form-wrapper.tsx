"use client"

import dynamic from "next/dynamic"

// Importar el componente dinámicamente con ssr: false para evitar problemas de hidratación
const HospitalFormClient = dynamic(() => import("./hospital-form-client").then((mod) => mod.HospitalFormClient), {
  ssr: false,
})

export function HospitalFormWrapper() {
  return <HospitalFormClient />
}
