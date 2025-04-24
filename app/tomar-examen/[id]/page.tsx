"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, AlertCircle, Save } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/context/auth-context"
import { Slider } from "@/components/ui/slider"
import { Check } from "lucide-react"
// Importar el logger
import logger from "@/lib/logger"

// Componente para mostrar el detalle de un examen asignado a un alumno
export default function TomarExamenDetallePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [examen, setExamen] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("estacion-0")
  const [respuestas, setRespuestas] = useState<{ [key: string]: string }>({})
  const [respuestasOriginales, setRespuestasOriginales] = useState<{ [key: string]: string }>({})
  const [guardando, setGuardando] = useState(false)
  const [estacionCompletada, setEstacionCompletada] = useState<{ [key: string]: boolean }>({})
  const [loadingRetry, setLoadingRetry] = useState(false)
  const [cambiosPendientes, setCambiosPendientes] = useState<{ [key: string]: boolean }>({})
  const contentRef = useRef<HTMLDivElement>(null)

  // Estado para las observaciones de estaciones y del examen
  const [observacionesEstacion, setObservacionesEstacion] = useState<{ [key: string]: string }>({})
  const [observacionesExamen, setObservacionesExamen] = useState<string>("")

  // Estado para la barra de progreso
  const [progresoGuardado, setProgresoGuardado] = useState(0)
  const [mostrarProgreso, setMostrarProgreso] = useState(false)

  // Estado para mostrar alerta de estación incompleta
  const [mostrarAlertaEstacionIncompleta, setMostrarAlertaEstacionIncompleta] = useState(false)
  const [estacionIncompleta, setEstacionIncompleta] = useState<number | null>(null)
  const [preguntasSinResponder, setPreguntasSinResponder] = useState<number[]>([])
  const esExamenDeUnaSolaEstacion = examen?.estaciones?.length === 1

  // Cargar el examen
  useEffect(() => {
    const cargarExamen = async () => {
      try {
        setLoading(true)
        setError(null)

        logger.log(`Cargando examen con ID de asignación: ${params.id}`)

        // Primero obtenemos el evaluador asociado al usuario por su email
        const evaluadorResponse = await fetch(`/api/evaluadores/by-id?userId=${user.id}`)

        if (!evaluadorResponse.ok) {
          if (evaluadorResponse.status === 404) {
            throw new Error(`No se encontró un evaluador con el id ${user.id}`)
          } else {
            const errorText = await evaluadorResponse.text()
            logger.error("Respuesta de error completa:", errorText)
            throw new Error(`Error al obtener el evaluador: ${evaluadorResponse.statusText}`)
          }
        }

        // Obtener el examen asignado
        const response = await fetch(`/api/evaluador/examenes/${params.id}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Error al cargar el examen: ${response.status}`)
        }

        const data = await response.json()
        logger.log("Examen cargado:", data)

        if (!data) {
          throw new Error("No se encontró el examen solicitado")
        }

        // Filtrar solo las estaciones activas
        if (data.estaciones && data.estaciones.length > 0) {
          data.estaciones = data.estaciones.filter((estacion) => estacion.activo !== false)
          logger.log(`Estaciones activas: ${data.estaciones.length}`)
        } else {
          logger.log("No se encontraron estaciones para este examen")
        }

        setExamen(data)

        // Inicializar respuestas con las existentes
        const respuestasIniciales: { [key: string]: string } = {}
        const estacionesCompletadas: { [key: string]: boolean } = {}
        const cambiosPendientesIniciales: { [key: string]: boolean } = {}

        // Verificar si hay estaciones
        if (data.estaciones && data.estaciones.length > 0) {
          data.estaciones.forEach((estacion: any, index: number) => {
            // Verificar si hay preguntas en la estación
            if (estacion.preguntas && estacion.preguntas.length > 0) {
              let todasRespondidas = true
              cambiosPendientesIniciales[`estacion-${index}`] = false

              estacion.preguntas.forEach((pregunta: any) => {
                // Si la pregunta ya tiene respuesta, inicializarla
                if (pregunta.respuesta !== null && pregunta.respuesta !== undefined) {
                  respuestasIniciales[`${pregunta.id}`] = pregunta.respuesta
                } else {
                  todasRespondidas = false
                }
              })

              estacionesCompletadas[`estacion-${index}`] = todasRespondidas
            } else {
              estacionesCompletadas[`estacion-${index}`] = true // Si no hay preguntas, marcar como completada
              cambiosPendientesIniciales[`estacion-${index}`] = false
            }
          })
        }

        setRespuestas(respuestasIniciales)
        setRespuestasOriginales({ ...respuestasIniciales })
        setEstacionCompletada(estacionesCompletadas)
        setCambiosPendientes(cambiosPendientesIniciales)

        // Si el examen está en estado "Pendiente", iniciarlo automáticamente
        if (data.estado === "Pendiente") {
          logger.log("Iniciando examen automáticamente...")
          await iniciarExamen()
        }

        // Determinar la primera estación sin completar
        if (data.estaciones && data.estaciones.length > 0) {
          let primeraEstacionSinCompletar = 0
          for (let i = 0; i < data.estaciones.length; i++) {
            if (!estacionesCompletadas[`estacion-${i}`]) {
              primeraEstacionSinCompletar = i
              break
            }
          }
          setActiveTab(`estacion-${primeraEstacionSinCompletar}`)
          logger.log(`Posicionando en la primera estación sin completar: estacion-${primeraEstacionSinCompletar}`)
        }
      } catch (error) {
        logger.error("Error al cargar el examen:", error)
        setError(error instanceof Error ? error.message : "Error al cargar el examen")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      cargarExamen()
    }
  }, [params.id, user])

  // Detectar cambios en las respuestas para actualizar el estado de cambios pendientes
  useEffect(() => {
    if (!examen || !examen.estaciones) return

    const nuevosCambiosPendientes = { ...cambiosPendientes }

    examen.estaciones.forEach((estacion: any, index: number) => {
      if (!estacion.preguntas || estacion.preguntas.length === 0) return

      let hayPendientes = false

      for (const pregunta of estacion.preguntas) {
        const respuestaActual = respuestas[pregunta.id] || ""
        const respuestaOriginal = respuestasOriginales[pregunta.id] || ""

        if (respuestaActual !== respuestaOriginal) {
          hayPendientes = true
          break
        }
      }

      nuevosCambiosPendientes[`estacion-${index}`] = hayPendientes
    })

    setCambiosPendientes(nuevosCambiosPendientes)
  }, [respuestas, examen, respuestasOriginales])

  // Efecto para hacer scroll al inicio cuando cambia la pestaña activa
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    // Ocultar la alerta de estación incompleta al cambiar de pestaña
    setMostrarAlertaEstacionIncompleta(false)
  }, [activeTab])

  // Iniciar el examen
  const iniciarExamen = async () => {
    try {
      logger.log("Iniciando examen...")
      const response = await fetch(`/api/evaluador/examenes/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "iniciar" }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error("Respuesta de error:", errorText)

        let errorMessage = "Error al iniciar el examen"
        try {
          // Intentar parsear como JSON, si es posible
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // Si no es JSON, usar el texto como está
          errorMessage = `Error al iniciar el examen: ${response.status}`
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      logger.log("Examen iniciado:", data)
      setExamen((prev: any) => ({ ...prev, estado: data.estado, fecha_inicio: data.fecha_inicio }))

      //toast({
      //title: "Examen iniciado",
      //description: "El examen ha sido iniciado correctamente.",
      //})
    } catch (error) {
      logger.error("Error al iniciar el examen:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al iniciar el examen",
        variant: "destructive",
      })
    }
  }

  // Finalizar el examen
  const finalizarExamen = async () => {
    try {
      logger.log("Finalizando examen...")
      setMostrarProgreso(true)
      setProgresoGuardado(10)

      // Calcular la calificación final como promedio de las calificaciones de las estaciones
      let calificacionTotal = 0
      let estacionesConCalificacion = 0

      setProgresoGuardado(30)

      // Obtener los resultados de las estaciones
      const responseResultados = await fetch(`/api/evaluador/resultados-estaciones?alumnoExamenId=${params.id}`)
      if (responseResultados.ok) {
        const resultadosEstaciones = await responseResultados.json()

        if (resultadosEstaciones && resultadosEstaciones.length > 0) {
          resultadosEstaciones.forEach((resultado: any) => {
            if (resultado.calificacion !== null && resultado.calificacion !== undefined) {
              calificacionTotal += Number(resultado.calificacion)
              estacionesConCalificacion++
            }
          })
        }
      }

      setProgresoGuardado(50)

      // Calcular el promedio
      const calificacionFinal = estacionesConCalificacion > 0 ? calificacionTotal / estacionesConCalificacion : 0

      logger.log(`Calificación final calculada: ${calificacionFinal}`)

      // Preparar los datos para finalizar el examen
      const datosFinalizacion = {
        action: "finalizar",
        calificacion: calificacionFinal,
        observaciones: observacionesExamen,
      }

      setProgresoGuardado(70)

      const response = await fetch(`/api/evaluador/examenes/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosFinalizacion),
      })

      setProgresoGuardado(90)

      if (!response.ok) {
        const errorText = await response.text()
        logger.error("Respuesta de error:", errorText)

        let errorMessage = "Error al finalizar el examen"
        try {
          // Intentar parsear como JSON, si es posible
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // Si no es JSON, usar el texto como está
          errorMessage = `Error al finalizar el examen: ${response.status}`
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      logger.log("Examen finalizado:", data)
      setExamen((prev: any) => ({
        ...prev,
        estado: data.estado,
        fecha_fin: data.fecha_fin,
        calificacion: data.calificacion,
        observaciones: data.observaciones,
      }))

      setProgresoGuardado(100)

      // Pequeña pausa para mostrar el 100% antes de ocultar la barra
      setTimeout(() => {
        setMostrarProgreso(false)

        toast({
          title: (
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Examen finalizado. Se guardó correctamente</span>
            </div>
          ),
          variant: "success",
          duration: 5000,
        })

        // Redirigir a la lista de exámenes
        router.push("/tomar-examen")
      }, 500)
    } catch (error) {
      logger.error("Error al finalizar el examen:", error)
      setMostrarProgreso(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al finalizar el examen",
        variant: "destructive",
      })
    }
  }

  // Verificar si todas las preguntas de la estación actual están respondidas
  const verificarEstacionCompleta = (estacionIndex: number) => {
    if (!examen || !examen.estaciones || !examen.estaciones[estacionIndex]) return true

    const estacion = examen.estaciones[estacionIndex]
    if (!estacion.preguntas || estacion.preguntas.length === 0) return true

    const preguntasFaltantes: number[] = []

    for (const pregunta of estacion.preguntas) {
      const respuestaActual = respuestas[pregunta.id]
      if (respuestaActual === undefined || respuestaActual === "") {
        preguntasFaltantes.push(pregunta.id)
      }
    }

    if (preguntasFaltantes.length > 0) {
      setPreguntasSinResponder(preguntasFaltantes)
      setEstacionIncompleta(estacionIndex)
      return false
    }

    return true
  }

  // Manejar cambio de respuesta
  const handleRespuestaChange = (preguntaId: number, valor: string) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }))

    // Si hay una alerta de estación incompleta, verificar si ahora está completa
    if (mostrarAlertaEstacionIncompleta) {
      const estacionIndex = Number(activeTab.replace("estacion-", ""))
      if (verificarEstacionCompleta(estacionIndex)) {
        setMostrarAlertaEstacionIncompleta(false)
      } else {
        // Actualizar la lista de preguntas sin responder
        const estacion = examen.estaciones[estacionIndex]
        const nuevasPreguntasFaltantes: number[] = []

        for (const pregunta of estacion.preguntas) {
          const respuestaActual = respuestas[pregunta.id]
          if (pregunta.id !== preguntaId && (respuestaActual === undefined || respuestaActual === "")) {
            nuevasPreguntasFaltantes.push(pregunta.id)
          }
        }

        setPreguntasSinResponder(nuevasPreguntasFaltantes)
      }
    }
  }

  // Manejar clic en el botón "Guardar"
  const handleGuardarClick = async (estacionIndex: number) => {
    if (esExamenDeUnaSolaEstacion) {
      await guardarYFinalizarExamen(estacionIndex)
      return
    }

    // Verificar si todas las preguntas están respondidas
    if (!verificarEstacionCompleta(estacionIndex)) {
      setMostrarAlertaEstacionIncompleta(true)

      // Hacer scroll al mensaje de alerta
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }

      return
    }

    try {
      setGuardando(true)
      setMostrarProgreso(true)
      setProgresoGuardado(10)

      const estacionActual = examen.estaciones[estacionIndex]

      // Preparar las respuestas a guardar
      const respuestasAGuardar = []

      for (const pregunta of estacionActual.preguntas) {
        const respuestaActual = respuestas[pregunta.id]
        const respuestaOriginal = respuestasOriginales[pregunta.id]

        // Solo guardar si hay cambios
        if (respuestaActual !== undefined && respuestaActual !== respuestaOriginal) {
          respuestasAGuardar.push({
            alumno_examen_id: Number(params.id),
            pregunta_id: pregunta.id,
            respuesta_texto: respuestaActual,
          })
        }
      }

      setProgresoGuardado(30)

      // Si no hay respuestas para guardar, avanzar directamente
      if (respuestasAGuardar.length === 0) {
        // Verificar si todas las preguntas tienen respuesta
        const todasRespondidas = estacionActual.preguntas.every(
          (pregunta: any) => respuestas[pregunta.id] !== undefined && respuestas[pregunta.id] !== "",
        )

        if (todasRespondidas) {
          setProgresoGuardado(50)
          // Guardar resultado de la estación
          await guardarResultadoEstacion(estacionActual, estacionIndex)

          setProgresoGuardado(80)

          setEstacionCompletada((prev) => ({ ...prev, [`estacion-${estacionIndex}`]: true }))

          setProgresoGuardado(100)

          // Pequeña pausa para mostrar el 100% antes de ocultar la barra
          setTimeout(() => {
            setMostrarProgreso(false)

            // Avanzar a la siguiente estación automáticamente
            if (estacionIndex < examen.estaciones.length - 1) {
              setActiveTab(`estacion-${estacionIndex + 1}`)
            } else {
              // Si es la última estación, finalizar el examen automáticamente
              finalizarExamen()
            }
          }, 500)
        } else {
          setMostrarProgreso(false)
        }

        setGuardando(false)
        return true
      }

      // Guardar todas las respuestas en una sola llamada
      const response = await fetch("/api/evaluador/respuestas/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          respuestas: respuestasAGuardar,
        }),
      })

      setProgresoGuardado(50)

      if (!response.ok) {
        const contentType = response.headers.get("content-type")

        if (!contentType?.includes("application/json")) {
          const errorText = await response.text()
          logger.error("Respuesta no es JSON:", errorText)
          throw new Error(`Error al guardar las respuestas: Respuesta del servidor no es JSON`)
        }
        const contentTypeHeader = response.headers.get("content-type")

        if (contentTypeHeader?.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Error al guardar las respuestas: ${response.status}`)
        } else {
          const errorText = await response.text()
          logger.error("Respuesta de error NO JSON:", errorText)
          throw new Error(`Error inesperado del servidor. Código ${response.status}`)
        }
      }

      const data = await response.json()
      logger.log("Respuestas guardadas:", data)

      // Actualizar respuestas originales
      const nuevasRespuestasOriginales = { ...respuestasOriginales }
      for (const respuesta of respuestasAGuardar) {
        nuevasRespuestasOriginales[respuesta.pregunta_id] = respuesta.respuesta_texto
      }
      setRespuestasOriginales(nuevasRespuestasOriginales)

      setProgresoGuardado(70)

      toast({
        title: "Respuestas guardadas",
        description: `${respuestasAGuardar.length} respuestas guardadas correctamente.`,
        duration: 2000,
      })

      // Verificar si todas las preguntas tienen respuesta
      const todasRespondidas = estacionActual.preguntas.every(
        (pregunta: any) => respuestas[pregunta.id] !== undefined && respuestas[pregunta.id] !== "",
      )

      if (todasRespondidas) {
        // Guardar resultado de la estación
        await guardarResultadoEstacion(estacionActual, estacionIndex)

        setProgresoGuardado(90)

        setEstacionCompletada((prev) => ({ ...prev, [`estacion-${estacionIndex}`]: true }))

        setProgresoGuardado(100)

        // Pequeña pausa para mostrar el 100% antes de ocultar la barra
        setTimeout(() => {
          setMostrarProgreso(false)

          // Avanzar a la siguiente estación automáticamente
          if (estacionIndex < examen.estaciones.length - 1) {
            setActiveTab(`estacion-${estacionIndex + 1}`)
          } else {
            // Si es la última estación, finalizar el examen automáticamente
            finalizarExamen()
          }
        }, 500)
      } else {
        setMostrarProgreso(false)
      }

      return true
    } catch (error) {
      logger.error("Error al guardar las respuestas:", error)
      setMostrarProgreso(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar las respuestas",
        variant: "destructive",
      })
      return false
    } finally {
      setGuardando(false)
    }
  }

  // Guardar el resultado de una estación
  const guardarResultadoEstacion = async (estacion: any, estacionIndex: number) => {
    try {
      logger.log(`Guardando resultado para estación ${estacion.id}`)

      // Calcular el puntaje total sumando los puntajes de las respuestas
      let puntajeTotal = 0

      for (const pregunta of estacion.preguntas) {
        const respuestaActual = respuestas[pregunta.id].toLowerCase()

        // Si hay respuesta y la pregunta tiene puntaje
        if (respuestaActual !== undefined && pregunta.puntaje) {
          const puntajePregunta = Number(pregunta.puntaje) || 0

          // Evaluar según el tipo de respuesta
          if (respuestaActual === "si") {
            // Si la respuesta es "SI", corresponde el 100% del puntaje
            puntajeTotal += puntajePregunta
          } else if (respuestaActual === "parcialmente") {
            // Si la respuesta es "parcialmente", corresponde el 50% del puntaje
            puntajeTotal += puntajePregunta * 0.5
          }
          // Si la respuesta es "NO" o cualquier otra, corresponde 0 puntos (no sumamos nada)
        }
      }

      logger.log(`Puntaje calculado para estación ${estacion.id}: ${puntajeTotal}`)

      // Obtener las observaciones de la estación
      const observaciones = observacionesEstacion[`estacion-${estacionIndex}`] || ""

      // Preparar el objeto de resultado
      const resultado = {
        alumno_examen_id: Number(params.id),
        estacion_id: estacion.id,
        calificacion: puntajeTotal,
        observaciones: observaciones,
        fecha_evaluacion: new Date().toISOString(),
      }

      // Guardar el resultado
      const response = await fetch("/api/evaluador/resultados-estaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultado),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error al guardar el resultado de la estación: ${response.status}`)
      }

      const data = await response.json()
      logger.log("Resultado de estación guardado:", data)

      toast({
        title: "Estación completada",
        description: `Puntaje total: ${puntajeTotal} puntos`,
        duration: 2000,
      })

      return data
    } catch (error) {
      logger.error("Error al guardar el resultado de la estación:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar el resultado de la estación",
        variant: "destructive",
      })
      return null
    }
  }

  // Renderizar opciones de respuesta según el tipo de pregunta
  const renderOpcionesPregunta = (pregunta: any) => {
    const respuestaActual = respuestas[pregunta.id] || ""
    const esPreguntaSinResponder = preguntasSinResponder.includes(pregunta.id)

    switch (pregunta.tipo) {
      case "texto_libre":
        return (
          <Textarea
            className={`w-full ${esPreguntaSinResponder ? "border-red-500 border-2" : ""}`}
            rows={4}
            value={respuestaActual}
            onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
            disabled={examen.estado === "Completado"}
            placeholder="Escriba su respuesta aquí..."
          />
        )
      case "opcion_unica":
        return (
          <div className={`space-y-4 ${esPreguntaSinResponder ? "border-red-500 border-2 p-3 rounded-md" : ""}`}>
            {pregunta.opciones?.map((opcion: any) => {
              const isSelected = respuestaActual === opcion.texto
              return (
                <div
                  key={opcion.id}
                  className="flex items-center justify-between border p-3 rounded-lg bg-white shadow-sm"
                >
                  <Label htmlFor={`opcion-${opcion.id}`} className="flex-1 cursor-pointer pr-4">
                    {opcion.texto}
                  </Label>
                  <Switch
                    id={`opcion-${opcion.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleRespuestaChange(pregunta.id, opcion.texto)
                      } else if (isSelected) {
                        // Si está seleccionado y se desmarca, limpiamos la respuesta
                        handleRespuestaChange(pregunta.id, "")
                      }
                    }}
                    disabled={examen.estado === "Completado"}
                    className="scale-125 data-[state=checked]:bg-primary"
                  />
                </div>
              )
            })}
          </div>
        )
      case "opcion_multiple":
        // Convertir la respuesta actual a un array si existe
        const respuestasSeleccionadas = respuestaActual ? respuestaActual.split(",") : []

        return (
          <div className={`space-y-3 ${esPreguntaSinResponder ? "border-red-500 border-2 p-3 rounded-md" : ""}`}>
            {pregunta.opciones?.map((opcion: any) => (
              <div key={opcion.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`opcion-${opcion.id}`}
                  checked={respuestasSeleccionadas.includes(opcion.texto)}
                  onCheckedChange={(checked) => {
                    const valor = opcion.texto
                    let nuevasRespuestas = [...respuestasSeleccionadas]

                    if (checked) {
                      nuevasRespuestas.push(valor)
                    } else {
                      nuevasRespuestas = nuevasRespuestas.filter((r) => r !== valor)
                    }

                    handleRespuestaChange(pregunta.id, nuevasRespuestas.join(","))
                  }}
                  disabled={examen.estado === "Completado"}
                />
                <Label htmlFor={`opcion-${opcion.id}`} className="cursor-pointer">
                  {opcion.texto}
                </Label>
              </div>
            ))}
          </div>
        )
      case "escala_numerica":
        return (
          <div className={`space-y-3 ${esPreguntaSinResponder ? "border-red-500 border-2 p-3 rounded-md" : ""}`}>
            <Label htmlFor={`escala-${pregunta.id}`}>Seleccione un valor:</Label>
            <Slider
              id={`escala-${pregunta.id}`}
              defaultValue={[0]}
              max={10}
              step={1}
              aria-label="Volumen"
              value={respuestas[pregunta.id] ? [Number.parseInt(respuestas[pregunta.id])] : [0]}
              onValueChange={(value) => handleRespuestaChange(pregunta.id, value[0].toString())}
              disabled={examen.estado === "Completado"}
            />
            <p className="text-sm text-muted-foreground">Valor seleccionado: {respuestas[pregunta.id] || "Ninguno"}</p>
          </div>
        )
      default:
        return <p className="text-red-500">Tipo de pregunta no soportado: {pregunta.tipo}</p>
    }
  }

  // Reintentar carga
  const handleRetry = () => {
    setLoadingRetry(true)
    setError(null)

    // Recargar la página después de un breve retraso
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  // Modificar la función guardarYFinalizarExamen para mejorar el manejo de errores
  const guardarYFinalizarExamen = async (estacionIndex: number) => {
   // Verificar si todas las preguntas están respondidas
    if (!verificarEstacionCompleta(estacionIndex)) {
      setMostrarAlertaEstacionIncompleta(true)

      // Hacer scroll al mensaje de alerta
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }

      return
    }
   
    try {
      setGuardando(true)
      setMostrarProgreso(true)
      setProgresoGuardado(10)

      const estacionActual = examen.estaciones[estacionIndex]
      const alumnoExamenId = Number(params.id)

      // Preparar respuestas
      const respuestasAGuardar = estacionActual.preguntas.map((pregunta: any) => {
        const respuestaUsuario = respuestas[pregunta.id]?.toLowerCase() || ""
        const puntajePregunta = Number(pregunta.puntaje) || 0

        let puntajeObtenido = 0
        if (respuestaUsuario === "si") {
          puntajeObtenido = puntajePregunta
        } else if (respuestaUsuario === "parcialmente") {
          puntajeObtenido = puntajePregunta * 0.5
        }

        return {
          alumno_examen_id: alumnoExamenId,
          pregunta_id: pregunta.id,
          respuesta_texto: respuestaUsuario,
          puntaje: puntajeObtenido,
        }
      })

      logger.log("Respuestas a guardar:", respuestasAGuardar)

      // Calcular puntaje de la estación
      let puntajeTotal = 0
      for (const pregunta of estacionActual.preguntas) {
        const respuestaActual = respuestas[pregunta.id]?.toLowerCase() || ""
        const puntajePregunta = Number(pregunta.puntaje) || 0

        if (respuestaActual === "si") {
          puntajeTotal += puntajePregunta
        } else if (respuestaActual === "parcialmente") {
          puntajeTotal += puntajePregunta * 0.5
        }
      }

      setProgresoGuardado(40)

      // Calcular calificación final solo con esta estación (sin fetch al backend)
      const estacionesCompletadas = examen.estaciones.filter((_, i) => estacionCompletada[`estacion-${i}`] === true)
      const puntajesPrevios = estacionesCompletadas.map((_, i) => {
        return examen.estaciones[i].puntaje_guardado || 0
      })

      const sumaPrevios = puntajesPrevios.reduce((acc, val) => acc + val, 0)
      const totalEstaciones = estacionesCompletadas.length + 1 // Esta estación todavía no estaba marcada como completa
      const calificacionFinal = (sumaPrevios + puntajeTotal) / totalEstaciones

      setProgresoGuardado(60)

      // Datos a enviar
      const datosFinalizacion = {
        alumno_examen_id: alumnoExamenId,
        estacion_id: estacionActual.id,
        respuestas: respuestasAGuardar,
        puntaje_estacion: puntajeTotal,
        observaciones_estacion: observacionesEstacion[`estacion-${estacionIndex}`] || "",
        calificacion_examen: calificacionFinal,
        observaciones_examen: observacionesExamen || "",
      }

      logger.log("Datos a enviar:", JSON.stringify(datosFinalizacion))
      logger.log("Token en header:", localStorage.getItem("token"))

      // Corregir la URL del endpoint (eliminar espacios)
      const response = await fetch("/api/evaluador/finalizar-estacion-examen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosFinalizacion),
      })

      // Mejorar el manejo de errores para obtener más información
      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        let errorMessage = `Error del servidor: ${response.status} ${response.statusText}`

        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
            logger.error("Error detallado:", errorData)
          } else {
            const errorText = await response.text()
            logger.error("Respuesta de error (texto):", errorText)
          }
        } catch (parseError) {
          logger.error("Error al parsear la respuesta:", parseError)
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      logger.log("Respuesta exitosa:", data)

      setProgresoGuardado(100)

      toast({
        title: (
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            <span>Examen finalizado. Se guardó correctamente</span>
          </div>
        ),
        className: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg",
        variant: "success",
        duration: 2000,
      })

      // Redirigir luego de una pausa
      setTimeout(() => {
        setMostrarProgreso(false)
        router.push("/tomar-examen")
      }, 500)
    } catch (error) {
      logger.error("Error en guardarYFinalizarExamen:", error)
      setMostrarProgreso(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Fallo el guardado final",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>No se pudo cargar el examen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-4">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-center mb-4">{error}</p>
              <Button onClick={handleRetry} disabled={loadingRetry}>
                {loadingRetry ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reintentando...
                  </>
                ) : (
                  "Reintentar"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!examen) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Examen no encontrado</CardTitle>
            <CardDescription>No se encontró el examen solicitado</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/tomar-examen")}>Volver a la lista</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="shadow-lg">
        <CardHeader ref={contentRef} className="border-b flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl text-primary">{examen.examen_titulo || examen.titulo}</CardTitle>
            <CardDescription>
              Fecha: {examen.fecha_aplicacion ? new Date(examen.fecha_aplicacion).toLocaleDateString() : "No iniciada"} | Estado: {examen.estado}
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-primary">
              Cofia: #{examen.numero_identificacion || "Sin asignar"}
            </span>
          </div>
        </CardHeader>

        {/* Alerta de estación incompleta */}
        {mostrarAlertaEstacionIncompleta && (
          <div className="px-6 py-4 bg-red-50 border-y border-red-200">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 font-medium">¡ATENCIÓN! Estación incompleta</h3>
                <p className="text-red-700 text-sm mt-1">
                  Debe responder todas las preguntas de la Estación{" "}
                  {estacionIncompleta !== null ? estacionIncompleta + 1 : ""} antes de continuar. Todas las preguntas
                  son obligatorias.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Barra de progreso - Ahora más visible y con un mensaje más claro */}
        {mostrarProgreso && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center mb-2">
              <Save className="h-5 w-5 text-blue-500 mr-2 animate-pulse" />
              <div className="text-sm font-medium text-blue-700">
                {progresoGuardado < 100 ? "Guardando datos en el servidor..." : "¡Guardado completado!"}
              </div>
              <div className="ml-auto text-xs text-blue-600 font-mono">{progresoGuardado}%</div>
            </div>
            <Progress value={progresoGuardado} className="h-3 bg-blue-100" />
          </div>
        )}

        <CardContent className="pt-6">
          {examen.estaciones && examen.estaciones.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="mb-6 overflow-x-auto">
                <TabsList className="inline-flex w-full justify-start h-auto p-1 bg-muted/20">
                  {examen.estaciones.map((estacion: any, index: number) => (
                    <TabsTrigger
                      key={estacion.id}
                      value={`estacion-${index}`}
                      className="relative px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
                    >
                      {estacion.titulo}
                      {estacionCompletada[`estacion-${index}`] && (
                        <CheckCircle className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
                      )}
                      {cambiosPendientes[`estacion-${index}`] && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full"></span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {examen.estaciones.map((estacion: any, index: number) => (
                <TabsContent key={estacion.id} value={`estacion-${index}`} className="border rounded-lg p-4">
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h3 className="text-xl font-medium">{estacion.titulo}</h3>
                      <p className="text-sm text-gray-500 mt-1">{estacion.descripcion}</p>
                    </div>

                    {estacion.preguntas && estacion.preguntas.length > 0 ? (
                      <div className="space-y-8">
                        {/* Verificar si todas las preguntas son de tipo "opcion_unica" */}
                        {estacion.preguntas.every((pregunta: any) => pregunta.tipo === "opcion_unica") ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-200">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                                    Ítem Evaluado
                                  </th>
                                  <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium">
                                    Sí
                                  </th>
                                  <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium">
                                    Parcial
                                  </th>
                                  <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium">
                                    No
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {estacion.preguntas.map((pregunta: any, pregIndex: number) => {
                                  const respuestaActual = respuestas[pregunta.id] || ""
                                  const esPreguntaSinResponder = preguntasSinResponder.includes(pregunta.id)
                                  const rowClass = esPreguntaSinResponder ? "border-2 border-red-500" : ""

                                  // Determinar si la pregunta tiene solo dos opciones (SÍ y NO)
                                  const opciones = pregunta.opciones?.map((op: any) => op.texto.toLowerCase()) || []
                                  const esPreguntaSiNo =
                                    opciones.length === 2 && opciones.includes("si") && opciones.includes("no")

                                  // Función para manejar el Cambio de opción, asegurando exclusividad
                                  const handleOpcionChange = (opcion: string) => {
                                    if (respuestaActual === opcion) {
                                      // Si la opción ya está seleccionada, desmarcarla
                                      handleRespuestaChange(pregunta.id, "")
                                    } else {
                                      // Seleccionar la nueva opción
                                      handleRespuestaChange(pregunta.id, opcion)
                                    }
                                  }

                                  return (
                                    <tr key={pregunta.id} className={rowClass}>
                                      <td className="border border-gray-200 px-4 py-2 text-sm">
                                        <span className="font-medium mr-2">{pregIndex + 1}.</span>
                                        {pregunta.texto}
                                      </td>
                                      <td className="border border-gray-200 px-4 py-2 text-center">
                                        <Switch
                                          checked={respuestaActual === "si"}
                                          onCheckedChange={() => handleOpcionChange("si")}
                                          disabled={examen.estado === "Completado"}
                                          className="scale-125 data-[state=checked]:bg-primary"
                                        />
                                      </td>
                                      <td className="border border-gray-200 px-4 py-2 text-center">
                                        <Switch
                                          checked={respuestaActual === "parcialmente"}
                                          onCheckedChange={() => handleOpcionChange("parcialmente")}
                                          disabled={examen.estado === "Completado" || esPreguntaSiNo} // Deshabilitar si es pregunta SÍ/NO
                                          className={`scale-125 ${
                                            esPreguntaSiNo
                                              ? "opacity-50 cursor-not-allowed"
                                              : "data-[state=checked]:bg-primary"
                                          }`}
                                        />
                                      </td>
                                      <td className="border border-gray-200 px-4 py-2 text-center">
                                        <Switch
                                          checked={respuestaActual === "no"}
                                          onCheckedChange={() => handleOpcionChange("no")}
                                          disabled={examen.estado === "Completado"}
                                          className="scale-125 data-[state=checked]:bg-primary"
                                        />
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          /* Renderizado original para otros tipos de preguntas */
                          <div className="space-y-8">
                            {estacion.preguntas.map((pregunta: any, pregIndex: number) => (
                              <div key={pregunta.id} className="bg-gray-50 p-6 rounded-lg shadow-sm">
                                <h4 className="font-medium mb-4 text-lg flex items-center">
                                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                                    {pregIndex + 1}
                                  </span>
                                  {pregunta.texto}
                                  {preguntasSinResponder.includes(pregunta.id) && (
                                    <span className="ml-2 text-red-500 text-sm font-normal">* Obligatoria</span>
                                  )}
                                </h4>
                                <div className="mt-4">{renderOpcionesPregunta(pregunta)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p>No hay preguntas en esta estación.</p>
                    )}

                    <div className="mt-6 border-t pt-4">
                      <h4 className="font-medium mb-2">Observaciones (opcional)</h4>
                      <Textarea
                        placeholder="Ingrese observaciones para esta estación..."
                        value={observacionesEstacion[`estacion-${index}`] || ""}
                        onChange={(e) =>
                          setObservacionesEstacion((prev) => ({
                            ...prev,
                            [`estacion-${index}`]: e.target.value,
                          }))
                        }
                        disabled={examen.estado === "Completado"}
                        className="w-full"
                        rows={3}
                      />
                    </div>

                    {examen.estado !== "Completado" && (
                      <div className="flex justify-end mt-6">
                        <Button
                          onClick={() => handleGuardarClick(index)}
                          disabled={guardando}
                          className="px-6"
                          size="lg"
                        >
                          {guardando ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                            </>
                          ) : cambiosPendientes[`estacion-${index}`] ? (
                            "Guardar"
                          ) : (
                            "Completar"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="py-8 text-center">
              <p className="text-lg text-gray-600">No hay estaciones definidas para este examen.</p>
              <p className="text-sm text-gray-500 mt-2">Contacte al administrador para agregar estaciones.</p>
            </div>
          )}
        </CardContent>
        {examen &&
          examen.estaciones &&
          examen.estaciones.length > 0 &&
          estacionCompletada &&
          Object.keys(estacionCompletada).length === examen.estaciones.length &&
          Object.values(estacionCompletada).every(Boolean) &&
          examen.estado !== "Completado" && (
            <div className="mt-6 border-t pt-4 px-6 pb-4">
              <h3 className="text-xl font-medium mb-4">Finalizar Examen</h3>
              <p className="mb-4">
                Todas las estaciones han sido completadas. Puede agregar observaciones finales antes de finalizar el
                examen.
              </p>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Observaciones finales (opcional)</h4>
                <Textarea
                  placeholder="Ingrese observaciones finales para este examen..."
                  value={observacionesExamen}
                  onChange={(e) => setObservacionesExamen(e.target.value)}
                  className="w-full"
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={finalizarExamen} disabled={guardando} className="px-6" size="lg">
                  Finalizar Examen
                </Button>
              </div>
            </div>
          )}
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={() => router.push("/tomar-examen")}>
            Volver a la lista
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
