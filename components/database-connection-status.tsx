"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export function DatabaseConnectionStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [message, setMessage] = useState<string>("Verificando conexión a la base de datos...")
  const [isChecking, setIsChecking] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const checkConnection = async () => {
    if (isChecking || !isMounted) return

    try {
      setIsChecking(true)
      setStatus("loading")
      setMessage("Verificando conexión a la base de datos...")

      // Agregar un pequeño retraso aleatorio para evitar múltiples conexiones simultáneas
      const randomDelay = Math.floor(Math.random() * 300)
      await new Promise((resolve) => setTimeout(resolve, randomDelay))

      const response = await fetch("/api/test-db", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setStatus("connected")
        setMessage(data.message || "Conexión establecida correctamente")
      } else {
        setStatus("error")
        setMessage(data.error || "No se pudo conectar a la base de datos")
      }
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Error al verificar la conexión")
    } finally {
      setIsChecking(false)
    }
  }

  // Marcar el componente como montado
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Verificar la conexión después del montaje
  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => {
        checkConnection()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isMounted])

  if (!isMounted) {
    return null
  }

  return (
    <Alert variant={status === "connected" ? "default" : "destructive"} className="mb-4">
      <div className="flex items-center gap-2">
        {status === "connected" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertTitle>
          {status === "loading"
            ? "Verificando conexión..."
            : status === "connected"
              ? "Conexión a la base de datos establecida"
              : "Error de conexión a la base de datos"}
        </AlertTitle>
      </div>
      <AlertDescription className="mt-2">
        {message}
        {status === "error" && (
          <div className="mt-2">
            <p className="text-sm mb-2">
              {message.includes("DATABASE_URL")
                ? "La variable de entorno DATABASE_URL no está configurada. Debe configurar esta variable en su entorno de producción."
                : "Asegúrate de que la variable de entorno DATABASE_URL esté configurada correctamente."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkConnection()}
              disabled={isChecking}
              className="flex items-center gap-1"
            >
              {isChecking && <RefreshCw className="h-3 w-3 animate-spin" />}
              Verificar nuevamente
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
