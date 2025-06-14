
/**
 * Página principal para la gestión de grupos en la aplicación.
 *
 * Esta página permite a los usuarios visualizar, buscar, filtrar, actualizar y eliminar grupos.
 * Además, proporciona acceso a la creación de nuevos grupos y a los detalles de cada grupo.
 *
 * ## Funcionalidades principales:
 * - **Visualización de grupos**: Muestra una lista de grupos con información básica como nombre, descripción,
 *   estado (activo/inactivo), cantidad de alumnos y fecha de creación.
 * - **Búsqueda**: Permite buscar grupos por nombre o descripción utilizando un campo de texto.
 * - **Filtrado por estado**: Los usuarios pueden filtrar los grupos por estado (activos, inactivos o todos).
 * - **Actualización de datos**: Incluye un botón para recargar la lista de grupos desde el servidor.
 * - **Eliminación de grupos**: Los usuarios pueden eliminar grupos, siempre que no tengan alumnos asignados.
 * - **Navegación**: Los usuarios pueden acceder a los detalles de un grupo o a la página para crear un nuevo grupo.
 *
 * ## Componentes utilizados:
 * - **UI Components**: Utiliza componentes personalizados como `Button`, `Card`, `Input`, `Select`, `HoverCard`, y más,
 *   para construir una interfaz de usuario consistente y accesible.
 * - **Icons**: Usa íconos de la librería `lucide-react` para mejorar la experiencia visual.
 * - **Toast Notifications**: Muestra notificaciones para informar al usuario sobre errores, éxitos o advertencias.
 *
 * ## Estado de la página:
 * - `grupos`: Lista de grupos obtenida desde el servidor.
 * - `searchTerm`: Término de búsqueda ingresado por el usuario.
 * - `statusFilter`: Filtro de estado seleccionado por el usuario (todos, activos, inactivos).
 * - `isLoading`: Indica si los datos están siendo cargados desde el servidor.
 * - `error`: Mensaje de error en caso de que ocurra un problema al cargar los datos.
 *
 * ## Funciones principales:
 * - `cargarGrupos`: Realiza una solicitud al servidor para obtener la lista de grupos.
 * - `handleEliminar`: Elimina un grupo específico si no tiene alumnos asignados.
 * - `formatFechaOTexto`: Formatea una fecha o devuelve un texto alternativo si la fecha no está disponible.
 *
 * ## Comportamiento:
 * - Al cargar la página, se ejecuta `cargarGrupos` para obtener los datos iniciales.
 * - Los usuarios pueden interactuar con los filtros y el campo de búsqueda para ajustar la lista de grupos mostrada.
 * - Los errores se manejan mostrando mensajes en un componente `Card` y mediante notificaciones.
 *
 * ## Navegación:
 * - Botón "Nuevo Grupo": Redirige a la página `/grupos/new` para crear un nuevo grupo.
 * - Al hacer clic en un grupo, se redirige a la página de detalles del grupo correspondiente (`/grupos/:id`).
 *
 * ## Restricciones:
 * - Los grupos con alumnos asignados no pueden ser eliminados. Esto se indica visualmente y con un mensaje en un `HoverCard`.
 *
 * ## Notas adicionales:
 * - La página utiliza la API de grupos (`/api/grupos`) para obtener, eliminar y gestionar los datos.
 * - Se asegura de que las solicitudes no se almacenen en caché configurando los encabezados HTTP correspondientes.
 */
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  PlusCircle,
  Search,
  Users,
  RefreshCw,
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Lock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { cn, formatDate } from "@/lib/utils"
import logger from "@/lib/logger"


export default function GruposPage() {
  const [grupos, setGrupos] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const cargarGrupos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/grupos", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      const data = await response.json()
      if (Array.isArray(data)) {
        setGrupos(data)
      } else {
        setGrupos([])
        setError("Los datos recibidos no tienen el formato esperado")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error desconocido")
      toast({
        title: "Error al cargar grupos",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      setGrupos([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarGrupos()
  }, [])

  const handleEliminar = async (id: number) => {
    try {
      const response = await fetch(`/api/grupos/${id}`, {
        method: "DELETE",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      })
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error: ${response.status}`)
      }
  
      setGrupos((prev) => prev.filter((grupo) => grupo.id !== id))
      toast({
        title: "Grupo Eliminado",
        description: "El grupo ha sido eliminado correctamente.",
      })
  
      // Redirect to the groups list page
      router.push("/grupos")
    } catch (error) {
      logger.error("Error eliminando grupo:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el grupo",
        variant: "destructive",
      })
    }
  }

  const filteredGrupos = grupos.filter((grupo) => {
    const nombre = grupo.nombre || ""
    const descripcion = grupo.descripcion || ""
    const activo = grupo.activo !== undefined ? grupo.activo : true

    const matchesSearch =
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descripcion.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "todos" || (statusFilter === "activos" && activo) || (statusFilter === "inactivos" && !activo)

    return matchesSearch && matchesStatus
  })

  const formatFechaOTexto = (fecha: string | null | undefined, textoAlternativo = "Sin fecha") => {
    if (!fecha) return textoAlternativo
    try {
      return formatDate(fecha)
    } catch (error) {
      return textoAlternativo
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Grupos</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={cargarGrupos} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isLoading ? "Actualizando..." : "Actualizar"}
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Grupo
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive mb-6">
          <CardHeader>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
              <CardTitle className="text-destructive">Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-2 text-sm">Verifica la conexión a la base de datos e intenta nuevamente.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={cargarGrupos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="search"
                placeholder="Buscar grupos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status">Estado</Label>
            <Select defaultValue={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="inactivos">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredGrupos.length === 0 ? (
            <div className="text-center py-10">
              {searchTerm || statusFilter !== "todos"
                ? "No se encontraron grupos que coincidan con los criterios de búsqueda."
                : "No hay grupos registrados. Crea uno nuevo para comenzar."}
            </div>
          ) : (
            filteredGrupos.map((grupo) => (
              <Card
                key={grupo.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/grupos/${grupo.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{grupo.nombre || "Sin nombre"}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {grupo.activo !== undefined ? (
                        grupo.activo ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">Activo</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">Inactivo</span>
                          </div>
                        )
                      ) : null}

                      <HoverCard openDelay={200}>
                        <HoverCardTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={grupo.cant_alumnos > 0}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEliminar(grupo.id)
                            }}
                            className={cn(
                              "text-destructive",
                              grupo.cant_alumnos > 0 && "cursor-not-allowed opacity-50",
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-[260px] text-sm" side="left" align="start" sideOffset={10}>
                          {grupo.cant_alumnos > 0
                            ? "No se puede eliminar este grupo porque tiene alumnos asignados."
                            : "Este grupo puede eliminarse"}
                        </HoverCardContent>
                      </HoverCard>

                      {grupo.cant_alumnos > 0 && (
                        <div className="flex items-center space-x-1 text-muted-foreground text-xs">
                          <Lock className="h-3 w-3" />
                          <Badge variant="secondary">No eliminable</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardDescription>{grupo.descripcion || "Sin descripción"}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{grupo.cant_alumnos || 0} alumnos</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatFechaOTexto(grupo.fecha_creacion)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
