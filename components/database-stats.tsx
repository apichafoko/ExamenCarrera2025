"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { executeQuery } from "@/lib/db"

type DatabaseStats = {
  alumnos: number
  hospitales: number
  evaluadores: number
  examenes: number
  grupos: number
  examenesCompletados: number
  examenesEnProgreso: number
  examenesAsignados: number
}

export function DatabaseStats() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)

        // Obtener estadísticas de la base de datos
        const [alumnosResult] = await executeQuery("SELECT COUNT(*) as count FROM alumnos")
        const [hospitalesResult] = await executeQuery("SELECT COUNT(*) as count FROM hospitales")
        const [evaluadoresResult] = await executeQuery("SELECT COUNT(*) as count FROM evaluadores")
        const [examenesResult] = await executeQuery("SELECT COUNT(*) as count FROM examenes")
        const [gruposResult] = await executeQuery("SELECT COUNT(*) as count FROM grupos")

        const [examenesCompletadosResult] = await executeQuery(
          "SELECT COUNT(*) as count FROM alumnos_examenes WHERE estado = 'Completado'",
        )

        const [examenesEnProgresoResult] = await executeQuery(
          "SELECT COUNT(*) as count FROM alumnos_examenes WHERE estado = 'En Progreso'",
        )

        const [examenesAsignadosResult] = await executeQuery(
          "SELECT COUNT(*) as count FROM alumnos_examenes WHERE estado = 'Pendiente'",
        )

        setStats({
          alumnos: Number.parseInt(alumnosResult.count),
          hospitales: Number.parseInt(hospitalesResult.count),
          evaluadores: Number.parseInt(evaluadoresResult.count),
          examenes: Number.parseInt(examenesResult.count),
          grupos: Number.parseInt(gruposResult.count),
          examenesCompletados: Number.parseInt(examenesCompletadosResult.count),
          examenesEnProgreso: Number.parseInt(examenesEnProgresoResult.count),
          examenesAsignados: Number.parseInt(examenesAsignadosResult.count),
        })

        setError(null)
      } catch (err) {
        console.error("Error obteniendo estadísticas:", err)
        setError("Error al cargar las estadísticas de la base de datos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Alumnos</CardTitle>
          <CardDescription>Total registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.alumnos || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Hospitales</CardTitle>
          <CardDescription>Total registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.hospitales || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Evaluadores</CardTitle>
          <CardDescription>Total registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.evaluadores || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Exámenes</CardTitle>
          <CardDescription>Total registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.examenes || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Grupos</CardTitle>
          <CardDescription>Total registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.grupos || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Exámenes Completados</CardTitle>
          <CardDescription>Total finalizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.examenesCompletados || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Exámenes En Progreso</CardTitle>
          <CardDescription>Actualmente en curso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.examenesEnProgreso || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Exámenes Pendientes</CardTitle>
          <CardDescription>Asignados sin iniciar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.examenesAsignados || 0}</div>
        </CardContent>
      </Card>
    </div>
  )
}
