"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Check, RefreshCw, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"

// Componente interno que usa useSearchParams
function AsignarExamenContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [tipoAsignacion, setTipoAsignacion] = useState("alumno")
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [examenesSeleccionados, setExamenesSeleccionados] = useState<number[]>([])
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<number[]>([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null)

  const [examenes, setExamenes] = useState<any[]>([])
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [grupos, setGrupos] = useState<any[]>([])
  const [alumnosGrupo, setAlumnosGrupo] = useState<any[]>([])
  const [isLoadingAlumnosGrupo, setIsLoadingAlumnosGrupo] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const fetchInitialData = useCallback(async () => {
    setIsDataLoading(true)
    setError(null)
    try {
      const [examenesRes, alumnosRes, gruposRes] = await Promise.all([
        fetch("/api/examenes"),
        fetch("/api/alumnos"),
        fetch("/api/grupos"),
      ])

      if (!examenesRes.ok || !alumnosRes.ok || !gruposRes.ok) throw new Error("Error al cargar datos")

      const [examenesData, alumnosData, gruposData] = await Promise.all([
        examenesRes.json(),
        alumnosRes.json(),
        gruposRes.json(),
      ])

      const examenesActivos = examenesData
        .filter((examen: any) => examen.estado?.toLowerCase() === "activo")
        .map((examen: any) => ({
          ...examen,
          evaluadores: examen.evaluadores || [],
        }))

      const alumnosOrdenados = alumnosData.sort((a: any, b: any) => {
        const nombreComparison = a.nombre.localeCompare(b.nombre)
        if (nombreComparison !== 0) return nombreComparison
        return a.apellido.localeCompare(b.apellido)
      })

      setExamenes(examenesActivos)
      setAlumnos(alumnosOrdenados)
      setGrupos(gruposData)
    } catch (err) {
      console.error("Error cargando datos:", err)
      setError("Error al cargar los datos. Por favor, intenta de nuevo.")
    } finally {
      setIsDataLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  useEffect(() => {
    const alumnoId = searchParams.get("alumnoId")
    const grupoId = searchParams.get("grupoId")
    const examenId = searchParams.get("examenId")

    if (alumnoId) {
      setTipoAsignacion("alumno")
      const alumnoIdNum = Number.parseInt(alumnoId, 10)
      if (!isNaN(alumnoIdNum)) setAlumnosSeleccionados([alumnoIdNum])
    } else if (grupoId) {
      setTipoAsignacion("grupo")
      const grupoIdNum = Number.parseInt(grupoId, 10)
      if (!isNaN(grupoIdNum)) setGrupoSeleccionado(grupoIdNum)
    }

    if (examenId) {
      const examenIdNum = Number.parseInt(examenId, 10)
      if (!isNaN(examenIdNum)) setExamenesSeleccionados([examenIdNum])
    }
  }, [searchParams])

  const fetchAlumnosGrupo = useCallback(
    async (grupoId: number) => {
      if (!grupoId) return
      setIsLoadingAlumnosGrupo(true)
      try {
        const res = await fetch(`/api/grupos/${grupoId}/alumnos`)
        if (!res.ok) throw new Error(`Error: ${res.status}`)
        const data = await res.json()
        setAlumnosGrupo(data)
      } catch (err) {
        console.error(`Error cargando alumnos del grupo ${grupoId}:`, err)
        toast({
          title: "Error",
          description: "No se pudieron cargar los alumnos del grupo.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingAlumnosGrupo(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    if (grupoSeleccionado) {
      fetchAlumnosGrupo(grupoSeleccionado)
    } else {
      setAlumnosGrupo([])
    }
  }, [grupoSeleccionado, fetchAlumnosGrupo])

  const handleAlumnoChange = useCallback((alumnoId: number, checked: boolean) => {
    setAlumnosSeleccionados((prev) => {
      if (checked) {
        return prev.includes(alumnoId) ? prev : [...prev, alumnoId]
      } else {
        return prev.filter((id) => id !== alumnoId)
      }
    })
  }, [])

  async function obtenerEvaluadorDeExamen(examenId: number) {
    try {
      const res = await fetch(`/api/examenes/${examenId}`)
      if (!res.ok) throw new Error(`Error: ${res.status}`)
      const examen = await res.json()

      if (!examen?.evaluadores || examen.evaluadores.length === 0) {
        throw new Error(`El examen "${examen.titulo}" no tiene evaluadores asignados`)
      }

      return examen.evaluadores[0].id
    } catch (error) {
      console.error(`Error obteniendo evaluador para el examen ${examenId}:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo obtener un evaluador para el examen.",
        variant: "destructive",
      })
      return null
    }
  }

  async function asignarExamenAlumno(examenIds: number[], alumnoId: number) {
    let asignacionesExitosas = 0
    const errores: string[] = []
    const yaAsignados: string[] = []

    for (const examenId of examenIds) {
      try {
        const evaluadorId = await obtenerEvaluadorDeExamen(examenId)
        if (!evaluadorId) {
          errores.push(`No se puede asignar el examen ID ${examenId}: sin evaluadores`)
          continue
        }

        const res = await fetch("/api/alumnos-examenes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            alumnoId,
            examenId,
            evaluadorId,
          }),
        })

        if (res.status === 409) {
          const { error } = await res.json()
          yaAsignados.push(`Examen ID ${examenId}: ${error || "Ya asignado"}`)
          continue
        }

        if (!res.ok) {
          const errorData = await res.text()
          console.error(`Error en la respuesta: ${res.status} ${errorData}`)
          errores.push(`Error al asignar examen ID ${examenId}`)
          continue
        }

        asignacionesExitosas++
      } catch (error) {
        console.error(`Error asignando examen ${examenId} al alumno ${alumnoId}:`, error)
        errores.push(`Error inesperado al asignar examen ID ${examenId}`)
      }
    }

    return { asignacionesExitosas, errores, yaAsignados }
  }

  async function asignarExamenGrupo(examenIds: number[], grupoId: number): Promise<boolean> {
    try {
      const res = await fetch(`/api/grupos/${grupoId}/alumnos`)
      if (!res.ok) throw new Error(`Error: ${res.status}`)
      const alumnosGrupo = await res.json()

      if (alumnosGrupo.length === 0) {
        toast({
          title: "Advertencia",
          description: "El grupo no tiene alumnos asignados.",
          variant: "default",
        })
        return false
      }

      const asignadosPorExamen: { [examenId: number]: string[] } = {}
      const yaAsignadosPorExamen: { [examenId: number]: string[] } = {}

      for (const examenId of examenIds) {
        asignadosPorExamen[examenId] = []
        yaAsignadosPorExamen[examenId] = []

        const evaluadorId = await obtenerEvaluadorDeExamen(examenId)
        if (!evaluadorId) {
          continue
        }

        for (const alumno of alumnosGrupo) {
          const res = await fetch("/api/alumnos-examenes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              alumnoId: alumno.id,
              examenId,
              evaluadorId,
            }),
          })

          if (res.status === 409) {
            yaAsignadosPorExamen[examenId].push(`${alumno.nombre} ${alumno.apellido}`)
            continue
          }

          if (!res.ok) {
            const errorData = await res.text()
            console.error(`Error en la respuesta: ${res.status} ${errorData}`)
            continue
          }

          asignadosPorExamen[examenId].push(`${alumno.nombre} ${alumno.apellido}`)
        }
      }

      const mensajes: JSX.Element[] = []
      examenesSeleccionados.forEach((examenId) => {
        const asignados = asignadosPorExamen[examenId] || []
        const yaAsignados = yaAsignadosPorExamen[examenId] || []
        const examen = examenes.find((e) => e.id === examenId)

        if (asignados.length > 0) {
          mensajes.push(
            <p key={`asignado-${examenId}`}>
              ✅ {examen?.titulo}: Asignado a <span className="font-medium">{asignados.join(", ")}</span>
            </p>,
          )
        }
        if (yaAsignados.length > 0) {
          mensajes.push(
            <p key={`ya-asignado-${examenId}`} className="text-amber-700">
              ⚠️ {examen?.titulo}: Ya asignado a <span className="font-medium">{yaAsignados.join(", ")}</span>
            </p>,
          )
        }
      })

      toast({
        title: "Resultado de la asignación",
        description: <div className="space-y-1">{mensajes}</div>,
        variant: "default",
      })

      return Object.values(asignadosPorExamen).some((asignados) => asignados.length > 0)
    } catch (error) {
      console.error(`Error asignando exámenes al grupo ${grupoId}:`, error)
      toast({
        title: "Error",
        description: "Ocurrió un error al asignar los exámenes al grupo.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleAsignar = async () => {
    if (examenesSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un examen para asignar.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    let exitoso = false

    try {
      if (tipoAsignacion === "alumno") {
        if (alumnosSeleccionados.length === 0) {
          toast({
            title: "Error",
            description: "Debes seleccionar al menos un alumno.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        let totalAsignacionesExitosas = 0
        for (const alumnoId of alumnosSeleccionados) {
          const { asignacionesExitosas, errores, yaAsignados } = await asignarExamenAlumno(
            examenesSeleccionados,
            alumnoId,
          )
          totalAsignacionesExitosas += asignacionesExitosas

          if (errores.length > 0) {
            errores.forEach((error) =>
              toast({
                title: "Error",
                description: error,
                variant: "destructive",
              }),
            )
          }
          if (yaAsignados.length > 0) {
            yaAsignados.forEach((mensaje) =>
              toast({
                title: "Ya asignado",
                description: mensaje,
                variant: "default",
              }),
            )
          }
        }

        exitoso = totalAsignacionesExitosas > 0
        if (exitoso) {
          toast({
            title: "Éxito",
            description: `Exámenes asignados a ${totalAsignacionesExitosas} alumnos.`,
            variant: "default",
          })
        }
      } else if (tipoAsignacion === "grupo") {
        if (!grupoSeleccionado) {
          toast({
            title: "Error",
            description: "Debes seleccionar un grupo.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        exitoso = await asignarExamenGrupo(examenesSeleccionados, grupoSeleccionado)
      }

      if (exitoso) {
        setTimeout(() => {
          router.push(`/examenes?t=${Date.now()}`)
        }, 1500)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error en la asignación:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado durante la asignación.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Función para agrupar exámenes por fecha de aplicación
  const groupExamsByDate = (exams: any[]) => {
    return exams.reduce((acc, examen) => {
      const date = examen.fecha_aplicacion
        ? formatDate(examen.fecha_aplicacion)
        : "Sin fecha"
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(examen)
      return acc
    }, {} as Record<string, any[]>)
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
                <span>{date}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t">
              <div className="space-y-4">
                {groupedExams[date].map((examen) => (
                  <div key={examen.id} className="flex items-start space-x-3 space-y-0">
                    <Checkbox
                      id={`examen-${examen.id}`}
                      checked={examenesSeleccionados.includes(examen.id)}
                      onCheckedChange={(checked) =>
                        setExamenesSeleccionados((prev) =>
                          checked ? [...prev, examen.id] : prev.filter((id) => id !== examen.id),
                        )
                      }
                      disabled={!examen.evaluadores || examen.evaluadores.length === 0}
                    />
                    <Label
                      htmlFor={`examen-${examen.id}`}
                      className="font-normal cursor-pointer flex-1 border rounded-md p-3 hover:bg-muted"
                    >
                      <div className="font-medium">{examen.titulo}</div>
                      {!examen.evaluadores || examen.evaluadores.length === 0 ? (
                        <span className="text-xs text-red-500">Sin evaluador asignado</span>
                      ) : null}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    )
  }

  // Filtrar alumnos según el término de búsqueda
  const filteredAlumnos = alumnos.filter((alumno) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      alumno.nombre.toLowerCase().includes(searchLower) ||
      alumno.apellido.toLowerCase().includes(searchLower) ||
      alumno.email.toLowerCase().includes(searchLower)
    )
  })

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asignar Exámenes</h1>
            <p className="text-muted-foreground">Asigna exámenes a alumnos o grupos.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchInitialData()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Exámenes</CardTitle>
          <CardDescription>Elige los exámenes activos que deseas asignar.</CardDescription>
        </CardHeader>
        <CardContent>
          {examenes.length === 0 ? (
            <div className="text-center p-4 border rounded-md">
              <p className="text-muted-foreground">No hay exámenes activos disponibles.</p>
              <Button variant="outline" className="mt-2" onClick={() => router.push("/examenes/nuevo")}>
                Crear nuevo examen
              </Button>
            </div>
          ) : (
            renderExamenes(examenes)
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
              <CardDescription>Elige los alumnos a los que deseas asignar los exámenes.</CardDescription>
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
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search-alumnos">Buscar Alumnos</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-alumnos"
                        type="search"
                        placeholder="Buscar por nombre, apellido o email..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {filteredAlumnos.length === 0 ? (
                    <div className="text-center p-4 border rounded-md">
                      <p className="text-muted-foreground">No se encontraron alumnos que coincidan con la búsqueda.</p>
                    </div>
                  ) : (
                    <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {filteredAlumnos.map((alumno) => (
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
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleAsignar}
                disabled={
                  isLoading ||
                  examenesSeleccionados.length === 0 ||
                  alumnosSeleccionados.length === 0 ||
                  examenes.length === 0 ||
                  alumnos.length === 0
                }
                className="w-full"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Asignar Exámenes a Alumnos Seleccionados
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="grupo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Grupo</CardTitle>
              <CardDescription>Elige el grupo al que deseas asignar los exámenes.</CardDescription>
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

                  {grupoSeleccionado && (
                    <div className="border rounded-md p-4">
                      <h3 className="text-sm font-medium mb-2">Alumnos del grupo:</h3>
                      {isLoadingAlumnosGrupo ? (
                        <div className="text-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Cargando alumnos...</p>
                        </div>
                      ) : alumnosGrupo.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Este grupo no tiene alumnos asignados.</p>
                      ) : (
                        <ul className="space-y-1 max-h-40 overflow-y-auto">
                          {alumnosGrupo.map((alumno) => (
                            <li key={alumno.id} className="text-sm">
                              • {alumno.nombre} {alumno.apellido}
                            </li>
                          ))}
                        </ul>
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
                  isLoading ||
                  examenesSeleccionados.length === 0 ||
                  !grupoSeleccionado ||
                  examenes.length === 0 ||
                  grupos.length === 0
                }
                className="w-full"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Asignar Exámenes al Grupo
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente principal que envuelve el contenido en Suspense
export default function AsignarExamenPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /> Cargando...</div>}>
      <AsignarExamenContent />
    </Suspense>
  )
}
