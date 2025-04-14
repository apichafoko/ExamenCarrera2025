"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, Calendar } from "lucide-react"

export default function ExamenesCompletadosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [examenes, setExamenes] = useState<any[]>([])
  const filtroEstado = "Completado" // Pre-set filter to "Completado"
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      setError("No hay usuario autenticado")
      return
    }

    if (!user.id) {
      setIsLoading(false)
      setError("El usuario no tiene un ID válido")
      return
    }

    const cargarExamenes = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log(`Cargando exámenes para el usuario con ID: ${user.id}`)

        // Obtener el evaluador por ID de usuario - CORREGIDO: URL y parámetro
        const evaluadorResponse = await fetch(`/api/evaluadores/by-id?userId=${user.id}`)

        if (!evaluadorResponse.ok) {
          const errorText = await evaluadorResponse.text()
          console.error("Respuesta completa del error:", errorText)

          let errorMessage
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || `Error ${evaluadorResponse.status}: ${evaluadorResponse.statusText}`
          } catch (e) {
            errorMessage = `Error ${evaluadorResponse.status}: ${evaluadorResponse.statusText}`
          }

          if (evaluadorResponse.status === 404) {
            throw new Error(`No se encontró un evaluador para este usuario (ID: ${user.id})`)
          } else {
            throw new Error(`Error al obtener el evaluador: ${errorMessage}`)
          }
        }

        let evaluador
        try {
          evaluador = await evaluadorResponse.json()
        } catch (e) {
          console.error("Error al parsear la respuesta JSON del evaluador:", e)
          throw new Error("Error al procesar la respuesta del servidor")
        }

        console.log(`Evaluador encontrado con ID: ${evaluador.id}`)

        // Obtener los exámenes del evaluador
        let url = `/api/evaluadores/${evaluador.id}/examenes`
        if (filtroEstado !== "todos") {
          url += `?estado=${filtroEstado}`
        }

        const examenesResponse = await fetch(url)

        if (!examenesResponse.ok) {
          const errorText = await examenesResponse.text()
          console.error("Respuesta completa del error:", errorText)

          let errorMessage
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || `Error ${examenesResponse.status}: ${examenesResponse.statusText}`
          } catch (e) {
            errorMessage = `Error ${examenesResponse.status}: ${examenesResponse.statusText}`
          }

          throw new Error(`Error al obtener los exámenes: ${errorMessage}`)
        }

        let examenesData
        try {
          examenesData = await examenesResponse.json()
        } catch (e) {
          console.error("Error al parsear la respuesta JSON de los exámenes:", e)
          throw new Error("Error al procesar la respuesta del servidor")
        }

        console.log(`Exámenes cargados: ${examenesData.length}`)
        setExamenes(examenesData)
      } catch (error) {
        console.error("Error al cargar exámenes:", error)
        setError(error instanceof Error ? error.message : "Error desconocido al cargar exámenes")
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Ocurrió un error al cargar los exámenes",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    cargarExamenes()
  }, [user, filtroEstado, toast])

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case "Completado":
        return "default"
      default:
        return "outline"
    }
  }

  const getBadgeIcon = (estado: string) => {
    switch (estado) {
      case "Completado":
        return <CheckCircle className="h-3 w-3 mr-1" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Exámenes Completados</CardTitle>
              <CardDescription>Gestiona los exámenes asignados para evaluación</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : examenes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay exámenes completados asignados a tu cuenta.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Examen</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examenes.map((examen) => (
                  <TableRow key={examen.id}>
                    <TableCell className="font-medium">#{examen.alumno_id}</TableCell>
                    <TableCell>{examen.examen_titulo}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(examen.estado)} className="flex w-fit items-center">
                        {getBadgeIcon(examen.estado)}
                        {examen.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {examen.fecha_aplicacion
                          ? new Date(examen.fecha_aplicacion).toLocaleDateString()
                          : "No iniciado"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/evaluador/resultados/${examen.id}`)}
                      >
                        Ver Resultados
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
