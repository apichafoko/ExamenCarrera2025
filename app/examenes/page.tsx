
/**
 * Página principal para la gestión de exámenes.
 *
 * Esta página permite a los usuarios visualizar, buscar, filtrar y gestionar exámenes
 * en diferentes estados (activos, inactivos, próximos, recientes, etc.). 
 * También incluye funcionalidades para actualizar la lista de exámenes y crear nuevos.
 *
 * ## Funcionalidades principales:
 * 
 * - **Carga de exámenes:** 
 *   - Se realiza una solicitud a la API `/api/examenes` para obtener la lista de exámenes.
 *   - Los datos se procesan y se agrupan por fecha para facilitar su visualización.
 *   - Manejo de errores en caso de fallos en la solicitud.
 *
 * - **Búsqueda y filtrado:**
 *   - Los usuarios pueden buscar exámenes por título o descripción.
 *   - Los exámenes se pueden filtrar por estado (`activo`, `inactivo`, `todos`).
 *
 * - **Tabs de navegación:**
 *   - **Todos:** Muestra todos los exámenes que coincidan con los criterios de búsqueda y filtro.
 *   - **Recientes:** Muestra exámenes realizados en los últimos 30 días.
 *   - **Próximos:** Muestra exámenes programados para fechas futuras.
 *
 * - **Visualización de exámenes:**
 *   - Los exámenes se agrupan por fecha y se muestran en un componente `Accordion`.
 *   - Cada examen se representa como una tarjeta (`Card`) con información relevante:
 *     - Título, descripción, estado, fecha de aplicación y cantidad de alumnos asignados.
 *   - Los usuarios pueden hacer clic en una tarjeta para navegar a los detalles del examen.
 *
 * - **Actualización de exámenes:**
 *   - Botón para recargar la lista de exámenes desde la API.
 *   - Indicador de carga mientras se realiza la solicitud.
 *
 * - **Creación de nuevos exámenes:**
 *   - Botón para redirigir a la página de creación de un nuevo examen.
 *
 * ## Componentes utilizados:
 * 
 * - **UI Components:** 
 *   - `Button`, `Card`, `Input`, `Label`, `Select`, `Tabs`, `Accordion`, `Badge`, etc.
 *   - Proveen una interfaz consistente y estilizada.
 * 
 * - **Íconos:** 
 *   - `PlusCircle`, `Search`, `Calendar`, `Users`, `RefreshCw`, `Loader2` de `lucide-react`.
 *   - Usados para mejorar la experiencia visual y la navegación.
 *
 * ## Estados y lógica:
 * 
 * - **Estados principales:**
 *   - `examenes`: Lista de exámenes cargados desde la API.
 *   - `searchTerm`: Término de búsqueda ingresado por el usuario.
 *   - `statusFilter`: Filtro de estado seleccionado (`activo`, `inactivo`, `todos`).
 *   - `activeTab`: Tab activo actualmente (`todos`, `recientes`, `proximos`).
 *   - `isLoading`: Indica si se está cargando la lista de exámenes.
 *   - `error`: Mensaje de error en caso de fallo al cargar los exámenes.
 *
 * - **Funciones clave:**
 *   - `cargarExamenes`: Carga los exámenes desde la API y maneja errores.
 *   - `handleTabChange`: Cambia el tab activo y ajusta el filtro de estado.
 *   - `groupExamsByDate`: Agrupa los exámenes por fecha de aplicación.
 *   - `renderExamenes`: Renderiza los exámenes agrupados en un componente `Accordion`.
 *   - `getStatusBadge`: Devuelve un badge estilizado según el estado del examen.
 *   - `formatFechaOTexto`: Formatea una fecha o devuelve un texto alternativo si no está definida.
 *
 * ## Consideraciones:
 * 
 * - La página maneja errores de red y muestra mensajes claros al usuario.
 * - Se asegura de que los datos recibidos de la API tengan el formato esperado.
 * - Proporciona una experiencia de usuario fluida con indicadores de carga y actualizaciones en tiempo real.
 *
 * ## Navegación:
 * 
 * - Los usuarios pueden navegar a los detalles de un examen haciendo clic en su tarjeta.
 * - También pueden acceder a la página de creación de un nuevo examen desde el botón correspondiente.
 */
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { PlusCircle, Search, Calendar, Users, RefreshCw, Loader2 } from "lucide-react"
import { format, isBefore, parse } from "date-fns"
import { formatDate } from "@/lib/utils"
import logger from "@/lib/logger"
import { toast } from "@/components/ui/use-toast"

