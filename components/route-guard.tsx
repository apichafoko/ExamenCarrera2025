"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login"]

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading } = useAuth()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Función para verificar si la ruta actual requiere autenticación
    const authCheck = () => {
      // Si estamos en una ruta pública, permitir acceso
      if (publicRoutes.includes(pathname)) {
        setAuthorized(true)
        return
      }

      // Si el usuario está autenticado, permitir acceso
      if (isAuthenticated) {
        setAuthorized(true)
        return
      }

      // Si no está autenticado y no es ruta pública, redirigir al login
      setAuthorized(false)
      router.push("/login")
    }

    // No verificar hasta que se complete la carga de autenticación
    if (!loading) {
      authCheck()
    }
  }, [isAuthenticated, loading, pathname, router])

  // Mientras se verifica la autenticación, mostrar un indicador de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Si es una ruta pública o el usuario está autorizado, mostrar el contenido
  return authorized ? <>{children}</> : null
}
