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
import { PlusCircle, Search, Calendar, Users, RefreshCw, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function ExamenesPage() {
  const [examenes, setExamenes] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const cargarExamenes = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Cargando Estaciones...")
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
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Datos recibidos:", data)

      if (Array.isArray(data)) {
        setExamenes(data)
      } else {
        console.error("Los datos recibidos no son un array:", data)
        setExamenes([])
        setError("Los datos recibidos no tienen el formato esperado")
      }
    } catch (error) {
      console.error("Error cargando exámenes:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar exámenes")
      setExamenes([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarExamenes()
  }, [])

  // Filtrar los exámenes
  const filteredExamenes = examenes.filter((examen) => {
    // Verificar que examen y sus propiedades existan
    if (!examen || typeof examen !== "object") return false

    const titulo = examen.titulo || ""
    const descripcion = examen.descripcion || ""
    const estado = examen.estado || ""

    const matchesSearch =
      titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descripcion.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "todos" || estado.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  // Función para obtener el badge de estado
  const getStatusBadge = (status) => {
    if (!status) return <Badge>Desconocido</Badge>

    switch (status.toLowerCase()) {
      case "activo":
        return <Badge className="bg-green-500">Activo</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case "completado":
        return <Badge className="bg-blue-500">Completado</Badge>
      case "cancelado":
        return <Badge className="bg-red-500">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Función para formatear fecha o mostrar texto alternativo
  const formatFechaOTexto = (fecha, textoAlternativo = "Fecha no definida") => {
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
        <h1 className="text-3xl font-bold">Estaciones</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={cargarExamenes} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isLoading ? "Actualizando..." : "Actualizar"}
          </Button>
          <Button onClick={() => router.push("/examenes/nuevo")}>
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
            <p className="mt-2 text-sm">Verifica la conexión a la base de datos e intenta nuevamente.</p>
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
            <Select defaultValue={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Tabs defaultValue="todos" className="w-full">
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
                  No se encontraron estaciones que coincidan con los criterios de búsqueda.
                </div>
              ) : (
                filteredExamenes.map((examen) => (
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
                ))
              )}
            </TabsContent>
            <TabsContent value="recientes" className="space-y-4">
              {/* Contenido similar para exámenes recientes */}
              <div className="text-center py-10">Filtro de Estaciones recientes en desarrollo.</div>
            </TabsContent>
            <TabsContent value="proximos" className="space-y-4">
              {/* Contenido similar para próximos exámenes */}
              <div className="text-center py-10">Filtro de próximos Estaciones en desarrollo.</div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