export default function ExamenesPage() {
  const [examenes, setExamenes] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("activo")
  const [activeTab, setActiveTab] = useState("proximos")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpenForAccordion, setModalOpenForAccordion] = useState<Record<string, boolean>>({})
  const [selectedDateForAccordion, setSelectedDateForAccordion] = useState<Record<string, string>>({})
  const [isDuplicating, setIsDuplicating] = useState(false)
  const router = useRouter()


  const cargarExamenes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      logger.log("Cargando Estaciones...")
      const response = await fetch("/api/examenes", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      logger.log("Datos recibidos:", data)

      if (Array.isArray(data)) {
        setExamenes(data)
      } else {
        logger.error("Los datos recibidos no son un array:", data)
        setExamenes([])
        setError("Los datos recibidos no tienen el formato esperado")
      }
    } catch (error) {
      logger.error("Error cargando exámenes:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar exámenes")
      setExamenes([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarExamenes()
  }, [])

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    if (newTab === "todos" || newTab === "recientes") {
      setStatusFilter("todos")
    } else if (newTab === "proximos") {
      setStatusFilter("activo")
    }
  }

  // Función para agrupar exámenes por fecha
  const groupExamsByDate = (exams: any[]) => {
  return exams.reduce((acc, examen) => {
    const date = examen.fecha_aplicacion
      ? formatDate(examen.fecha_aplicacion)
      : "Sin fecha";
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(examen);
    return acc;
  }, {} as Record<string, any[]>);
};

  // Filtrar exámenes para "Todos"
  const filteredExamenes = examenes.filter((examen) => {
    if (!examen || typeof examen !== "object") return false
    const titulo = examen.titulo || ""
    const descripcion = examen.descripcion || ""
    const estado = examen.estado || ""
    const matchesSearch =
      titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const isValidStatus = ["activo", "inactivo"].includes(estado.toLowerCase())
    const matchesStatus = statusFilter === "todos" || estado.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && isValidStatus && matchesStatus
  })

  // Filtrar exámenes para "Próximos"
  const proximosExamenes = examenes.filter((examen) => {
    if (!examen || typeof examen !== "object") return false
    const titulo = examen.titulo || ""
    const descripcion = examen.descripcion || ""
    const estado = examen.estado || ""
    const fechaAplicacion = examen.fecha_aplicacion ? new Date(examen.fecha_aplicacion) : null
    const matchesSearch =
      titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const isProximo =
      fechaAplicacion &&
      fechaAplicacion >= new Date() &&
      estado.toLowerCase() !== "inactivo" &&
      estado.toLowerCase() !== "cancelado"
    return matchesSearch && isProximo
  })

  // Filtrar exámenes para "Recientes"
  const recientesExamenes = examenes.filter((examen) => {
    if (!examen || typeof examen !== "object") return false
    const titulo = examen.titulo || ""
    const descripcion = examen.descripcion || ""
    const estado = examen.estado || ""
    const fechaAplicacion = examen.fecha_aplicacion ? new Date(examen.fecha_aplicacion) : null
    const matchesSearch =
      titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "todos" || estado.toLowerCase() === statusFilter.toLowerCase()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const isReciente =
    fechaAplicacion &&
    fechaAplicacion >= thirtyDaysAgo &&
    fechaAplicacion < new Date(); // Asegura que la fecha sea anterior a la actual
    const isValidStatus = ["activo", "inactivo"].includes(estado.toLowerCase())
    return matchesSearch && matchesStatus && isReciente && isValidStatus
  })

  // Función para obtener el badge de estado
  const getStatusBadge = (status: string) => {
    if (!status) return <Badge>Desconocido</Badge>
    switch (status.toLowerCase()) {
      case "activo":
        return <Badge className="bg-green-500">Activo</Badge>
      case "inactivo":
        return <Badge className="bg-yellow-500">Inactivo</Badge>
      case "completado":
        return <Badge className="bg-blue-500">Completado</Badge>
      case "cancelado":
        return <Badge className="bg-red-500">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Función para formatear fecha o mostrar texto alternativo
  const formatFechaOTexto = (fecha: string, textoAlternativo = "Fecha no definida") => {
    if (!fecha) return textoAlternativo
    try {
      return formatDate(fecha)
    } catch (error) {
      return textoAlternativo
    }
  }

  

  // Renderizar exámenes agrupados en un Accordion
  const renderExamenes = (exams: any[]) => {
    const groupedExams = groupExamsByDate(exams)
    const dates = Object.keys(groupedExams).sort((a, b) => {
      if (a === "Sin fecha") return 1
      if (b === "Sin fecha") return -1
      return new Date(b.split("/").reverse().join("-")).getTime() - new Date(a.split("/").reverse().join("-")).getTime()
    })

    return (
      <Accordion type="single" collapsible className="w-full rounded-lg shadow-sm">
        {dates.map((date) => (
          <AccordionItem key={date} value={date} className="border rounded-xl bg-white shadow-sm mb-4 overflow-hidden">
           <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 transition-colors">
            <div className="flex w-full justify-between items-center">
              <span>
                {date} {date !== "Sin fecha" ? ` - ${groupedExams[date].length} estaciones` : ""}
              </span>
            </div>
          </AccordionTrigger>
            <AccordionContent className="p-4 border-t">
              <div className="space-y-4">
                {groupedExams[date].map((examen) => (
                  <Card
                    key={examen.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/examenes/${examen.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{examen.titulo || "Sin título"}</CardTitle>
                        {getStatusBadge(examen.estado)}
                      </div>
                      <CardDescription>{examen.descripcion || "Sin descripción"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatFechaOTexto(examen.fecha_aplicacion)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        <span>{examen.cantidad_alumnos || 0} alumnos asignados</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
                {/* Botón al final del contenido, alineado a la derecha */}
                
              </div>

              
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Estaciones</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={cargarExamenes} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isLoading ? "Actualizando..." : "Actualizar"}
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Nueva Estación
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive mb-6">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-2 text-sm">Verifica la conexión a la base de datos e inténtalo nuevamente.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={cargarExamenes}>
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
                placeholder="Buscar exámenes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status">Estado</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="recientes">Recientes</TabsTrigger>
              <TabsTrigger value="proximos">Próximos</TabsTrigger>
            </TabsList>
            <TabsContent value="todos" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredExamenes.length === 0 ? (
                <div className="text-center py-10">
                  No se encontraron estaciones activas o inactivas que coincidan con los criterios de búsqueda.
                </div>
              ) : (
                renderExamenes(filteredExamenes)
              )}
            </TabsContent>
            <TabsContent value="recientes" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : recientesExamenes.length === 0 ? (
                <div className="text-center py-10">
                  No se encontraron estaciones recientes activas o inactivas que coincidan con los criterios de búsqueda.
                </div>
              ) : (
                renderExamenes(recientesExamenes)
              )}
            </TabsContent>
            <TabsContent value="proximos" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : proximosExamenes.length === 0 ? (
                <div className="text-center py-10">
                  No se encontraron estaciones próximas que coincidan con los criterios de búsqueda.
                </div>
              ) : (
                renderExamenes(proximosExamenes)
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
