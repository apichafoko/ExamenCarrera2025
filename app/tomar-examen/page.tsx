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
import { evaluadoresService } from "@/lib/db-service"
import { Loader2, ClipboardList, CheckCircle, Clock, Calendar, AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function TomarExamenPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [examenes, setExamenes] = useState<any[]>([])
  const [filtroEstado, setFiltroEstado] = useState<string>("Pendiente")
  const [error, setError] = useState<string | null>(null)
  // Agregar un nuevo estado para el filtro de ID
  const [filtroId, setFiltroId] = useState<string>("")

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      setError("No hay usuario autenticado")
      return
    }

    if (user.id === null || user.id === undefined) {
      setIsLoading(false)
      setError("El usuario no tiene un ID válido")
      return
    }

    const cargarExamenes = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Usar la API de evaluador para obtener los exámenes asignados

        // EN ESTA PARTE: Obtener el ID del evaluador asociado al usuario
        console.log(`Cargando evaluador para usuario ID: ${user.id}`)
        const evaluador = await evaluadoresService.getByUserId(user.id) // Método a agregar en evaluadoresService
        if (!evaluador) {
          throw new Error("No se encontró un evaluador asociado a este usuario")
        }
        const evaluadorId = evaluador.id
        console.log(`Evaluador encontrado con ID: ${evaluadorId}, cargando exámenes con estado: ${filtroEstado}`)

        // Construir la URL con el parámetro de estado correcto usando el evaluadorId
        let url = `/api/evaluador/examenes?evaluadorId=${evaluadorId}`

        // Solo añadir el parámetro de estado si no es "todos"
        if (filtroEstado !== "todos") {
          url += `&estado=${filtroEstado}`
        }

        const response = await fetch(url)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`Exámenes cargados: ${data.length}`)

        // Verificar que los exámenes cargados coincidan con el filtro seleccionado
        const examenesFiltered =
          filtroEstado === "todos" ? data : data.filter((examen: any) => examen.estado === filtroEstado)

        setExamenes(examenesFiltered)
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

  const handleTomarExamen = (id: number) => {
    // Pasar el ID del alumno_examen a la página de detalle
    console.log(`Redirigiendo a /tomar-examen/${id}`)
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

  // Manejar el caso específico de DATABASE_URL no configurado
  if (error && error.includes("DATABASE_URL")) {
    return (
      <div className="container mx-auto p-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">Error de configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error crítico de base de datos</AlertTitle>
              <AlertDescription>
                La variable de entorno DATABASE_URL no está configurada. Esta variable es necesaria para conectarse a la
                base de datos.
                <div className="mt-4">
                  <p className="text-sm font-medium">Para solucionar este problema:</p>
                  <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm">
                    <li>Vaya a la configuración de su proyecto en Vercel</li>
                    <li>Navegue a la sección "Environment Variables"</li>
                    <li>Agregue la variable DATABASE_URL con el valor de su conexión a Neon Database</li>
                    <li>Redespliege la aplicación</li>
                  </ol>
                </div>
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
              <CardTitle className="text-2xl">Exámenes Asignados</CardTitle>
              <CardDescription>Gestiona los exámenes asignados para evaluación</CardDescription>
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
                  // Intentar recargar la página
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
                  <TableHead>Examen</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examenes
                  .filter((examen) => (filtroId ? examen.alumno_id.toString().includes(filtroId) : true))
                  .map((examen) => (
                    <TableRow key={examen.alumno_id}>
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
                          {examen.fecha_examen ? new Date(examen.fecha_examen).toLocaleDateString() : "No iniciado"}
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
                            onClick={() =>
                              router.push(`/examenes/${examen.examen_id}/resultados?alumnoId=${examen.alumno_id}`)
                            }
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
    </div>
  )
}
