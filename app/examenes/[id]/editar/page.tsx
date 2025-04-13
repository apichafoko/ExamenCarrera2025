"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Calendar,
  ListChecks,
  HelpCircle,
  Loader2,
  X,
  Users,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { examenesService } from "@/lib/db-service"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function EditarExamenPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const id = Number.parseInt(params.id)
  const [isLoading, setIsLoading] = useState(true)
  const [examen, setExamen] = useState<any>({
    id: 0,
    titulo: "",
    descripcion: "",
    fecha_aplicacion: "",
    estado: "",
    estaciones: [],
    evaluadores: [],
  })
  const [error, setError] = useState<string | null>(null)
  const [evaluadores, setEvaluadores] = useState<any[]>([])
  const [selectedEvaluadores, setSelectedEvaluadores] = useState<number[]>([])
  const [deletedItems, setDeletedItems] = useState<{
    estaciones: number[]
    preguntas: number[]
    opciones: number[]
  }>({
    estaciones: [],
    preguntas: [],
    opciones: [],
  })

  // Estados para el sistema de navegación por pestañas
  const [activeTab, setActiveTab] = useState("general")
  const [activeEstacionTab, setActiveEstacionTab] = useState<string | null>(null)
  const [expandedPreguntas, setExpandedPreguntas] = useState<Record<number, boolean>>({})
  const [cambiosPendientes, setCambiosPendientes] = useState<Record<string, boolean>>({})

  const tiposPregunta = [
    { value: "texto_libre", label: "Texto Libre" },
    { value: "opcion_unica", label: "Una opción correcta (radio)" },
    { value: "opcion_multiple", label: "Varias opciones correctas (checkbox)" },
    { value: "listado", label: "Listado" },
    { value: "escala_numerica", label: "Escala numérica" },
  ]

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsLoading(true)

        // Cargar examen directamente desde la API
        const response = await fetch(`/api/examenes/${id}`)
        if (!response.ok) {
          throw new Error("Error al cargar el examen")
        }

        const examenData = await response.json()
        console.log("Datos del examen recibidos:", examenData)

        if (!examenData) {
          setError("No se encontró el examen solicitado")
          return
        }

        // Asegurarse de que existan las propiedades necesarias
        const examenFormateado = {
          id: examenData.id,
          titulo: examenData.titulo || "",
          descripcion: examenData.descripcion || "",
          fecha_aplicacion: examenData.fecha_aplicacion || "",
          estado: examenData.estado || "",
          estaciones: examenData.estaciones || [],
          evaluadores: examenData.evaluadores || [],
        }

        // Asegurarse de que todas las estaciones tengan la propiedad activo
        examenFormateado.estaciones = examenFormateado.estaciones.map((estacion) => ({
          ...estacion,
          activo: estacion.activo !== undefined ? estacion.activo : true,
          preguntas: (estacion.preguntas || []).map((pregunta) => {
            // Procesar las opciones para cada pregunta
            if (pregunta.opciones && pregunta.opciones.length > 0) {
              pregunta.opciones = pregunta.opciones.map((opcion) => ({
                ...opcion,
                // Convertir es_correcta a correcta para mantener consistencia en la UI
                correcta: opcion.es_correcta !== undefined ? opcion.es_correcta : false,
              }))
            }
            return pregunta
          }),
        }))

        console.log("Examen formateado:", examenFormateado)
        setExamen(examenFormateado)

        // Si hay estaciones, seleccionar la primera por defecto
        if (examenFormateado.estaciones && examenFormateado.estaciones.length > 0) {
          setActiveEstacionTab(examenFormateado.estaciones[0].id.toString())
        }

        // Si el examen tiene evaluadores, seleccionarlos
        if (examenFormateado.evaluadores && examenFormateado.evaluadores.length > 0) {
          setSelectedEvaluadores(examenFormateado.evaluadores.map((e) => e.id))
        }

        // Cargar evaluadores
        const evaluadoresResponse = await fetch("/api/evaluadores")
        if (!evaluadoresResponse.ok) {
          throw new Error("Error al cargar evaluadores")
        }
        const evaluadoresData = await evaluadoresResponse.json()
        setEvaluadores(evaluadoresData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setError("Ocurrió un error al cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [id])

  const toggleExpandPregunta = (preguntaId: number) => {
    setExpandedPreguntas((prev) => ({
      ...prev,
      [preguntaId]: !prev[preguntaId],
    }))
  }

  const handleAddEstacion = () => {
    if (!examen) return

    const nuevaEstacion = {
      id: -Date.now(), // ID temporal negativo para indicar que es nuevo
      examen_id: examen.id,
      titulo: `Estación ${examen.estaciones.length + 1}`,
      descripcion: "",
      duracion_minutos: 15,
      orden: examen.estaciones.length + 1,
      activo: true, // Por defecto, las nuevas estaciones están activas
      preguntas: [],
      es_nuevo: true, // Marcador para identificar nuevas estaciones
    }

    const newExamen = {
      ...examen,
      estaciones: [...examen.estaciones, nuevaEstacion],
    }

    setExamen(newExamen)

    // Seleccionar la nueva estación
    setActiveTab("estaciones")
    setActiveEstacionTab(nuevaEstacion.id.toString())
  }

  const handleRemoveEstacion = (estacionId: number) => {
    if (!examen) return

    if (confirm("¿Estás seguro de que deseas eliminar esta estación? Esta acción no se puede deshacer.")) {
      const estacion = examen.estaciones.find((e: any) => e.id === estacionId)
      const nuevasEstaciones = examen.estaciones.filter((e: any) => e.id !== estacionId)

      setExamen({
        ...examen,
        estaciones: nuevasEstaciones,
      })

      // Si la estación tiene un ID positivo (existe en la BD), registrarla como eliminada
      if (estacion && estacion.id > 0) {
        setDeletedItems((prev) => ({
          ...prev,
          estaciones: [...prev.estaciones, estacionId],
        }))
      }

      // Actualizar la pestaña activa si es necesario
      if (activeEstacionTab === estacionId.toString()) {
        if (nuevasEstaciones.length > 0) {
          setActiveEstacionTab(nuevasEstaciones[0].id.toString())
        } else {
          setActiveEstacionTab(null)
        }
      }

      toast({
        title: "Estación eliminada",
        description: "La estación ha sido eliminada de la vista previa.",
      })
    }
  }

  const handleToggleEstacionActiva = (estacionId: number) => {
    if (!examen) return

    const estacionIndex = examen.estaciones.findIndex((e: any) => e.id === estacionId)
    if (estacionIndex === -1) return

    const nuevasEstaciones = [...examen.estaciones]
    nuevasEstaciones[estacionIndex].activo = !nuevasEstaciones[estacionIndex].activo

    setExamen({
      ...examen,
      estaciones: nuevasEstaciones,
    })

    toast({
      title: nuevasEstaciones[estacionIndex].activo ? "Estación activada" : "Estación desactivada",
      description: `La estación "${nuevasEstaciones[estacionIndex].titulo}" ha sido ${nuevasEstaciones[estacionIndex].activo ? "activada" : "desactivada"}.`,
    })
  }

  const handleAddPregunta = (estacionId: number) => {
    if (!examen) return

    const estacionIndex = examen.estaciones.findIndex((e: any) => e.id === estacionId)
    if (estacionIndex === -1) return

    const nuevaPregunta = {
      id: -Date.now(), // ID temporal negativo para indicar que es nuevo
      estacion_id: estacionId,
      texto: "",
      tipo: "texto_libre",
      obligatoria: true,
      orden: examen.estaciones[estacionIndex].preguntas.length + 1,
      valor_minimo: null,
      valor_maximo: null,
      puntaje: 1, // Valor predeterminado para puntaje
      es_nuevo: true, // Marcador para identificar nuevas preguntas
    }

    const nuevasEstaciones = [...examen.estaciones]
    nuevasEstaciones[estacionIndex].preguntas.push(nuevaPregunta)

    setExamen({
      ...examen,
      estaciones: nuevasEstaciones,
    })

    // Expandir la nueva pregunta
    setExpandedPreguntas((prev) => ({
      ...prev,
      [nuevaPregunta.id]: true,
    }))
  }

  const handleRemovePregunta = (estacionId: number, preguntaId: number) => {
    if (!examen) return

    const estacionIndex = examen.estaciones.findIndex((e: any) => e.id === estacionId)
    if (estacionIndex === -1) return

    const pregunta = examen.estaciones[estacionIndex].preguntas.find((p: any) => p.id === preguntaId)
    const nuevasPreguntas = examen.estaciones[estacionIndex].preguntas.filter((p: any) => p.id !== preguntaId)

    const nuevasEstaciones = [...examen.estaciones]
    nuevasEstaciones[estacionIndex].preguntas = nuevasPreguntas

    setExamen({
      ...examen,
      estaciones: nuevasEstaciones,
    })

    // Si la pregunta tiene un ID positivo (existe en la BD), registrarla como eliminada
    if (pregunta && pregunta.id > 0) {
      setDeletedItems((prev) => ({
        ...prev,
        preguntas: [...prev.preguntas, preguntaId],
      }))
    }

    // Eliminar la pregunta de las expandidas
    const newExpandedPreguntas = { ...expandedPreguntas }
    delete newExpandedPreguntas[preguntaId]
    setExpandedPreguntas(newExpandedPreguntas)
  }

  const handleEstacionChange = (estacionId: number, field: string, value: string) => {
    if (!examen) return

    const estacionIndex = examen.estaciones.findIndex((e: any) => e.id === estacionId)
    if (estacionIndex === -1) return

    const nuevasEstaciones = [...examen.estaciones]
    nuevasEstaciones[estacionIndex][field] = value

    setExamen({
      ...examen,
      estaciones: nuevasEstaciones,
    })
  }

  const handlePreguntaChange = (estacionId: number, preguntaId: number, field: string, value: any) => {
    if (!examen) return

    const estacionIndex = examen.estaciones.findIndex((e: any) => e.id === estacionId)
    if (estacionIndex === -1) return

    const preguntaIndex = examen.estaciones[estacionIndex].preguntas.findIndex((p: any) => p.id === preguntaId)
    if (preguntaIndex === -1) return

    const nuevasEstaciones = [...examen.estaciones]

    // Si cambiamos el tipo de pregunta, inicializamos las propiedades específicas
    if (field === "tipo") {
      const nuevaPregunta = {
        ...nuevasEstaciones[estacionIndex].preguntas[preguntaIndex],
        [field]: value,
      }

      // Inicializar propiedades según el tipo
      if (value === "opcion_unica" || value === "opcion_multiple") {
        nuevaPregunta.opciones = [
          { id: -Date.now(), texto: "Opción 1", correcta: value === "opcion_unica", es_nuevo: true },
          { id: -(Date.now() + 1), texto: "Opción 2", correcta: false, es_nuevo: true },
        ]
      } else if (value === "listado") {
        nuevaPregunta.opciones = [
          { id: -Date.now(), texto: "Elemento 1", es_nuevo: true },
          { id: -(Date.now() + 1), texto: "Elemento 2", es_nuevo: true },
        ]
      } else if (value === "escala_numerica") {
        nuevaPregunta.valor_minimo = 1
        nuevaPregunta.valor_maximo = 10
      }

      nuevasEstaciones[estacionIndex].preguntas[preguntaIndex] = nuevaPregunta
    } else {
      nuevasEstaciones[estacionIndex].preguntas[preguntaIndex][field] = value
    }

    setExamen({
      ...examen,
      estaciones: nuevasEstaciones,
    })
  }

  const handleAddOpcion = (estacionId: number, preguntaId: number) => {
    if (!examen) return

    const estacionIndex = examen.estaciones.findIndex((e: any) => e.id === estacionId)
    if (estacionIndex === -1) return

    const preguntaIndex = examen.estaciones[estacionIndex].preguntas.findIndex((p: any) => p.id === preguntaId)
    if (preguntaIndex === -1) return

    const pregunta = examen.estaciones[estacionIndex].preguntas[preguntaIndex]
    if (!pregunta.opciones) {
      pregunta.opciones = []
    }

    const nuevoId = -Date.now() // ID temporal negativo para indicar que es nuevo
    const nuevaOpcion = {
      id: nuevoId,
      texto: `Opción ${pregunta.opciones.length + 1}`,
      correcta: pregunta.tipo === "opcion_multiple" ? false : undefined,
      orden: pregunta.opciones.length + 1,
      es_nuevo: true, // Marcador para identificar nuevas opciones
    }

    const nuevasEstaciones = [...examen.estaciones]
    nuevasEstaciones[estacionIndex].preguntas[preguntaIndex].opciones.push(nuevaOpcion)

    setExamen({
      ...examen,
      estaciones: nuevasEstaciones,
    })
  }

  const handleRemoveOpcion = (estacionId: number, preguntaId: number, opcionId: number) => {
    if (!examen) return

    const estacionIndex = examen.estaciones.findIndex((e: any) => e.id === estacionId)
    if (estacionIndex === -1) return

    const preguntaIndex = examen.estaciones[estacionIndex].preguntas.findIndex((p: any) => p.id === preguntaId)
    if (preguntaIndex === -1) return

    const pregunta = examen.estaciones[estacionIndex].preguntas[preguntaIndex]
    if (!pregunta.opciones || pregunta.opciones.length <= 1) {
      toast({
        title: "Error",
        description: "Debe haber al menos una opción.",
        variant: "destructive",
      })
      return
    }

    const opcion = pregunta.opciones.find((o: any) => o.id === opcionId)
    let nuevasOpciones = pregunta.opciones.filter((o: any) => o.id !== opcionId)

    if (pregunta.tipo === "opcion_unica" && opcion?.correcta) {
      nuevasOpciones = nuevasOpciones.map((o: any, idx: number) => (idx === 0 ? { ...o, correcta: true } : o))
    }

    const nuevasEstaciones = [...examen.estaciones]
    nuevasEstaciones[estacionIndex].preguntas[preguntaIndex].opciones = nuevasOpciones

    setExamen({
      ...examen,
      estaciones: nuevasEstaciones,
    })

    // Si la opción tiene un ID positivo (existe en la BD), registrarla como eliminada
    if (opcion && opcion.id > 0) {
      setDeletedItems((prev) => ({
        ...prev,
        opciones: [...prev.opciones, opcionId],
      }))
    }
  }

  const handleOpcionChange = (estacionId: number, preguntaId: number, opcionId: number, field: string, value: any) => {
    if (!examen) return

    const estacionIndex = examen.estaciones.findIndex((e: any) => e.id === estacionId)
    if (estacionIndex === -1) return

    const preguntaIndex = examen.estaciones[estacionIndex].preguntas.findIndex((p: any) => p.id === preguntaId)
    if (preguntaIndex === -1) return

    const pregunta = examen.estaciones[estacionIndex].preguntas[preguntaIndex]
    if (!pregunta.opciones) return

    const nuevasEstaciones = [...examen.estaciones]

    // Para opción única, si marcamos una como correcta, desmarcamos las demás
    if (pregunta.tipo === "opcion_unica" && field === "correcta" && value === true) {
      nuevasEstaciones[estacionIndex].preguntas[preguntaIndex].opciones = pregunta.opciones.map((o: any) =>
        o.id === opcionId ? { ...o, correcta: true } : { ...o, correcta: false },
      )
    } else {
      nuevasEstaciones[estacionIndex].preguntas[preguntaIndex].opciones = pregunta.opciones.map((o: any) =>
        o.id === opcionId ? { ...o, [field]: value } : o,
      )
    }

    setExamen({
      ...examen,
      estaciones: nuevasEstaciones,
    })
  }

  const handleEscalaChange = (estacionId: number, preguntaId: number, field: string, value: number) => {
    if (!examen) return

    const estacionIndex = examen.estaciones.findIndex((e: any) => e.id === estacionId)
    if (estacionIndex === -1) return

    const preguntaIndex = examen.estaciones[estacionIndex].preguntas.findIndex((p: any) => p.id === preguntaId)
    if (preguntaIndex === -1) return

    const nuevasEstaciones = [...examen.estaciones]
    nuevasEstaciones[estacionIndex].preguntas[preguntaIndex][field] = value

    setExamen({
      ...examen,
      estaciones: nuevasEstaciones,
    })
  }

  const handleEvaluadorChange = (evaluadorId: number, checked: boolean) => {
    if (checked) {
      setSelectedEvaluadores([...selectedEvaluadores, evaluadorId])
    } else {
      setSelectedEvaluadores(selectedEvaluadores.filter((id) => id !== evaluadorId))
    }
  }

  const prepararDatosParaGuardar = () => {
    if (!examen) return null

    const examenProcesado = {
      id: examen.id,
      titulo: examen.titulo || "",
      descripcion: examen.descripcion || "",
      fecha_aplicacion: examen.fecha_aplicacion || "",
      estado: examen.estado || "",
      evaluadores_ids: selectedEvaluadores,
      estaciones: examen.estaciones.map((estacion: any) => {
        const preguntasProcesadas = estacion.preguntas.map((pregunta: any) => {
          const preguntaProcesada: any = {
            texto: pregunta.texto || "",
            tipo: pregunta.tipo || "texto_libre",
            obligatoria: pregunta.obligatoria !== undefined ? pregunta.obligatoria : true,
            orden: pregunta.orden || 1,
            valor_minimo: pregunta.valor_minimo,
            valor_maximo: pregunta.valor_maximo,
            puntaje: pregunta.puntaje || 1,
          }

          if (!estacion.es_nuevo) {
            preguntaProcesada.estacion_id = estacion.id
          }

          if (!pregunta.es_nuevo && pregunta.id > 0) {
            preguntaProcesada.id = pregunta.id
          }

          if (pregunta.opciones) {
            preguntaProcesada.opciones = pregunta.opciones.map((opcion: any) => {
              const opcionProcesada: any = {
                texto: opcion.texto || "",
                es_correcta: opcion.correcta,
                orden: opcion.orden || 1,
              }

              if (!pregunta.es_nuevo && pregunta.id > 0) {
                opcionProcesada.pregunta_id = pregunta.id
              }

              if (!opcion.es_nuevo && opcion.id > 0) {
                opcionProcesada.id = opcion.id
              }

              return opcionProcesada
            })
          }

          return preguntaProcesada
        })

        const puntaje_maximo = preguntasProcesadas.reduce(
          (total: number, pregunta: any) => total + (Number(pregunta.puntaje) || 0),
          0,
        )

        const estacionProcesada: any = {
          titulo: estacion.titulo || "",
          descripcion: estacion.descripcion || "",
          duracion_minutos: estacion.duracion_minutos || 15,
          orden: estacion.orden || 1,
          activo: estacion.activo !== undefined ? estacion.activo : true,
          examen_id: examen.id,
          preguntas: preguntasProcesadas,
          puntaje_maximo,
        }

        if (!estacion.es_nuevo && estacion.id > 0) {
          estacionProcesada.id = estacion.id
        }

        return estacionProcesada
      }),
      deleted_estaciones: deletedItems.estaciones,
      deleted_preguntas: deletedItems.preguntas,
      deleted_opciones: deletedItems.opciones,
    }

    return examenProcesado
  }

  const handleGuardar = async () => {
    if (!examen) return

    setIsLoading(true)

    toast({
      title: "Guardando cambios",
      description: "Espere mientras se guardan los cambios...",
    })

    try {
      const examenActualizado = prepararDatosParaGuardar()

      if (!examenActualizado) {
        throw new Error("Error al preparar los datos del examen")
      }

      console.log("Datos a enviar:", JSON.stringify(examenActualizado, null, 2))

      const resultado = await examenesService.update(examen.id, examenActualizado)

      if (!resultado) {
        throw new Error("No se pudo actualizar el examen")
      }

      toast({
        title: "Cambios guardados",
        description: "Los datos del examen han sido actualizados correctamente.",
      })

      router.push(`/examenes/${id}`)
    } catch (error) {
      console.error("Error al guardar el examen:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los cambios. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const renderPreguntaEditor = (estacionId: number, pregunta: any, preguntaIndex: number) => {
    if (!pregunta) return null

    switch (pregunta.tipo) {
      case "texto_libre":
        return (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-2">El alumno responderá con texto libre.</p>
          </div>
        )

      case "opcion_unica":
        return (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Opciones (selecciona una correcta)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddOpcion(estacionId, pregunta.id)}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar opción
              </Button>
            </div>

            <div className="space-y-2">
              {pregunta.opciones?.map((opcion: any, opcionIndex: number) => (
                <div key={opcion.id} className="flex items-center space-x-2">
                  <RadioGroup
                    value={opcion.correcta ? opcion.id.toString() : undefined}
                    onValueChange={() => handleOpcionChange(estacionId, pregunta.id, opcion.id, "correcta", true)}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem
                      value={opcion.id.toString()}
                      id={`radio-${estacionId}-${pregunta.id}-${opcion.id}`}
                    />
                  </RadioGroup>
                  <Input
                    value={opcion.texto || ""}
                    onChange={(e) => handleOpcionChange(estacionId, pregunta.id, opcion.id, "texto", e.target.value)}
                    className="flex-1"
                    placeholder={`Opción ${opcionIndex + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOpcion(estacionId, pregunta.id, opcion.id)}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )

      case "opcion_multiple":
        return (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Opciones (selecciona las correctas)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddOpcion(estacionId, pregunta.id)}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar opción
              </Button>
            </div>

            <div className="space-y-2">
              {pregunta.opciones?.map((opcion: any, opcionIndex: number) => (
                <div key={opcion.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={opcion.correcta || false}
                    onCheckedChange={(checked) =>
                      handleOpcionChange(estacionId, pregunta.id, opcion.id, "correcta", checked)
                    }
                    id={`checkbox-${estacionId}-${pregunta.id}-${opcion.id}`}
                  />
                  <Input
                    value={opcion.texto || ""}
                    onChange={(e) => handleOpcionChange(estacionId, pregunta.id, opcion.id, "texto", e.target.value)}
                    className="flex-1"
                    placeholder={`Opción ${opcionIndex + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOpcion(estacionId, pregunta.id, opcion.id)}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )

      case "listado":
        return (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Elementos del listado</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddOpcion(estacionId, pregunta.id)}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar elemento
              </Button>
            </div>

            <div className="space-y-2">
              {pregunta.opciones?.map((opcion: any, opcionIndex: number) => (
                <div key={opcion.id} className="flex items-center space-x-2">
                  <span className="text-sm font-medium w-8">{opcionIndex + 1}.</span>
                  <Input
                    value={opcion.texto || ""}
                    onChange={(e) => handleOpcionChange(estacionId, pregunta.id, opcion.id, "texto", e.target.value)}
                    className="flex-1"
                    placeholder={`Elemento ${opcionIndex + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOpcion(estacionId, pregunta.id, opcion.id)}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )

      case "escala_numerica":
        return (
          <div className="mt-4 space-y-4">
            <Label>Configuración de la escala</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`escala-min-${estacionId}-${pregunta.id}`}>Valor mínimo</Label>
                <Input
                  id={`escala-min-${estacionId}-${pregunta.id}`}
                  type="number"
                  value={pregunta.valor_minimo || 1}
                  onChange={(e) =>
                    handleEscalaChange(estacionId, pregunta.id, "valor_minimo", Number.parseInt(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`escala-max-${estacionId}-${pregunta.id}`}>Valor máximo</Label>
                <Input
                  id={`escala-max-${estacionId}-${pregunta.id}`}
                  type="number"
                  value={pregunta.valor_maximo || 10}
                  onChange={(e) =>
                    handleEscalaChange(estacionId, pregunta.id, "valor_maximo", Number.parseInt(e.target.value))
                  }
                />
              </div>
            </div>
            <div className="py-4">
              <Label className="mb-2 block">Vista previa</Label>
              <div className="flex items-center space-x-2">
                <span>{pregunta.valor_minimo || 1}</span>
                <Slider
                  defaultValue={[5]}
                  min={pregunta.valor_minimo || 1}
                  max={pregunta.valor_maximo || 10}
                  step={1}
                  className="flex-1"
                />
                <span>{pregunta.valor_maximo || 10}</span>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg">Cargando información del examen...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="text-destructive mb-4 text-lg">{error}</div>
        <Button onClick={() => router.push("/examenes")}>Volver a la lista de exámenes</Button>
      </div>
    )
  }

  if (!examen) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="text-destructive mb-4 text-lg">No se pudo cargar el examen</div>
        <Button onClick={() => router.push("/examenes")}>Volver a la lista de exámenes</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/examenes/${id}`)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Examen</h1>
            <p className="text-muted-foreground">Modifica la información del examen.</p>
          </div>
        </div>
        <Button onClick={handleGuardar} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Cambios
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="estaciones" className="flex items-center">
            <ListChecks className="mr-2 h-4 w-4" />
            Estaciones
          </TabsTrigger>
          <TabsTrigger value="evaluadores" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Evaluadores
          </TabsTrigger>
          <TabsTrigger value="vista-previa" className="flex items-center">
            <HelpCircle className="mr-2 h-4 w-4" />
            Vista Previa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Modifica la información básica del examen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título del Examen</Label>
                  <Input
                    id="titulo"
                    value={examen.titulo || ""}
                    onChange={(e) => setExamen({ ...examen, titulo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha" className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Fecha del Examen
                  </Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={examen.fecha_aplicacion ? new Date(examen.fecha_aplicacion).toISOString().split("T")[0] : ""}
                    onChange={(e) => setExamen({ ...examen, fecha_aplicacion: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={examen.descripcion || ""}
                    onChange={(e) => setExamen({ ...examen, descripcion: e.target.value })}
                    placeholder="Descripción del examen..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estaciones" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Estaciones del Examen</CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddEstacion}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar Estación
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {examen.estaciones && examen.estaciones.length > 0 ? (
                <Tabs
                  value={activeEstacionTab || examen.estaciones[0].id.toString()}
                  onValueChange={setActiveEstacionTab}
                  className="w-full"
                >
                  <TabsList className="flex flex-wrap mb-4">
                    {examen.estaciones.map((estacion: any, index: number) => (
                      <TabsTrigger
                        key={estacion.id}
                        value={estacion.id.toString()}
                        className={cn("mr-2 mb-2", !estacion.activo && "opacity-70")}
                      >
                        {estacion.titulo || `Estación ${index + 1}`}
                        {cambiosPendientes[`estacion-${index}`] && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full"></span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {examen.estaciones.map((estacion: any, estacionIndex: number) => (
                    <TabsContent key={estacion.id} value={estacion.id.toString()} className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">Configuración de la Estación</h3>
                          <p className="text-sm text-muted-foreground">
                            Edita los detalles de la estación y sus preguntas
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={estacion.activo}
                              onCheckedChange={() => handleToggleEstacionActiva(estacion.id)}
                              id={`activo-${estacion.id}`}
                            />
                            <Label htmlFor={`activo-${estacion.id}`} className="text-sm">
                              {estacion.activo ? "Activa" : "Inactiva"}
                            </Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRemoveEstacion(estacion.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`estacion-titulo-${estacion.id}`}>Título de la Estación</Label>
                          <Input
                            id={`estacion-titulo-${estacion.id}`}
                            value={estacion.titulo || ""}
                            onChange={(e) => handleEstacionChange(estacion.id, "titulo", e.target.value)}
                            placeholder="Título de la estación"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`estacion-duracion-${estacion.id}`}>Duración (minutos)</Label>
                          <Input
                            id={`estacion-duracion-${estacion.id}`}
                            type="number"
                            value={estacion.duracion_minutos || 15}
                            onChange={(e) => handleEstacionChange(estacion.id, "duracion_minutos", e.target.value)}
                            min="1"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`estacion-descripcion-${estacion.id}`}>Descripción</Label>
                          <Textarea
                            id={`estacion-descripcion-${estacion.id}`}
                            value={estacion.descripcion || ""}
                            onChange={(e) => handleEstacionChange(estacion.id, "descripcion", e.target.value)}
                            placeholder="Descripción de la estación..."
                          />
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Preguntas</h3>
                        <Button variant="outline" onClick={() => handleAddPregunta(estacion.id)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Pregunta
                        </Button>
                      </div>

                      <div className="space-y-4 mt-4">
                        {estacion.preguntas && estacion.preguntas.length > 0 ? (
                          <div className="space-y-4">
                            {estacion.preguntas.map((pregunta: any, preguntaIndex: number) => (
                              <Card key={pregunta.id} className="border">
                                <CardHeader
                                  className="py-3 px-4 cursor-pointer"
                                  onClick={() => toggleExpandPregunta(pregunta.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      {expandedPreguntas[pregunta.id] ? (
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 mr-2" />
                                      )}
                                      <div>
                                        <span className="font-medium">
                                          {preguntaIndex + 1}. {pregunta.texto || `Pregunta ${preguntaIndex + 1}`}
                                        </span>
                                        <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded-full">
                                          {tiposPregunta.find((t) => t.value === pregunta.tipo)?.label || pregunta.tipo}
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemovePregunta(estacion.id, pregunta.id)
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardHeader>

                                {expandedPreguntas[pregunta.id] && (
                                  <CardContent className="pt-0 px-4 pb-4">
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`pregunta-${estacion.id}-${pregunta.id}`}
                                          className="text-base font-medium"
                                        >
                                          Texto de la Pregunta
                                        </Label>
                                        <Textarea
                                          id={`pregunta-${estacion.id}-${pregunta.id}`}
                                          placeholder="Escribe la pregunta aquí..."
                                          value={pregunta.texto || ""}
                                          onChange={(e) =>
                                            handlePreguntaChange(estacion.id, pregunta.id, "texto", e.target.value)
                                          }
                                          className="min-h-[100px]"
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor={`categoria-${estacion.id}-${pregunta.id}`}>
                                            Categoría (separadas por ";")
                                          </Label>
                                          <Input
                                            id={`categoria-${estacion.id}-${pregunta.id}`}
                                            placeholder="Ej: Diagnóstico;Conocimiento;Evaluación"
                                            value={pregunta.categoria || ""}
                                            onChange={(e) =>
                                              handlePreguntaChange(
                                                estacion.id,
                                                pregunta.id,
                                                "categoria",
                                                e.target.value,
                                              )
                                            }
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor={`tipo-${estacion.id}-${pregunta.id}`}>Tipo de Pregunta</Label>
                                          <Select
                                            value={pregunta.tipo || "texto_libre"}
                                            onValueChange={(value) =>
                                              handlePreguntaChange(
                                                estacion.id,
                                                pregunta.id,
                                                "tipo",
                                                value as
                                                  | "texto_libre"
                                                  | "opcion_unica"
                                                  | "opcion_multiple"
                                                  | "listado"
                                                  | "escala_numerica",
                                              )
                                            }
                                          >
                                            <SelectTrigger id={`tipo-${estacion.id}-${pregunta.id}`}>
                                              <SelectValue placeholder="Seleccionar tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {tiposPregunta.map((tipo) => (
                                                <SelectItem key={tipo.value} value={tipo.value}>
                                                  {tipo.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`obligatoria-${estacion.id}-${pregunta.id}`}
                                          checked={pregunta.obligatoria !== false}
                                          onCheckedChange={(checked) =>
                                            handlePreguntaChange(estacion.id, pregunta.id, "obligatoria", !!checked)
                                          }
                                        />
                                        <Label htmlFor={`obligatoria-${estacion.id}-${pregunta.id}`}>
                                          Pregunta obligatoria
                                        </Label>
                                      </div>

                                      <div className="space-y-2 mt-2">
                                        <Label htmlFor={`puntaje-${estacion.id}-${pregunta.id}`}>Puntaje</Label>
                                        <Input
                                          id={`puntaje-${estacion.id}-${pregunta.id}`}
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          placeholder="Ej: 1.5"
                                          value={pregunta.puntaje || 1}
                                          onChange={(e) =>
                                            handlePreguntaChange(
                                              estacion.id,
                                              pregunta.id,
                                              "puntaje",
                                              Number.parseFloat(e.target.value),
                                            )
                                          }
                                          required
                                        />
                                      </div>

                                      {renderPreguntaEditor(estacion.id, pregunta, preguntaIndex)}
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No hay preguntas en esta estación. Haga clic en "Agregar Pregunta" para crear una.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay estaciones configuradas. Haga clic en "Agregar Estación" para crear una.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluadores" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Evaluadores Asignados</CardTitle>
              <CardDescription>Selecciona los evaluadores que podrán tomar este examen</CardDescription>
            </CardHeader>
            <CardContent>
              {evaluadores && evaluadores.length > 0 ? (
                <div className="space-y-4">
                  {evaluadores.map((evaluador: any) => (
                    <div key={evaluador.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`evaluador-${evaluador.id}`}
                        checked={selectedEvaluadores.includes(evaluador.id)}
                        onCheckedChange={(checked) => handleEvaluadorChange(evaluador.id, checked as boolean)}
                      />
                      <Label htmlFor={`evaluador-${evaluador.id}`} className="flex flex-col">
                        <span>
                          {evaluador.nombre} {evaluador.apellido}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {evaluador.especialidad} - {evaluador.email}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay evaluadores disponibles. Agrega evaluadores desde la sección correspondiente.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vista-previa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{examen.titulo || "Nombre del Examen"}</CardTitle>
              <CardDescription>
                Fecha:{" "}
                {examen.fecha_aplicacion ? new Date(examen.fecha_aplicacion).toLocaleDateString() : "No definida"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {examen.estaciones && examen.estaciones.length > 0 ? (
                examen.estaciones
                  .filter((estacion: any) => estacion.activo)
                  .map((estacion: any, estacionIndex: number) => (
                    <div key={estacion.id} className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        {estacion.titulo || `Estación ${estacionIndex + 1}`}
                      </h3>
                      <div className="space-y-4 pl-4">
                        {estacion.preguntas && estacion.preguntas.length > 0 ? (
                          estacion.preguntas.map((pregunta: any, preguntaIndex: number) => (
                            <div key={pregunta.id} className="space-y-1">
                              <p className="font-medium">
                                {preguntaIndex + 1}. {pregunta.texto || "Descripción de la pregunta"}
                              </p>
                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                {pregunta.categoria && <span>Categorías: {pregunta.categoria}</span>}
                                <span>•</span>
                                <span>
                                  Tipo: {tiposPregunta.find((t) => t.value === pregunta.tipo)?.label || pregunta.tipo}
                                </span>
                                <span>•</span>
                                <span>Puntaje: {pregunta.puntaje || 1}</span>
                              </div>

                              {pregunta.tipo === "opcion_unica" && pregunta.opciones && (
                                <div className="mt-2 pl-4 space-y-1">
                                  {pregunta.opciones.map((opcion: any, opcionIndex: number) => (
                                    <div key={opcion.id} className="flex items-center gap-2">
                                      <div
                                        className={`w-4 h-4 rounded-full border ${opcion.correcta ? "bg-primary border-primary" : "border-gray-300"}`}
                                      ></div>
                                      <span>{opcion.texto || `Opción ${opcionIndex + 1}`}</span>
                                      {opcion.correcta && <span className="text-xs text-green-600">(Correcta)</span>}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {pregunta.tipo === "opcion_multiple" && pregunta.opciones && (
                                <div className="mt-2 pl-4 space-y-1">
                                  {pregunta.opciones.map((opcion: any, opcionIndex: number) => (
                                    <div key={opcion.id} className="flex items-center gap-2">
                                      <div
                                        className={`w-4 h-4 rounded border ${opcion.correcta ? "bg-primary border-primary" : "border-gray-300"}`}
                                      ></div>
                                      <span>{opcion.texto || `Opción ${opcionIndex + 1}`}</span>
                                      {opcion.correcta && <span className="text-xs text-green-600">(Correcta)</span>}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {pregunta.tipo === "listado" && pregunta.opciones && (
                                <div className="mt-2 pl-4 space-y-1">
                                  <ol className="list-decimal pl-4">
                                    {pregunta.opciones.map((opcion: any, opcionIndex: number) => (
                                      <li key={opcion.id}>{opcion.texto || `Elemento ${opcionIndex + 1}`}</li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {pregunta.tipo === "escala_numerica" && (
                                <div className="mt-2 pl-4">
                                  <p className="text-sm">
                                    Escala del {pregunta.valor_minimo || 1} al {pregunta.valor_maximo || 10}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-muted-foreground">No hay preguntas en esta estación.</div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay estaciones configuradas para este examen.
                </div>
              )}
              {examen.estaciones && examen.estaciones.some((estacion: any) => !estacion.activo) && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <p className="text-sm text-gray-500 font-medium">
                    Nota: Las estaciones inactivas no se muestran en la vista previa y no aparecerán durante la
                    evaluación.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
