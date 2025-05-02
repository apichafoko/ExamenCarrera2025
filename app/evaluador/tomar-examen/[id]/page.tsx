"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ChevronLeft, ChevronRight, Save, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function TomarExamenPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [examen, setExamen] = useState<any>(null)
  const [estacionActual, setEstacionActual] = useState(0)
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<number, any>>({})
  const [comentarios, setComentarios] = useState<Record<number, string>>({})
  const [puntajes, setPuntajes] = useState<Record<number, number>>({})
  const [progreso, setProgreso] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [mostrarAlertaEstacionIncompleta, setMostrarAlertaEstacionIncompleta] = useState(false)
  const alertaRef = useRef<HTMLDivElement>(null)

  // Guardar el resultado de la estación:

  /*const guardarResultadoEstacion = async (estacionIndex: number) => {
    if (!examen) return

    const estacionActual = examen.estaciones[estacionIndex]
    if (!estacionActual) return

    const todasRespondidas = estacionActual.preguntas.every((pregunta) => respuestas[pregunta.id])
    if (!todasRespondidas) {
      return
    }
    const promesas = []
    const alumnoExamenId = Number(params.id)

    // Enviar los resultados de la estación al backend
    const response = await fetch("/api/evaluador/resultados-estaciones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        alumno_examen_id: Number(params.id),
        estacion_id: estacionActual.id,
        calificacion: 8, //Calcular la calificación por estacion
        observaciones: "",
      }),
    })

    if (!response.ok) {
      throw new Error("Error al guardar los resultados de la estación")
    }

    console.log(``Resultado guardado de estacion ${estacionActual.id}:)
    return ""
  }*/

  // Cargar el examen
  useEffect(() => {
    const fetchExamen = async () => {
      try {
        setLoading(true)
        setError(null)

        // Verificar si el ID es válido
        if (!params.id || params.id === "[id]") {
          throw new Error("ID de examen no proporcionado. Por favor, seleccione un examen de la lista.")
        }

        // CORRECCIÓN: Asegurarnos de que estamos usando el ID correcto del alumno_examen
        const alumnoExamenId = Number.parseInt(params.id)

        if (isNaN(alumnoExamenId)) {
          throw new Error("ID de alumno_examen inválido. Por favor, seleccione un examen válido de la lista.")
        }

        console.log(`Cargando alumno_examen con ID: ${alumnoExamenId}`)

        const response = await fetch(`/api/evaluador/examenes/${alumnoExamenId}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("Error en respuesta:", errorData)
          throw new Error(errorData.message || `Error: ${response.status}`)
        }

        const data = await response.json()
        console.log("Alumno_examen cargado:", data)
        setExamen(data)

        // Inicializar respuestas, comentarios y puntajes desde los datos cargados
        const respuestasIniciales: Record<number, any> = {}
        const comentariosIniciales: Record<number, string> = {}
        const puntajesIniciales: Record<number, number> = {}

        data.estaciones.forEach((estacion: any) => {
          estacion.preguntas.forEach((pregunta: any) => {
            if (pregunta.respuesta !== undefined) {
              respuestasIniciales[pregunta.id] = pregunta.respuesta
            }
            if (pregunta.comentario !== undefined) {
              comentariosIniciales[pregunta.id] = pregunta.comentario
            }
            if (pregunta.puntaje_asignado !== undefined) {
              puntajesIniciales[pregunta.id] = pregunta.puntaje_asignado
            } else {
              puntajesIniciales[pregunta.id] = pregunta.puntaje || 0
            }
          })
        })

        setRespuestas(respuestasIniciales)
        setComentarios(comentariosIniciales)
        setPuntajes(puntajesIniciales)

        // Si el examen está en estado Pendiente, iniciarlo
        if (data.estado === "Pendiente") {
          console.log(`Iniciando alumno_examen con ID: ${alumnoExamenId}`)

          const iniciarResponse = await fetch(`/api/evaluador/examenes/${alumnoExamenId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: "iniciar" }),
          })

          if (!iniciarResponse.ok) {
            const errorData = await iniciarResponse.json().catch(() => ({}))
            console.error("Error al iniciar el examen:", errorData)
            throw new Error(`Error al iniciar el examen: ${errorData.message || "Error desconocido"}`)
          }

          const iniciarData = await iniciarResponse.json()
          console.log("Alumno_examen iniciado:", iniciarData)

          // Actualizar el estado del examen en el estado local
          setExamen((prev) => ({ ...prev, estado: "En Progreso" }))

          toast({
            title: "Examen iniciado",
            description: "El examen ha sido iniciado correctamente.",
          })
        }

        // Calcular progreso inicial
        calcularProgreso(data, respuestasIniciales)
      } catch (error) {
        console.error("Error al cargar el examen:", error)
        setError(error instanceof Error ? error.message : "Error al cargar el examen")
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchExamen()
  }, [params.id, toast])

  // Hacer scroll a la alerta cuando se muestra
  useEffect(() => {
    if (mostrarAlertaEstacionIncompleta && alertaRef.current) {
      alertaRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [mostrarAlertaEstacionIncompleta])

  // Verificar si todas las preguntas de la estación actual tienen respuesta
  const verificarEstacionCompleta = useCallback(() => {
    if (!examen) return true

    const estacion = examen.estaciones[estacionActual]
    let todasRespondidas = true
    const preguntasSinResponder = []

    for (let i = 0; i < estacion.preguntas.length; i++) {
      const pregunta = estacion.preguntas[i]
      const respuesta = respuestas[pregunta.id]

      if (
        respuesta === undefined ||
        respuesta === null ||
        respuesta === "" ||
        (Array.isArray(respuesta) && respuesta.length === 0)
      ) {
        todasRespondidas = false
        preguntasSinResponder.push(i)
      }
    }

    console.log(`Estación ${estacionActual + 1} completa: ${todasRespondidas}`)
    if (!todasRespondidas) {
      console.log(`Preguntas sin responder: ${preguntasSinResponder.join(", ")}`)
    }

    return todasRespondidas
  }, [examen, estacionActual, respuestas])

  // Finalizar el examen
  const finalizarExamen = async () => {
    try {
      // Verificar que todas las preguntas de la estación actual tengan respuesta
      if (!verificarEstacionCompleta()) {
        setMostrarAlertaEstacionIncompleta(true)

        toast({
          title: "Error al finalizar el examen",
          description: "Debe responder todas las preguntas de la estación actual antes de continuar.",
          variant: "destructive",
        })

        return
      }

      setSaving(true)

      // Guardar todas las respuestas pendientes
      await guardarTodasLasRespuestas()

      // CORRECCIÓN: Usar el ID del alumno_examen, no el ID del examen
      const alumnoExamenId = Number.parseInt(params.id)

      const response = await fetch(`/api/evaluador/examenes/${alumnoExamenId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "finalizar" }),
      })

      if (!response.ok) {
        throw new Error("Error al finalizar el examen")
      }

      const data = await response.json()
      console.log("Examen finalizado:", data)

      toast({
        title: "Examen finalizado",
        description: "El examen ha sido finalizado correctamente.",
      })

      // Redirigir a la página de resultados
      router.push(`/evaluador`)
    } catch (error) {
      console.error("Error al finalizar el examen:", error)
      toast({
        title: "Error",
        description: "No se pudo finalizar el examen. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Guardar una respuesta
  const guardarRespuesta = async (preguntaId: number, respuesta: string, puntaje: number, comentario: string) => {
    try {
      setSaving(true)

      // CORRECCIÓN: Usar el ID del alumno_examen, no el ID del examen
      const alumnoExamenId = Number.parseInt(params.id)

      const response = await fetch("/api/evaluador/respuestas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alumno_examen_id: alumnoExamenId,
          pregunta_id: preguntaId,
          respuesta,
          puntaje,
          comentario,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar la respuesta")
      }

      const data = await response.json()
      console.log("Respuesta guardada:", data)

      toast({
        title: "Respuesta guardada",
        description: "La respuesta ha sido guardada correctamente.",
      })

      return data
    } catch (error) {
      console.error("Error al guardar la respuesta:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la respuesta. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Guardar todas las respuestas pendientes
  const guardarTodasLasRespuestas = async () => {
    if (!examen) return

    try {
      const promesas = []
      const alumnoExamenId = Number.parseInt(params.id)

      for (const estacion of examen.estaciones) {
        for (const pregunta of estacion.preguntas) {
          if (respuestas[pregunta.id] !== undefined) {
            promesas.push(
              guardarRespuesta(
                pregunta.id,
                respuestas[pregunta.id],
                puntajes[pregunta.id] || pregunta.puntaje || 0,
                comentarios[pregunta.id] || "",
              ),
            )
          }
        }
      }

      await Promise.all(promesas)
      console.log("Todas las respuestas guardadas")
    } catch (error) {
      console.error("Error al guardar todas las respuestas:", error)
      throw error
    }
  }

  // Calcular el progreso del examen
  const calcularProgreso = useCallback((examenData: any, respuestasData: Record<number, any>) => {
    if (!examenData) return 0

    let totalPreguntas = 0
    let preguntasRespondidas = 0

    examenData.estaciones.forEach((estacion: any) => {
      totalPreguntas += estacion.preguntas.length

      estacion.preguntas.forEach((pregunta: any) => {
        const respuesta = respuestasData[pregunta.id]
        if (
          respuesta !== undefined &&
          respuesta !== null &&
          respuesta !== "" &&
          !(Array.isArray(respuesta) && respuesta.length === 0)
        ) {
          preguntasRespondidas++
        }
      })
    })

    const porcentaje = totalPreguntas > 0 ? (preguntasRespondidas / totalPreguntas) * 100 : 0
    setProgreso(porcentaje)
    return porcentaje
  }, [])

  // Manejar cambio de respuesta
  const handleRespuestaChange = (preguntaId: number, valor: any) => {
    setRespuestas((prev) => {
      const nuevasRespuestas = { ...prev, [preguntaId]: valor }
      if (examen) {
        calcularProgreso(examen, nuevasRespuestas)
      }

      // Ocultar la alerta si se muestra
      if (mostrarAlertaEstacionIncompleta) {
        // Verificar si con esta respuesta ya se completó la estación
        const estacionCompleta = verificarEstacionCompleta()
        if (estacionCompleta) {
          setMostrarAlertaEstacionIncompleta(false)
        }
      }

      return nuevasRespuestas
    })
  }

  // Manejar cambio de comentario
  const handleComentarioChange = (preguntaId: number, valor: string) => {
    setComentarios((prev) => ({ ...prev, [preguntaId]: valor }))
  }

  // Manejar cambio de puntaje
  const handlePuntajeChange = (preguntaId: number, valor: number) => {
    setPuntajes((prev) => ({ ...prev, [preguntaId]: valor }))
  }

  // Navegar a la siguiente pregunta o estación
  const siguientePregunta = async () => {
    if (!examen) return

    try {
      // Guardar la respuesta actual antes de avanzar
      const preguntaActualObj = examen.estaciones[estacionActual].preguntas[preguntaActual]

      if (preguntaActualObj && respuestas[preguntaActualObj.id] !== undefined) {
        await guardarRespuesta(
          preguntaActualObj.id,
          respuestas[preguntaActualObj.id],
          puntajes[preguntaActualObj.id] || preguntaActualObj.puntaje || 0,
          comentarios[preguntaActualObj.id] || "",
        )
      }

      // Avanzar a la siguiente pregunta o estación
      const preguntasEnEstacionActual = examen.estaciones[estacionActual].preguntas.length

      if (preguntaActual < preguntasEnEstacionActual - 1) {
        // Avanzar a la siguiente pregunta en la misma estación
        setPreguntaActual(preguntaActual + 1)
        setMostrarAlertaEstacionIncompleta(false)
      } else if (estacionActual < examen.estaciones.length - 1) {
        // Verificar que todas las preguntas de la estación actual estén respondidas
        if (!verificarEstacionCompleta()) {
          setMostrarAlertaEstacionIncompleta(true)

          toast({
            title: "Estación incompleta",
            description: "Debe responder todas las preguntas de la estación actual antes de continuar.",
            variant: "destructive",
          })

          return
        }

        // Si todas están respondidas, avanzar a la siguiente estación
        setEstacionActual(estacionActual + 1)
        setPreguntaActual(0)
        setMostrarAlertaEstacionIncompleta(false)
      } else {
        // Si es la última pregunta de la última estación, verificar si todas están respondidas
        if (!verificarEstacionCompleta()) {
          setMostrarAlertaEstacionIncompleta(true)

          toast({
            title: "Estación incompleta",
            description: "Debe responder todas las preguntas de la estación actual antes de finalizar el examen.",
            variant: "destructive",
          })

          return
        }

        // Si todas están respondidas, finalizar el examen
        await finalizarExamen()
      }
    } catch (error) {
      console.error("Error al avanzar a la siguiente pregunta:", error)
      toast({
        title: "Error",
        description: "No se pudo avanzar a la siguiente pregunta. Intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  // Navegar a la pregunta anterior
  const anteriorPregunta = () => {
    if (!examen) return

    if (preguntaActual > 0) {
      // Retroceder a la pregunta anterior en la misma estación
      setPreguntaActual(preguntaActual - 1)
    } else if (estacionActual > 0) {
      // Retroceder a la última pregunta de la estación anterior
      const estacionAnterior = estacionActual - 1
      const preguntasEnEstacionAnterior = examen.estaciones[estacionAnterior].preguntas.length
      setEstacionActual(estacionAnterior)
      setPreguntaActual(preguntasEnEstacionAnterior - 1)
    }

    // Ocultar la alerta al navegar manualmente
    setMostrarAlertaEstacionIncompleta(false)
  }

  // Guardar la respuesta actual sin avanzar
  const guardarRespuestaActual = async () => {
    if (!examen) return

    try {
      const preguntaActualObj = examen.estaciones[estacionActual].preguntas[preguntaActual]

      if (preguntaActualObj && respuestas[preguntaActualObj.id] !== undefined) {
        await guardarRespuesta(
          preguntaActualObj.id,
          respuestas[preguntaActualObj.id],
          puntajes[preguntaActualObj.id] || preguntaActualObj.puntaje || 0,
          comentarios[preguntaActualObj.id] || "",
        )

        toast({
          title: "Respuesta guardada",
          description: "La respuesta ha sido guardada correctamente.",
        })
      } else {
        toast({
          title: "Advertencia",
          description: "No hay respuesta para guardar.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error al guardar la respuesta actual:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la respuesta. Intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  // Renderizar la pregunta actual
  const renderPregunta = () => {
    if (!examen || loading) return null

    const estacion = examen.estaciones[estacionActual]
    const pregunta = estacion.preguntas[preguntaActual]

    // Verificar si la pregunta actual está sin responder
    const respuesta = respuestas[pregunta.id]
    const esPreguntaSinResponder =
      respuesta === undefined ||
      respuesta === null ||
      respuesta === "" ||
      (Array.isArray(respuesta) && respuesta.length === 0)

    return (
      <Card
        className={`w-full ${esPreguntaSinResponder && mostrarAlertaEstacionIncompleta ? "border-red-500 border-2" : ""}`}
      >
        <CardHeader>
          <CardTitle>
            Estación {estacionActual + 1}: {estacion.titulo}
          </CardTitle>
          <CardDescription>
            Pregunta {preguntaActual + 1} de {estacion.preguntas.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {pregunta.texto}
              {esPreguntaSinResponder && mostrarAlertaEstacionIncompleta && (
                <span className="ml-2 text-red-500 font-bold">* Obligatoria</span>
              )}
            </h3>
            {pregunta.descripcion && <p className="text-sm text-gray-500">{pregunta.descripcion}</p>}
          </div>

          {/* Renderizar el tipo de pregunta correspondiente */}
          {pregunta.tipo === "texto_libre" && (
            <div className="space-y-2">
              <Textarea
                placeholder="Escriba la respuesta aquí..."
                value={respuestas[pregunta.id] || ""}
                onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
                rows={4}
                className={esPreguntaSinResponder && mostrarAlertaEstacionIncompleta ? "border-red-500" : ""}
              />
            </div>
          )}

          {pregunta.tipo === "opcion_unica" && (
            <RadioGroup
              value={respuestas[pregunta.id] || ""}
              onValueChange={(value) => handleRespuestaChange(pregunta.id, value)}
              className="space-y-2"
            >
              {pregunta.opciones?.map((opcion: any) => (
                <div key={opcion.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={opcion.id.toString()} id={`opcion-${opcion.id}`} />
                  <Label htmlFor={`opcion-${opcion.id}`}>{opcion.texto}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {pregunta.tipo === "opcion_multiple" && (
            <div className="space-y-2">
              {pregunta.opciones?.map((opcion: any) => {
                const respuestaArray = Array.isArray(respuestas[pregunta.id])
                  ? respuestas[pregunta.id]
                  : respuestas[pregunta.id]
                    ? [respuestas[pregunta.id]]
                    : []

                const isChecked = respuestaArray.includes(opcion.id.toString())

                return (
                  <div key={opcion.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`opcion-${opcion.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const currentResponses = Array.isArray(respuestas[pregunta.id])
                          ? [...respuestas[pregunta.id]]
                          : respuestas[pregunta.id]
                            ? [respuestas[pregunta.id]]
                            : []

                        let newResponses
                        if (checked) {
                          newResponses = [...currentResponses, opcion.id.toString()]
                        } else {
                          newResponses = currentResponses.filter((r) => r !== opcion.id.toString())
                        }

                        handleRespuestaChange(pregunta.id, newResponses)
                      }}
                    />
                    <Label htmlFor={`opcion-${opcion.id}`}>{opcion.texto}</Label>
                  </div>
                )
              })}
            </div>
          )}

          {pregunta.tipo === "escala_numerica" && (
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Ingrese un número..."
                value={respuestas[pregunta.id] || ""}
                onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
                className={esPreguntaSinResponder && mostrarAlertaEstacionIncompleta ? "border-red-500" : ""}
              />
            </div>
          )}

          <Separator className="my-4" />

          {/* Sección de comentarios */}
          <div className="space-y-2">
            <Label htmlFor={`comentario-${pregunta.id}`}>Comentario</Label>
            <Textarea
              id={`comentario-${pregunta.id}`}
              placeholder="Agregue un comentario sobre esta respuesta..."
              value={comentarios[pregunta.id] || ""}
              onChange={(e) => handleComentarioChange(pregunta.id, e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={anteriorPregunta}
            disabled={(estacionActual === 0 && preguntaActual === 0) || saving}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <Button variant="secondary" onClick={guardarRespuestaActual} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>

          <Button
            onClick={
              estacionActual === examen.estaciones.length - 1 &&
              preguntaActual === examen.estaciones[estacionActual].preguntas.length - 1
                ? finalizarExamen
                : siguientePregunta
            }
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : estacionActual === examen.estaciones.length - 1 &&
              preguntaActual === examen.estaciones[estacionActual].preguntas.length - 1 ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Completar
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando examen...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-bold">Error</h2>
        <p className="mt-2 text-gray-500">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/evaluador")}>
          Volver a la lista de exámenes
        </Button>
      </div>
    )
  }

  if (!examen) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-bold">Error al cargar el examen</h2>
        <p className="mt-2 text-gray-500">No se pudo cargar la información del examen.</p>
        <Button className="mt-4" onClick={() => router.push("/evaluador")}>
          Volver a la lista de exámenes
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evaluando: {examen.examen_titulo}</h1>
          <p className="text-gray-500">ID Alumno: {examen.alumno_id}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium">Progreso</p>
            <p className="text-sm text-gray-500">{Math.round(progreso)}% completado</p>
          </div>
          <Progress value={progreso} className="w-24" />
        </div>
      </div>

      {/* Alerta de estación incompleta */}
      {mostrarAlertaEstacionIncompleta && (
        <div ref={alertaRef}>
          <Alert variant="destructive" className="mb-4 border-2 border-red-600 bg-red-50">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-lg font-bold text-red-600">¡ATENCIÓN! Estación incompleta</AlertTitle>
            <AlertDescription className="text-red-600">
              <p className="font-semibold">
                Debe responder todas las preguntas de la Estación {estacionActual + 1} antes de continuar. Todas las
                preguntas son obligatorias.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Tabs defaultValue="examen" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="examen">Examen</TabsTrigger>
          <TabsTrigger value="info">Información</TabsTrigger>
        </TabsList>

        <TabsContent value="examen" className="space-y-4">
          {renderPregunta()}

          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => router.push("/evaluador")}>
              Volver a la lista
            </Button>

            {estacionActual === examen.estaciones.length - 1 &&
              preguntaActual === examen.estaciones[estacionActual].preguntas.length - 1 && (
                <Button onClick={finalizarExamen} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Completar Examen
                </Button>
              )}
          </div>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información del examen</CardTitle>
              <CardDescription>Detalles sobre el examen que está evaluando</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alumno</p>
                  <p className="font-medium">
                    {examen.alumno_nombre} {examen.alumno_apellido}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Examen</p>
                  <p className="font-medium">{examen.examen_titulo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant="outline" className="mt-1">
                    {examen.estado}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de inicio</p>
                  <p className="font-medium">{new Date(examen.fecha_inicio).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de finalización</p>
                  <p className="font-medium">{new Date(examen.fecha_fin).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
