"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, Database, Save, CheckCircle2, AlertCircle } from "lucide-react"
import { syncAllData, syncAlumnos, syncHospitales, syncExamenes } from "@/lib/sync-service"
import { useToast } from "@/components/ui/use-toast"

export function SyncManager() {
  const { toast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")

  useEffect(() => {
    // Cargar la última hora de sincronización desde localStorage
    const storedLastSyncTime = localStorage.getItem("lastSyncTime")
    if (storedLastSyncTime) {
      setLastSyncTime(storedLastSyncTime)
    }
  }, [])

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      setSyncStatus("syncing")
      setSyncProgress(0)

      // Sincronizar hospitales
      setSyncProgress(20)
      const hospitalesResult = await syncHospitales()
      if (!hospitalesResult.success) {
        throw new Error("Error sincronizando hospitales")
      }

      // Sincronizar alumnos
      setSyncProgress(40)
      const alumnosResult = await syncAlumnos()
      if (!alumnosResult.success) {
        throw new Error("Error sincronizando alumnos")
      }

      // Sincronizar exámenes
      setSyncProgress(80)
      const examenesResult = await syncExamenes()
      if (!examenesResult.success) {
        throw new Error("Error sincronizando exámenes")
      }

      // Actualizar la hora de la última sincronización
      const now = new Date().toISOString()
      localStorage.setItem("lastSyncTime", now)
      setLastSyncTime(now)

      setSyncProgress(100)
      setSyncStatus("success")

      toast({
        title: "Sincronización completada",
        description: "Todos los datos han sido sincronizados correctamente.",
      })
    } catch (error) {
      console.error("Error en la sincronización:", error)
      setSyncStatus("error")
      toast({
        title: "Error de sincronización",
        description: "Ha ocurrido un error durante la sincronización de datos.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
      // Resetear el progreso después de un tiempo
      setTimeout(() => {
        if (syncStatus === "success") {
          setSyncProgress(0)
          setSyncStatus("idle")
        }
      }, 3000)
    }
  }

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true)
      setSyncStatus("syncing")
      setSyncProgress(10)

      // Sincronizar todos los datos
      const result = await syncAllData()

      if (result.success) {
        // Actualizar la hora de la última sincronización
        const now = new Date().toISOString()
        localStorage.setItem("lastSyncTime", now)
        setLastSyncTime(now)

        setSyncProgress(100)
        setSyncStatus("success")

        toast({
          title: "Sincronización completada",
          description: "Todos los datos han sido sincronizados correctamente.",
        })
      } else {
        throw new Error("Error sincronizando datos")
      }
    } catch (error) {
      console.error("Error en la sincronización:", error)
      setSyncStatus("error")
      toast({
        title: "Error de sincronización",
        description: "Ha ocurrido un error durante la sincronización de datos.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
      // Resetear el progreso después de un tiempo
      setTimeout(() => {
        if (syncStatus === "success") {
          setSyncProgress(0)
          setSyncStatus("idle")
        }
      }, 3000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Sincronización de Datos
            </CardTitle>
            <CardDescription>
              Sincroniza los datos entre el almacenamiento local y la base de datos PostgreSQL
            </CardDescription>
          </div>
          <Badge
            variant={
              syncStatus === "success"
                ? "default"
                : syncStatus === "error"
                  ? "destructive"
                  : syncStatus === "syncing"
                    ? "secondary"
                    : "outline"
            }
          >
            {syncStatus === "success" && (
              <span className="flex items-center">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Sincronizado
              </span>
            )}
            {syncStatus === "error" && (
              <span className="flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                Error
              </span>
            )}
            {syncStatus === "syncing" && (
              <span className="flex items-center">
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                Sincronizando
              </span>
            )}
            {syncStatus === "idle" && "No sincronizado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncStatus === "syncing" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}

        <div className="text-sm">
          {lastSyncTime ? (
            <p>
              Última sincronización:{" "}
              {new Date(lastSyncTime).toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          ) : (
            <p>No hay registros de sincronización previa</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sincronizar por Pasos
        </Button>
        <Button onClick={handleSyncAll} disabled={isSyncing}>
          {isSyncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sincronizar Todo
        </Button>
      </CardFooter>
    </Card>
  )
}

export default SyncManager
