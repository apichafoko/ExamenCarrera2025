"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Loader2, User, Calendar, CheckCircle, AlertTriangle, MessageSquare, Download } from "lucide-react"

export default function EditarExamenPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [alumnoExamen, setAlumnoExamen] = useState<any>(null)

  const alumnoExamenId = Number.parseInt(params.id)

  useEffect(() => {
    const cargarExamen = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/evaluador/examenes/${alumnoExamenId}`)
        if (response.ok) {
          const data = await response.json()
          setAlumnoExamen(data)
        } else {
          toast({
            title: "Error",
            description: "No se pudo cargar el examen",
            variant: "destructive",
          })
          router.push("/evaluador")
        }
      } catch (error) {
        console.error("Error al cargar examen:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar el examen",
          variant: "destructive",
        })
        router.push("/evaluador")
      } finally {
        setIsLoading(false)
      }
    }

    cargarExamen()
  }, [alumnoExamenId, router, toast])

  const handleVolverListado = () => {
    router.push("/evaluador")
  }

  const handleDescargarResultados = () => {
    if (!alumnoExamen) return

    // Crear un objeto con los datos para exportar
    const datosExportacion = {
      examen: {
        titulo: alumnoExamen.examen_titulo,
        descripcion: alumnoExamen.examen_descripcion,
        fecha_inicio: alumnoExamen.fecha_inicio,
        fecha_fin: alumnoExamen.fecha_fin,
      },
      alumno: {
        nombre: alumnoExamen.alumno_nombre,
        apellido: alumnoExamen.alumno_apellido,
        id: alumnoExamen.alumno_id,
      },
      estaciones: alumnoExamen.estaciones.map((estacion) => ({
        titulo: estacion.titulo,
        calificacion: estacion.resultado?.calificacion || 0,
        preguntas: estacion.preguntas.map((pregunta) => ({
          texto: pregunta.texto,
          tipo: pregunta.tipo,
          respuesta: pregunta.respuesta,
          puntaje: pregunta.puntaje_asignado || pregunta.puntaje || 0,
          comentario: pregunta.comentario || "",
        })),
      })),
    }

    // Convertir a JSON y crear un blob
    const jsonString = JSON.stringify(datosExportacion, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })

    // Crear un enlace de descarga
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `resultados_examen_${alumnoExamen.alumno_apellido}_${alumnoExamen.alumno_nombre}.json`
    document.body.appendChild(a)
    a.click()

    // Limpiar
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)

    toast({
      title: "Resultados descargados",
      description: "Se ha descargado un archivo JSON con los resultados del examen.",
    })
  }

  // Calcular calificación promedio del examen
  const calcularCalificacionPromedio = () => {
    if (!alumnoExamen || !alumnoExamen.estaciones) return 0

    let totalCalificacion = 0
    let estacionesConCalificacion = 0

    alumnoExamen.estaciones.forEach((estacion) => {
      if (estacion.resultado && estacion.resultado.calificacion !== undefined) {
        totalCalificacion += Number.parseFloat(estacion.resultado.calificacion)
        estacionesConCalificacion++
      }
    })

    return estacionesConCalificacion > 0 ? totalCalificacion / estacionesConCalificacion : 0
  }

  // Mostrar pantalla de carga mientras se inicializa
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Cargando resultados del examen...</p>
      </div>
    )
  }

  if (!alumnoExamen) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">No se pudo cargar el examen</p>
        <Button onClick={handleVolverListado}>Volver al listado</Button>
      </div>
    )
  }

  const calificacionPromedio = calcularCalificacionPromedio()
  const calificacionColor =
    calificacionPromedio >= 7 ? "text-green-600" : calificacionPromedio >= 5 ? "text-amber-600" : "text-red-600"

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleVolverListado} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resultados del Examen</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground">
              <div className="flex items-center">
                <User className="mr-1 h-4 w-4" />
                {alumnoExamen.alumno_nombre} {alumnoExamen.alumno_apellido}
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {new Date(alumnoExamen.fecha_fin || Date.now()).toLocaleDateString()}
              </div>
              <Badge variant="default" className="flex items-center w-fit gap-1">
                <CheckCircle className="h-3 w-3" />
                {alumnoExamen.estado}
              </Badge>
            </div>
          </div>
        </div>
        <Button onClick={handleDescargarResultados} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Descargar Resultados
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{alumnoExamen.examen_titulo}</CardTitle>
            <CardDescription>{alumnoExamen.examen_descripcion}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Calificación Final</h3>
                <Badge variant="outline" className={`text-lg font-bold ${calificacionColor}`}>
                  {calificacionPromedio.toFixed(2)}
                </Badge>
              </div>
              <Progress value={calificacionPromedio * 10} className="h-2 mb-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Fecha de inicio: {new Date(alumnoExamen.fecha_inicio).toLocaleString()}</span>
                <span>Fecha de finalización: {new Date(alumnoExamen.fecha_fin).toLocaleString()}</span>
              </div>
            </div>

            <Tabs defaultValue="estaciones" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="estaciones">Estaciones</TabsTrigger>
                <TabsTrigger value="respuestas">Respuestas</TabsTrigger>
              </TabsList>
              <TabsContent value="estaciones" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estación</TableHead>
                      <TableHead>Calificación</TableHead>
                      <TableHead>Fecha de Evaluación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alumnoExamen.estaciones.map((estacion) => (
                      <TableRow key={estacion.id}>
                        <TableCell className="font-medium">{estacion.titulo}</TableCell>
                        <TableCell>
                          {estacion.resultado ? (
                            <Badge
                              variant="outline"
                              className={
                                Number.parseFloat(estacion.resultado.calificacion) >= 7
                                  ? "text-green-600"
                                  : Number.parseFloat(estacion.resultado.calificacion) >= 5
                                    ? "text-amber-600"
                                    : "text-red-600"
                              }
                            >
                              {Number.parseFloat(estacion.resultado.calificacion).toFixed(2)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">No evaluada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {estacion.resultado ? new Date(estacion.resultado.fecha_evaluacion).toLocaleString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="respuestas" className="mt-4">
                <Accordion type="single" collapsible className="w-full">
                  {alumnoExamen.estaciones.map((estacion, index) => (
                    <AccordionItem key={estacion.id} value={`estacion-${estacion.id}`}>
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <span>{estacion.titulo}</span>
                          {estacion.resultado && (
                            <Badge variant="outline" className="ml-2">
                              {Number.parseFloat(estacion.resultado.calificacion).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          {estacion.preguntas.map((pregunta) => (
                            <div key={pregunta.id} className="border rounded-md p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{pregunta.texto}</h4>
                                <Badge variant="outline">
                                  {pregunta.puntaje_asignado || pregunta.puntaje || 0} pts
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">Tipo: {pregunta.tipo}</div>
                              <div className="mt-2">
                                <p className="font-medium text-sm">Respuesta:</p>
                                <div className="mt-1 p-2 bg-muted rounded-md">
                                  {pregunta.tipo === "opcion_multiple" ? (
                                    <div>
                                      {pregunta.respuesta ? (
                                        <ul className="list-disc list-inside">
                                          {JSON.parse(pregunta.respuesta).map((opcionId) => {
                                            const opcion = pregunta.opciones?.find((o) => o.id === opcionId)
                                            return (
                                              <li key={opcionId}>{opcion ? opcion.texto : `Opción ${opcionId}`}</li>
                                            )
                                          })}
                                        </ul>
                                      ) : (
                                        <span className="text-muted-foreground">Sin respuesta</span>
                                      )}
                                    </div>
                                  ) : pregunta.tipo === "opcion_unica" ? (
                                    <div>
                                      {pregunta.respuesta ? (
                                        <div>
                                          {(() => {
                                            const opcion = pregunta.opciones?.find(
                                              (o) => o.id.toString() === pregunta.respuesta,
                                            )
                                            return opcion ? opcion.texto : `Opción ${pregunta.respuesta}`
                                          })()}
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">Sin respuesta</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      {pregunta.respuesta || (
                                        <span className="text-muted-foreground">Sin respuesta</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {pregunta.comentario && (
                                  <div className="mt-2 p-2 bg-accent rounded-md">
                                    <div className="flex items-center gap-1 mb-1">
                                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs font-medium">Comentario del evaluador:</span>
                                    </div>
                                    <p className="text-sm">{pregunta.comentario}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Examen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alumno</p>
                  <p className="font-medium">
                    {alumnoExamen.alumno_nombre} {alumnoExamen.alumno_apellido}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Examen</p>
                  <p className="font-medium">{alumnoExamen.examen_titulo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant="outline" className="mt-1">
                    {alumnoExamen.estado}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de inicio</p>
                  <p className="font-medium">{new Date(alumnoExamen.fecha_inicio).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de finalización</p>
                  <p className="font-medium">{new Date(alumnoExamen.fecha_fin).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Calificación final</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-lg font-bold ${calificacionColor}`}>
                      {calificacionPromedio.toFixed(2)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">/ 10</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Estaciones completadas</p>
                    <p className="text-sm font-medium">
                      {alumnoExamen.estaciones.filter((e) => e.resultado).length} / {alumnoExamen.estaciones.length}
                    </p>
                  </div>
                  <Progress
                    value={
                      (alumnoExamen.estaciones.filter((e) => e.resultado).length / alumnoExamen.estaciones.length) * 100
                    }
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Preguntas respondidas</p>
                    <p className="text-sm font-medium">
                      {alumnoExamen.estaciones.reduce(
                        (total, estacion) => total + estacion.preguntas.filter((p) => p.respuesta).length,
                        0,
                      )}{" "}
                      / {alumnoExamen.estaciones.reduce((total, estacion) => total + estacion.preguntas.length, 0)}
                    </p>
                  </div>
                  <Progress
                    value={
                      (alumnoExamen.estaciones.reduce(
                        (total, estacion) => total + estacion.preguntas.filter((p) => p.respuesta).length,
                        0,
                      ) /
                        alumnoExamen.estaciones.reduce((total, estacion) => total + estacion.preguntas.length, 0)) *
                      100
                    }
                    className="h-2"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Distribución de calificaciones por estación</p>
                  <div className="space-y-2">
                    {alumnoExamen.estaciones.map((estacion) => (
                      <div key={estacion.id} className="flex items-center gap-2">
                        <div className="w-24 truncate text-xs">{estacion.titulo}</div>
                        <Progress
                          value={estacion.resultado ? Number.parseFloat(estacion.resultado.calificacion) * 10 : 0}
                          className="h-2 flex-1"
                        />
                        <div className="text-xs font-medium">
                          {estacion.resultado ? Number.parseFloat(estacion.resultado.calificacion).toFixed(1) : "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleDescargarResultados}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Resultados
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleVolverListado}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Listado
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
