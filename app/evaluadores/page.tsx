"use client"

import { CardFooter } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Search, RefreshCw, Loader2, Award, CheckCircle, AlertTriangle, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

export default function EvaluadoresPage() {
  const [evaluadores, setEvaluadores] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const [evaluadoresConExamenes, setEvaluadoresConExamenes] = useState<number[]>([]) // IDs de evaluadores con exámenes

  const cargarEvaluadores = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Cargando evaluadores...")
      const response = await fetch("/api/evaluadores", {
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
        setEvaluadores(data)
      } else {
        console.error("Los datos recibidos no son un array:", data)
        setEvaluadores([])
        setError("Los datos recibidos no tienen el formato esperado")
      }
    } catch (error) {
      console.error("Error cargando evaluadores:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar evaluadores")
      toast({
        title: "Error al cargar evaluadores",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      setEvaluadores([])
    } finally {
      setIsLoading(false)
    }
  }

  const cargarEvaluadoresConExamenes = async () => {
    try {
      const response = await fetch("/api/evaluadores?conExamenes=true", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Extraer solo los IDs de los evaluadores con exámenes
        const ids = data.map((evaluador: any) => evaluador.id)
        setEvaluadoresConExamenes(ids)
      } else {
        console.error("Error al cargar evaluadores con exámenes")
        setEvaluadoresConExamenes([])
      }
    } catch (error) {
      console.error("Error al cargar evaluadores con exámenes:", error)
      setEvaluadoresConExamenes([])
    }
  }

  useEffect(() => {
    cargarEvaluadores()
    cargarEvaluadoresConExamenes()
  }, [])

  const filteredEvaluadores = evaluadores.filter((evaluador) => {
    if (!evaluador || typeof evaluador !== "object") return false

    const nombre = evaluador.nombre || ""
    const apellido = evaluador.apellido || ""
    const especialidad = evaluador.especialidad || ""
    const email = evaluador.email || ""
    const categoria = evaluador.categoria || ""

    const fullName = `${nombre} ${apellido}`.toLowerCase()
    const searchTermLower = searchTerm.toLowerCase()

    return (
      fullName.includes(searchTermLower) ||
      especialidad.toLowerCase().includes(searchTermLower) ||
      email.toLowerCase().includes(searchTermLower) ||
      categoria.toLowerCase().includes(searchTermLower)
    )
  })

  const handleEliminar = async (id: number) => {
    console.log(`Iniciando eliminación del evaluador ${id}`)
    try {
      const response = await fetch(`/api/evaluadores/${id}`, {
        method: "DELETE",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      setEvaluadores((prev) => prev.filter((evaluador) => evaluador.id !== id))
      toast({
        title: "Evaluador eliminado",
        description: "El evaluador ha sido eliminado correctamente.",
      })
    } catch (error) {
      console.error("Error eliminando evaluador:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el evaluador",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Evaluadores</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={cargarEvaluadores} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isLoading ? "Actualizando..." : "Actualizar"}
          </Button>
          <Button onClick={() => router.push("/evaluadores/nuevo")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Evaluador
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
            <Button variant="outline" onClick={cargarEvaluadores}>
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
                placeholder="Buscar evaluadores..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEvaluadores.length === 0 ? (
            <div className="text-center py-10">
              {searchTerm
                ? "No se encontraron evaluadores que coincidan con los criterios de búsqueda."
                : "No hay evaluadores registrados. Crea uno nuevo para comenzar."}
            </div>
          ) : (
            filteredEvaluadores.map((evaluador) => (
              <Card
                key={evaluador.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/evaluadores/${evaluador.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{`${evaluador.nombre || ""} ${evaluador.apellido || ""}`}</CardTitle>
                      <CardDescription>{evaluador.especialidad || "Sin especialidad"}</CardDescription>
                    </div>
                    <div className="flex items-center">
                      <HoverCard openDelay={200}>
                        <HoverCardTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={evaluadoresConExamenes.includes(evaluador.id)}
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log(`Eliminando evaluador ${evaluador.id}`)
                              handleEliminar(evaluador.id)
                            }}
                            className={cn(
                              "text-destructive",
                              evaluadoresConExamenes.includes(evaluador.id) && "cursor-not-allowed opacity-50",
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-[260px] text-sm" side="left" align="start" sideOffset={10}>
                          {evaluadoresConExamenes.includes(evaluador.id)
                            ? "Este evaluador no se puede eliminar porque tiene exámenes asignados."
                            : "Eliminar evaluador"}
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2 grid gap-2">
                  <div className="flex items-center">
                    <Award className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Especialidad: {evaluador.especialidad || "No especificada"}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Estado:{" "}
                      <Badge variant={evaluador.activo ? "default" : "secondary"}>
                        {evaluador.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </span>
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
