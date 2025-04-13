"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, AlertCircle, User, CheckSquare, FileText, Book } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export default function ResultadosEvaluacionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [evaluacion, setEvaluacion] = useState<any>(null)

  useEffect(() => {
    const fetchResultados = async () => {
      setLoading(true)
      setError(null)

      try {
        // Obtener los datos de la evaluación específica
        const response = await fetch(`/api/evaluador/respuestas/${params.id}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`
          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log("Datos recibidos:", data)
        setEvaluacion(data)
      } catch (err) {
        console.error("Error al cargar los resultados:", err)
        setError(err instanceof Error ? error.message : "Error desconocido al cargar los resultados")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Error al cargar los resultados",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResultados()
  }, [params.id, toast])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">Cargando resultados...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-muted-foreground text-center max-w-md">{error}</p>
              <Button variant="outline" onClick={() => router.back()}>
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!evaluacion) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-amber-500" />
              <p className="text-muted-foreground text-center">No se encontraron resultados para esta evaluación</p>
              <Button variant="outline" onClick={() => router.back()}>
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calcular estadísticas
  const totalPuntos = evaluacion.puntajeTotal || 0
  const puntosPosibles = evaluacion.puntajeMaximo || 100
  const porcentaje = puntosPosibles > 0 ? Math.round((totalPuntos / puntosPosibles) * 100) : 0

  // Obtener el estado de aprobación
  const esAprobado = porcentaje >= 70

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resultados de Evaluación</h1>
          <p className="text-muted-foreground">Revisión detallada de la evaluación del alumno</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información de la Evaluación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium text-muted-foreground">Alumno</h3>
                <p className="text-lg font-medium">{evaluacion.alumnoNombre || "No especificado"}</p>
                <h3 className="font-medium text-muted-foreground">Tiempo Total:</h3>
                {evaluacion.fecha_inicio && evaluacion.fecha_fin && (
                <p className="text-lg font-medium">
                  {" "}
                  {(() => {
                    const inicio = new Date(evaluacion.fecha_inicio)
                    const fin = new Date(evaluacion.fecha_fin)
                    const diffMs = fin.getTime() - inicio.getTime()
                    const minutos = Math.floor(diffMs / 60000)
                    const segundos = Math.floor((diffMs % 60000) / 1000)

                    return `${minutos} min ${segundos} seg`
                  })()}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Fecha de Inicio</h3>
                <p className="text-lg font-medium">
                  {evaluacion.fecha_inicio
                    ? new Date(evaluacion.fecha_inicio).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "No registrada"}
                </p>
                <h3 className="font-medium text-muted-foreground">Fecha de Fin</h3>
                <p className="text-lg font-medium">
                  {evaluacion.fecha_fin
                    ? new Date(evaluacion.fecha_fin).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "No registrada"}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Examen</h3>
                <p className="text-lg font-medium">{evaluacion.examenNombre || "No especificado"}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Evaluador</h3>
                <p className="text-lg font-medium">{evaluacion.evaluadorNombre || "No especificado"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultado Final</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-primary">
              <span className="text-3xl font-bold">{porcentaje}%</span>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground mb-1">Puntuación</p>
              <p className="text-xl font-semibold">
                {totalPuntos} / {puntosPosibles}
              </p>
            </div>
            <Badge variant={esAprobado ? "default" : "destructive"} className="mt-2 py-1.5 px-3">
              {esAprobado ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" /> Aprobado
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-1" /> No Aprobado
                </>
              )}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resultados" className="mt-6">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="resultados" className="text-sm">
            <FileText className="h-4 w-4 mr-2" />
            Resultados por Estación
          </TabsTrigger>
          <TabsTrigger value="respuestas" className="text-sm">
            <CheckSquare className="h-4 w-4 mr-2" />
            Detalle de Respuestas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resultados">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="h-5 w-5 mr-2" />
                Resultados por Estación
              </CardTitle>
              <CardDescription>Desglose de calificaciones por cada estación del examen</CardDescription>
            </CardHeader>
            <CardContent>
              {evaluacion.estaciones && evaluacion.estaciones.length > 0 ? (
                <div className="space-y-6">
                  {evaluacion.estaciones.map((estacion: any, index: number) => {
                    const estacionPuntos = estacion.puntaje || 0
                    const estacionMaximo = estacion.puntajeMaximo || 10
                    const estacionPorcentaje =
                      estacionMaximo > 0 ? Math.round((estacionPuntos / estacionMaximo) * 100) : 0

                    return (
                      <div key={estacion.id || index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{estacion.nombre || `Estación ${index + 1}`}</h3>
                          <span className="font-medium">
                            {estacionPuntos} / {estacionMaximo} pts
                          </span>
                        </div>
                        <Progress value={estacionPorcentaje} className="h-2.5" />
                        <p className="text-muted-foreground text-sm">{estacion.descripcion || "Sin descripción"}</p>
                        <Separator className="my-4" />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No hay información de estaciones disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="respuestas">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Preguntas y Respuestas</CardTitle>
              <CardDescription>Revisión detallada de cada respuesta del alumno</CardDescription>
            </CardHeader>
            <CardContent>
              {evaluacion.preguntas && evaluacion.preguntas.length > 0 ? (
                <div className="space-y-8">
                  {evaluacion.preguntas.map((pregunta: any, index: number) => (
                    <div key={pregunta.id || index} className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">
                          Pregunta {index + 1}: {pregunta.texto}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {pregunta.estacion_nombre || "Estación no especificada"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="font-medium">Respuesta del alumno:</p>
                        <div className="bg-muted p-3 rounded-md">{pregunta.respuesta_texto || "Sin respuesta"}</div>
                      </div>

                      <div className="max-w-xs">
                        <p className="font-medium">Comentarios:</p>
                        <p className="text-sm text-muted-foreground">{pregunta.comentarios || "Sin comentarios"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">No hay información de preguntas disponible</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
