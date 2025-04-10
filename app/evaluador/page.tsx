"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ClipboardList, CheckCircle, Clock, Calendar } from "lucide-react"

export default function EvaluadorPage() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [examenes, setExamenes] = useState<any[]>([])
  const [filtroEstado, setFiltroEstado] = useState<string>("Pendiente")

  useEffect(() => {
    if (!user) {
      return
    }

    const cargarExamenes = async () => {
      setIsLoading(true)
      try {
        // Asegurarse de que user.id es el ID del evaluador, no del alumno
        if (!user || user.rol !== "evaluador") {
          console.error("Usuario no es evaluador o no tiene ID válido:", user)
          toast({
            title: "Error",
            description: "No tienes permisos de evaluador",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        console.log("Cargando exámenes para evaluador ID:", user.id)
        const response = await fetch(`/api/evaluador/examenes?evaluadorId=${user.id}&estado=${filtroEstado}`)
        if (response.ok) {
          const data = await response.json()
          setExamenes(data)
        } else {
          toast({
            title: "Error",
            description: "No se pudieron cargar los exámenes asignados",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error al cargar exámenes:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los exámenes",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    cargarExamenes()
  }, [user, filtroEstado, toast])

  const handleTomarExamen = (id: number) => {
    router.push(`/evaluador/tomar-examen/${id}`)
  }

  const handleEditarExamen = (id: number) => {
    router.push(`/evaluador/editar-examen/${id}`)
  }

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case "Pendiente":
        return "outline"
      case "En Progreso":
        return "secondary"
      case "Completado":
        return "default"
      default:
        return "outline"
    }
  }

  const getBadgeIcon = (estado: string) => {
    switch (estado) {
      case "Pendiente":
        return <ClipboardList className="h-3 w-3 mr-1" />
      case "En Progreso":
        return <Clock className="h-3 w-3 mr-1" />
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
              <CardTitle className="text-2xl">Panel de Evaluador</CardTitle>
              <CardDescription>Gestiona los exámenes asignados para evaluación</CardDescription>
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente">Pendientes</SelectItem>
                <SelectItem value="En Progreso">En Progreso</SelectItem>
                <SelectItem value="Completado">Completados</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : examenes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay exámenes {filtroEstado ? `en estado "${filtroEstado}"` : ""} asignados a tu cuenta.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Alumno</TableHead>
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
                    <TableCell>
                      {examen.alumno_nombre} {examen.alumno_apellido}
                    </TableCell>
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
                        {examen.fecha_inicio ? new Date(examen.fecha_inicio).toLocaleDateString() : "No iniciado"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {examen.estado === "Pendiente" && (
                        <Button size="sm" onClick={() => handleTomarExamen(examen.id)}>
                          Tomar Examen
                        </Button>
                      )}
                      {examen.estado === "En Progreso" && (
                        <Button size="sm" onClick={() => handleTomarExamen(examen.id)}>
                          Continuar
                        </Button>
                      )}
                      {examen.estado === "Completado" && (
                        <Button size="sm" variant="outline" onClick={() => handleEditarExamen(examen.id)}>
                          Ver Resultados
                        </Button>
                      )}
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
