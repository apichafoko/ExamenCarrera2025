"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export function DatabaseConnectionStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [message, setMessage] = useState<string>("Verificando conexión a la base de datos...")
  const [availableVars, setAvailableVars] = useState<string[]>([])
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
        setAvailableVars(data.availableVars || [])
      } else {
        setStatus("error")
        setMessage(data.error || "No se pudo conectar a la base de datos")
        setAvailableVars(data.availableVars || [])
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
        {status === "connected" && availableVars.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-green-600">Variables de entorno disponibles: {availableVars.join(", ")}</p>
          </div>
        )}
        {status === "error" && (
          <div className="mt-2">
            <p className="text-sm mb-2">
              {availableVars.length > 0 ? (
                <>
                  Se encontraron variables de entorno ({availableVars.join(", ")}), pero no se pudo establecer la
                  conexión. Verifique que las credenciales sean correctas.
                </>
              ) : (
                <>
                  No se encontraron variables de entorno para la conexión a la base de datos. Asegúrese de que al menos
                  una de las siguientes variables esté configurada:
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>DATABASE_URL</li>
                    <li>POSTGRES_URL</li>
                    <li>POSTGRES_PRISMA_URL</li>
                    <li>POSTGRES_URL_NON_POOLING</li>
                  </ul>
                </>
              )}
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
