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
import { Loader2, ClipboardList, CheckCircle, Clock, Calendar, AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import logger from "@/lib/logger"


export default function TomarExamenPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [examenes, setExamenes] = useState<any[]>([])
  const [filtroEstado, setFiltroEstado] = useState<string>("Pendiente")
  const [error, setError] = useState<string | null>(null)
  const [filtroId, setFiltroId] = useState<string>("")
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false) // Estado para el modal

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
        logger.log(`Cargando exámenes para el usuario con ID: ${user.id}`)
        const evaluadorResponse = await fetch(`/api/evaluadores/by-id?userId=${user.id}`)

        if (!evaluadorResponse.ok) {
          const errorText = await evaluadorResponse.text()
          logger.error("Respuesta completa del error:", errorText)
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
          logger.error("Error al parsear la respuesta JSON del evaluador:", e)
          throw new Error("Error al procesar la respuesta del servidor")
        }

        logger.log(`Evaluador encontrado con ID: ${evaluador.id}`)
        let url = `/api/evaluadores/${evaluador.id}/examenes`
        if (filtroEstado !== "todos") {
          url += `?estado=${filtroEstado}`
        }

        const examenesResponse = await fetch(url)

        if (!examenesResponse.ok) {
          const errorText = await examenesResponse.text()
          logger.error("Respuesta completa del error:", errorText)
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
          logger.error("Error al parsear la respuesta JSON de los exámenes:", e)
          throw new Error("Error al procesar la respuesta del servidor")
        }

        logger.log(`Exámenes cargados: ${examenesData.length}`)
        setExamenes(examenesData)
      } catch (error) {
        logger.error("Error al cargar exámenes:", error)
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

  const handleTomarExamen = (id: number) => {
    // Buscar el examen correspondiente al ID
    const examen = examenes.find((ex) => ex.id === id)
    
    // Verificar si numero_identificacion es null, undefined o una cadena vacía
    if (!examen?.numero_identificacion) {
      setShowErrorModal(true) // Mostrar el modal de error
      return
    }

    // Si tiene número de identificación, redirigir
    logger.log(`Redirigiendo a /tomar-examen/${id}`)
    router.push(`/tomar-examen/${id}`)
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

  if (error && error.includes("No se encontró un evaluador")) {
    return (
      <div className="container mx-auto p-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-amber-600">Acceso restringido</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No tienes permisos de evaluador</AlertTitle>
              <AlertDescription>
                <p>Tu cuenta no está registrada como evaluador en el sistema.</p>
                <p className="mt-2">
                  Si crees que esto es un error, contacta al administrador para que te asigne el rol de evaluador.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && error.includes("base de datos")) {
    return (
      <div className="container mx-auto p-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">Error de conexión</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de base de datos</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
                <p className="mt-2">
                  Por favor, verifica la conexión a la base de datos y asegúrate de que las variables de entorno estén
                  configuradas correctamente.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Estaciones Asignadas</CardTitle>
              <CardDescription>Gestiona las estaciones asignadas para evaluación</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filtrar por ID"
                  value={filtroId}
                  onChange={(e) => setFiltroId(e.target.value)}
                  className="h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                {filtroId && (
                  <button
                    onClick={() => setFiltroId("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  window.location.reload()
                }}
              >
                Reintentar
              </Button>
            </div>
          ) : examenes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>
                No hay exámenes {filtroEstado !== "todos" ? `en estado "${filtroEstado}"` : ""} asignados a tu cuenta.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Estación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examenes
                  .filter((examen) =>
                    filtroId
                      ? examen.numero_identificacion && examen.numero_identificacion.toString().includes(filtroId)
                      : true,
                  )
                  .map((examen) => (
                    <TableRow key={examen.id}>
                      <TableCell className="font-medium">
                        {examen.numero_identificacion ? `#${examen.numero_identificacion}` : "Sin asignar"}
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
                          {examen.fecha_aplicacion
                            ? new Date(examen.fecha_aplicacion).toLocaleDateString()
                            : "No iniciado"}
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/evaluador/resultados/${examen.id}`)}
                          >
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

      {/* Modal de error */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              El alumno no tiene número (de cofia) asignado. Por favor, asigna un número antes de tomar el examen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowErrorModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
