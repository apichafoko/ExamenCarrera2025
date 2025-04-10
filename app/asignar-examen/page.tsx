"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Check, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { dbService } from "@/lib/db-service"

export default function AsignarExamenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [tipoAsignacion, setTipoAsignacion] = useState("alumno") // "alumno" o "grupo"
  const [error, setError] = useState<string | null>(null)

  // Estados de selección
  const [examenSeleccionado, setExamenSeleccionado] = useState<number | null>(null)
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<number[]>([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null)

  // Estados de datos
  const [examenes, setExamenes] = useState<any[]>([])
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [grupos, setGrupos] = useState<any[]>([])
  const [alumnosGrupo, setAlumnosGrupo] = useState<any[]>([])
  const [isLoadingAlumnosGrupo, setIsLoadingAlumnosGrupo] = useState(false)

  // Función para cargar los datos iniciales
  const fetchInitialData = useCallback(async () => {
    setIsDataLoading(true)
    setError(null)
    try {
      const [examenesData, alumnosData, gruposData] = await Promise.all([
        dbService.examenes.getAll(),
        dbService.alumnos.getAll(),
        dbService.grupos.getAll(),
      ])

      setExamenes(examenesData)
      setAlumnos(alumnosData)
      setGrupos(gruposData)
    } catch (err) {
      console.error("Error cargando datos:", err)
      setError("Error al cargar los datos. Por favor, intenta de nuevo.")
    } finally {
      setIsDataLoading(false)
    }
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  // Procesar parámetros de URL
  useEffect(() => {
    const alumnoId = searchParams.get("alumnoId")
    const grupoId = searchParams.get("grupoId")
    const examenId = searchParams.get("examenId")

    // Inicializar selecciones basadas en parámetros de URL
    if (alumnoId) {
      setTipoAsignacion("alumno")
      const alumnoIdNum = Number.parseInt(alumnoId, 10)
      if (!isNaN(alumnoIdNum)) {
        setAlumnosSeleccionados((prev) => {
          // Solo actualizar si es diferente para evitar re-renderizados
          if (prev.length === 1 && prev[0] === alumnoIdNum) return prev
          return [alumnoIdNum]
        })
      }
    } else if (grupoId) {
      setTipoAsignacion("grupo")
      const grupoIdNum = Number.parseInt(grupoId, 10)
      if (!isNaN(grupoIdNum)) {
        setGrupoSeleccionado(grupoIdNum)
      }
    }

    if (examenId) {
      const examenIdNum = Number.parseInt(examenId, 10)
      if (!isNaN(examenIdNum)) {
        setExamenSeleccionado(examenIdNum)
      }
    }
  }, [searchParams])

  // Cargar alumnos del grupo cuando cambia el grupo seleccionado
  const fetchAlumnosGrupo = useCallback(async (grupoId: number) => {
    if (!grupoId) return

    setIsLoadingAlumnosGrupo(true)
    try {
      const data = await dbService.grupos.getAlumnos(grupoId)
      setAlumnosGrupo(data)
    } catch (err) {
      console.error(`Error cargando alumnos del grupo ${grupoId}:`, err)
    } finally {
      setIsLoadingAlumnosGrupo(false)
    }
  }, [])

  // Efecto para cargar alumnos cuando cambia el grupo seleccionado
  useEffect(() => {
    if (grupoSeleccionado) {
      fetchAlumnosGrupo(grupoSeleccionado)
    } else {
      setAlumnosGrupo([])
    }
  }, [grupoSeleccionado, fetchAlumnosGrupo])

  // Manejador para cambiar la selección de alumnos
  const handleAlumnoChange = useCallback((alumnoId: number, checked: boolean) => {
    setAlumnosSeleccionados((prev) => {
      if (checked) {
        if (prev.includes(alumnoId)) return prev
        return [...prev, alumnoId]
      } else {
        return prev.filter((id) => id !== alumnoId)
      }
    })
  }, [])

  // Función para obtener el evaluador asignado a un examen
  async function obtenerEvaluadorDeExamen(examenId: number) {
    try {
      // Obtener el examen completo con sus evaluadores
      const examen = await dbService.examenes.getById(examenId)

      // Verificar si el examen tiene evaluadores asignados
      if (examen && examen.evaluadores && examen.evaluadores.length > 0) {
        console.log(`Examen ${examenId} tiene evaluador asignado: ${examen.evaluadores[0].id}`)
        return Number(examen.evaluadores[0].id)
      }

      // Si no hay evaluadores asignados al examen, obtener el primer evaluador disponible
      //const evaluadores = await dbService.evaluadores.getAll()
      //if (evaluadores && evaluadores.length > 0) {
      //console.log(`Usando evaluador por defecto: ${evaluadores[0].id}`)
      //return Number(evaluadores[0].id)
      //}

      console.error("No se encontraron evaluadores disponibles")
      return null
    } catch (error) {
      console.error(`Error al obtener evaluador para el examen ${examenId}:`, error)
      return null
    }
  }

  // Función para asignar examen a un alumno
  async function asignarExamenAlumno(examenId: number, alumnoId: number) {
    try {
      // Obtener el evaluador asignado al examen
      const evaluadorId = await obtenerEvaluadorDeExamen(examenId)

      if (!evaluadorId) {
        console.error("No se pudo obtener un evaluador para asignar")
        toast({
          title: "Error",
          description: "No hay evaluadores disponibles para asignar el examen.",
          variant: "destructive",
        })
        return false
      }

      // Verificar si el alumno ya tiene el examen asignado
      const yaAsignado = await dbService.alumnosExamenes.tieneExamenAsignado(alumnoId, examenId)
      if (yaAsignado) {
        toast({
          title: "Advertencia",
          description: "Este alumno ya tiene asignado este examen.",
          variant: "default", // o "warning" según tu sistema de notificaciones
        })
        return false
      }

      console.log(`Asignando examen ${examenId} al alumno ${alumnoId} con evaluador ${evaluadorId}`)

      // Llamar al servicio con el ID del evaluador obtenido
      const resultado = await dbService.alumnosExamenes.asignarExamen(alumnoId, examenId, evaluadorId)

      if (resultado) {
        toast({
          title: "Éxito",
          description: "Examen asignado correctamente al alumno.",
          variant: "success",
        })
      }

      return resultado
    } catch (error) {
      console.error(`Error asignando examen ${examenId} al alumno ${alumnoId}:`, error)
      toast({
        title: "Error",
        description: "Ocurrió un error al asignar el examen.",
        variant: "destructive",
      })
      return false
    }
  }

  // También modificar la función asignarExamenGrupo para usar la misma lógica
  async function asignarExamenGrupo(examenId: number, grupoId: number) {
    try {
      const alumnosGrupo = await dbService.grupos.getAlumnos(grupoId)
      if (alumnosGrupo.length === 0) return false

      // Obtener el evaluador asignado al examen
      const evaluadorId = await obtenerEvaluadorDeExamen(examenId)

      if (!evaluadorId) {
        console.error("No se pudo obtener un evaluador para asignar")
        toast({
          title: "Error",
          description: "No hay evaluadores disponibles para asignar el examen.",
          variant: "destructive",
        })
        return false
      }

      console.log(`Asignando examen ${examenId} al grupo ${grupoId} con evaluador ${evaluadorId}`)

      let asignacionesExitosas = 0
      for (const alumno of alumnosGrupo) {
        const resultado = await dbService.alumnosExamenes.asignarExamen(alumno.id, examenId, evaluadorId)
        if (resultado) asignacionesExitosas++
      }

      return asignacionesExitosas > 0
    } catch (error) {
      console.error(`Error asignando examen ${examenId} al grupo ${grupoId}:`, error)
      return false
    }
  }

  // Manejador para asignar examen
  const handleAsignar = async () => {
    if (!examenSeleccionado) {
      toast({
        title: "Error",
        description: "Debes seleccionar un examen para asignar.",
        variant: "destructive",
      })
      return
    }

    if (tipoAsignacion === "alumno") {
      if (alumnosSeleccionados.length === 0) {
        toast({
          title: "Error",
          description: "Debes seleccionar al menos un alumno.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        let asignacionesExitosas = 0
        let asignacionesDuplicadas = 0

        for (const alumnoId of alumnosSeleccionados) {
          const resultado = await asignarExamenAlumno(examenSeleccionado, alumnoId)
          if (resultado) {
            asignacionesExitosas++
          } else {
            asignacionesDuplicadas++
          }
        }

        if (asignacionesExitosas > 0) {
          toast({
            title: "Examen asignado",
            description: `El examen ha sido asignado a ${asignacionesExitosas} alumno(s) correctamente.${
              asignacionesDuplicadas > 0 ? ` ${asignacionesDuplicadas} alumno(s) ya tenían el examen asignado.` : ""
            }`,
          })

          // Redirigir al detalle del examen
          setTimeout(() => {
            router.push(`/examenes/${examenSeleccionado}?t=${Date.now()}`)
          }, 1000)
        } else if (asignacionesDuplicadas > 0) {
          toast({
            title: "Asignación no realizada",
            description: "Todos los alumnos seleccionados ya tenían el examen asignado.",
            variant: "destructive",
          })
          setIsLoading(false)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Ocurrió un error al asignar el examen.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } else if (tipoAsignacion === "grupo") {
      if (!grupoSeleccionado) {
        toast({
          title: "Error",
          description: "Debes seleccionar un grupo.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        const resultado = await asignarExamenGrupo(examenSeleccionado, grupoSeleccionado)

        if (resultado) {
          toast({
            title: "Examen asignado",
            description: "El examen ha sido asignado al grupo correctamente.",
          })

          // Redirigir al detalle del examen
          setTimeout(() => {
            router.push(`/examenes/${examenSeleccionado}?t=${Date.now()}`)
          }, 1000)
        } else {
          toast({
            title: "Asignación no realizada",
            description: "Todos los alumnos del grupo ya tenían el examen asignado o el grupo no tiene alumnos.",
            variant: "destructive",
          })
          setIsLoading(false)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Ocurrió un error al asignar el examen.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }
  }

  // Obtener objetos seleccionados
  const examenActual = examenes.find((e) => e.id === examenSeleccionado)
  const grupoActual = grupos.find((g) => g.id === grupoSeleccionado)

  // Renderizar pantalla de carga
  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando datos...</p>
        </div>
      </div>
    )
  }

  // Renderizar pantalla de error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => fetchInitialData()}>Intentar de nuevo</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Renderizar interfaz principal
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asignar Examen</h1>
            <p className="text-muted-foreground">Asigna un examen a alumnos o grupos.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchInitialData()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Examen</CardTitle>
          <CardDescription>Elige el examen que deseas asignar.</CardDescription>
        </CardHeader>
        <CardContent>
          {examenes.length === 0 ? (
            <div className="text-center p-4 border rounded-md">
              <p className="text-muted-foreground">No hay exámenes disponibles.</p>
              <Button variant="outline" className="mt-2" onClick={() => router.push("/examenes/nuevo")}>
                Crear nuevo examen
              </Button>
            </div>
          ) : (
            <RadioGroup
              value={examenSeleccionado?.toString() || ""}
              onValueChange={(value) => setExamenSeleccionado(Number.parseInt(value, 10))}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {examenes.map((examen) => (
                <div key={examen.id} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={examen.id.toString()} id={`examen-${examen.id}`} />
                  <Label
                    htmlFor={`examen-${examen.id}`}
                    className="font-normal cursor-pointer flex-1 border rounded-md p-3 hover:bg-muted"
                  >
                    <div className="font-medium">{examen.titulo}</div>
                    <div className="text-sm text-muted-foreground">
                      Fecha: {new Date(examen.fecha_aplicacion).toLocaleDateString()}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      <Tabs value={tipoAsignacion} onValueChange={setTipoAsignacion} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alumno">Asignar a Alumnos</TabsTrigger>
          <TabsTrigger value="grupo">Asignar a Grupo</TabsTrigger>
        </TabsList>

        <TabsContent value="alumno" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Alumnos</CardTitle>
              <CardDescription>Elige los alumnos a los que deseas asignar el examen.</CardDescription>
            </CardHeader>
            <CardContent>
              {alumnos.length === 0 ? (
                <div className="text-center p-4 border rounded-md">
                  <p className="text-muted-foreground">No hay alumnos disponibles.</p>
                  <Button variant="outline" className="mt-2" onClick={() => router.push("/alumnos/nuevo")}>
                    Registrar nuevo alumno
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {alumnos.map((alumno) => (
                      <div key={alumno.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                        <Checkbox
                          id={`alumno-${alumno.id}`}
                          checked={alumnosSeleccionados.includes(alumno.id)}
                          onCheckedChange={(checked) => handleAlumnoChange(alumno.id, checked === true)}
                        />
                        <Label htmlFor={`alumno-${alumno.id}`} className="flex-1 cursor-pointer">
                          {alumno.nombre} {alumno.apellido}
                          <span className="block text-xs text-muted-foreground">{alumno.email}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Alumnos seleccionados: {alumnosSeleccionados.length}</h3>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleAsignar}
                disabled={
                  isLoading ||
                  !examenSeleccionado ||
                  alumnosSeleccionados.length === 0 ||
                  examenes.length === 0 ||
                  alumnos.length === 0
                }
                className="w-full"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Asignar Examen a Alumnos Seleccionados
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="grupo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Grupo</CardTitle>
              <CardDescription>Elige el grupo al que deseas asignar el examen.</CardDescription>
            </CardHeader>
            <CardContent>
              {grupos.length === 0 ? (
                <div className="text-center p-4 border rounded-md">
                  <p className="text-muted-foreground">No hay grupos disponibles.</p>
                  <Button variant="outline" className="mt-2" onClick={() => router.push("/grupos/nuevo")}>
                    Crear nuevo grupo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="grupo">Grupo</Label>
                    <Select
                      value={grupoSeleccionado?.toString() || ""}
                      onValueChange={(value) => setGrupoSeleccionado(Number.parseInt(value, 10))}
                    >
                      <SelectTrigger id="grupo">
                        <SelectValue placeholder="Seleccionar grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {grupos.map((grupo) => (
                          <SelectItem key={grupo.id} value={grupo.id.toString()}>
                            {grupo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {grupoActual && (
                    <div className="border rounded-md p-4">
                      <h3 className="text-sm font-medium mb-2">Información del grupo:</h3>
                      <p className="text-sm mb-2">{grupoActual.descripcion}</p>

                      {/* Mostrar alumnos del grupo seleccionado */}
                      {isLoadingAlumnosGrupo ? (
                        <div className="text-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Cargando alumnos...</p>
                        </div>
                      ) : alumnosGrupo.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Este grupo no tiene alumnos asignados.</p>
                      ) : (
                        <div>
                          <h3 className="text-sm font-medium mb-2">Alumnos en el grupo ({alumnosGrupo.length}):</h3>
                          <ul className="space-y-1 max-h-40 overflow-y-auto">
                            {alumnosGrupo.map((alumno) => (
                              <li key={alumno.id} className="text-sm">
                                • {alumno.nombre} {alumno.apellido}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleAsignar}
                disabled={
                  isLoading || !examenSeleccionado || !grupoSeleccionado || examenes.length === 0 || grupos.length === 0
                }
                className="w-full"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Asignar Examen al Grupo
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
