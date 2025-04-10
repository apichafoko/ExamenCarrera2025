import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function formatDate(dateString: string | Date): string {
  // Asegurarse de que la fecha se interprete correctamente sin ajustes de zona horaria
  const date = new Date(dateString)

  // Crear una nueva fecha usando los componentes UTC para evitar ajustes de zona horaria
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  const localDate = new Date(year, month, day)

  return localDate.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
