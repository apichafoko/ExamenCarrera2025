"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Check, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { useAppContext } from "@/context/app-context"
import { useToast } from "@/components/ui/use-toast"

export function SyncStatus() {
  const { recargarDatos } = useAppContext()
  const { toast } = useToast()
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")

  // Función para sincronizar datos
  const handleSync = async () => {
    setSyncStatus("syncing")

    try {
      await recargarDatos()

      // Actualizar la hora de última sincronización
      const now = new Date()
      setLastSync(now)
      setSyncStatus("success")

      toast({
        title: "Sincronización completada",
        description: "Los datos se han sincronizado correctamente con la base de datos.",
      })
    } catch (error) {
      console.error("Error en sincronización:", error)
      setSyncStatus("error")

      toast({
        title: "Error de sincronización",
        description: "No se pudieron sincronizar los datos. Intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  // Formatear la fecha de última sincronización
  const formatLastSync = () => {
    if (!lastSync) return "Nunca"

    // Formatear fecha y hora
    return lastSync.toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <RefreshCw className="mr-2 h-5 w-5" />
          Estado de Sincronización
        </CardTitle>
        <CardDescription>Sincronización con la base de datos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Última sincronización:</span>
          <span className="text-sm">{formatLastSync()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Estado:</span>
          <div className="flex items-center">
            {syncStatus === "idle" && <span className="text-sm text-muted-foreground">Listo para sincronizar</span>}
            {syncStatus === "syncing" && (
              <span className="text-sm text-blue-500 flex items-center">
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                Sincronizando...
              </span>
            )}
            {syncStatus === "success" && (
              <span className="text-sm text-green-500 flex items-center">
                <Check className="mr-1 h-3 w-3" />
                Sincronizado
              </span>
            )}
            {syncStatus === "error" && (
              <span className="text-sm text-red-500 flex items-center">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Error
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSync} disabled={syncStatus === "syncing"} className="w-full">
          {syncStatus === "syncing" ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar Ahora
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
