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

export default function AsignarExamenPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [tipoAsignacion, setTipoAsignacion] = useState("alumno")
  const [error, setError] = useState<string | null>(null)

  const [examenSeleccionado, setExamenSeleccionado] = useState<number | null>(null)
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
      if (!isNaN(examenIdNum)) setExamenSeleccionado(examenIdNum)
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

      if (examen?.evaluadores?.length > 0) {
        return examen.evaluadores[0].id
      }

      // Si no hay evaluadores asignados, obtener el primer evaluador disponible
      const evalRes = await fetch("/api/evaluadores")
      if (!evalRes.ok) throw new Error(`Error: ${evalRes.status}`)
      const evaluadores = await evalRes.json()

      if (evaluadores.length > 0) {
        return evaluadores[0].id
      }

      throw new Error("No hay evaluadores disponibles")
    } catch (error) {
      console.error(`Error obteniendo evaluador:`, error)
      toast({
        title: "Error",
        description: "No se pudo obtener un evaluador para el examen.",
        variant: "destructive",
      })
      return null
    }
  }

  async function asignarExamenAlumno(examenId: number, alumnoId: number) {
    try {
      // Obtener el evaluador asignado al examen
      const evaluadorId = await obtenerEvaluadorDeExamen(examenId)
      if (!evaluadorId) {
        toast({
          title: "Error",
          description: "No hay evaluadores disponibles para asignar el examen.",
          variant: "destructive",
        })
        return false
      }

      // Realizar la asignación
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
        toast({
          title: "Ya asignado",
          description: error || "Este alumno ya tiene el examen asignado.",
          variant: "default",
        })
        return false
      }

      if (!res.ok) {
        const errorData = await res.text()
        console.error(`Error en la respuesta: ${res.status} ${errorData}`)
        throw new Error(`Error al asignar examen: ${res.status}`)
      }

      const data = await res.json()
      console.log(`Examen ${examenId} asignado al alumno ${alumnoId}:`, data)
      return true
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

  async function asignarExamenGrupo(examenId: number, grupoId: number): Promise<boolean> {
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

      // Obtener el evaluador asignado al examen
      const evaluadorId = await obtenerEvaluadorDeExamen(examenId)
      if (!evaluadorId) {
        toast({
          title: "Error",
          description: "No hay evaluadores disponibles para asignar el examen.",
          variant: "destructive",
        })
        return false
      }

      const asignados: string[] = []
      const yaAsignados: string[] = []

      for (const alumno of alumnosGrupo) {
        // Realizar la asignación
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
          yaAsignados.push(`${alumno.nombre} ${alumno.apellido}`)
          continue
        }

        if (!res.ok) {
          const errorData = await res.text()
          console.error(`Error en la respuesta: ${res.status} ${errorData}`)
          continue
        }

        asignados.push(`${alumno.nombre} ${alumno.apellido}`)
      }

      // Mostrar toast resumen
      toast({
        title: "Resultado de la asignación",
        description: (
          <div className="space-y-1">
            {asignados.length > 0 && (
              <p>
                ✅ Los nuevos alumnos asignados son: <span className="font-medium">{asignados.join(", ")}</span>
              </p>
            )}
            {yaAsignados.length > 0 && (
              <p className="text-amber-700">
                ⚠️ Estos alumnos ya estaban asignados: <span className="font-medium">{yaAsignados.join(", ")}</span>
              </p>
            )}
          </div>
        ),
        variant: "default",
      })

      return asignados.length > 0
    } catch (error) {
      console.error(`Error asignando examen ${examenId} al grupo ${grupoId}:`, error)
      toast({
        title: "Error",
        description: "Ocurrió un error al asignar el examen al grupo.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleAsignar = async () => {
    if (!examenSeleccionado) {
      toast({
        title: "Error",
        description: "Debes seleccionar un examen para asignar.",
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

        let asignacionesExitosas = 0
        for (const alumnoId of alumnosSeleccionados) {
          const resultado = await asignarExamenAlumno(examenSeleccionado, alumnoId)
          if (resultado) asignacionesExitosas++
        }

        exitoso = asignacionesExitosas > 0
        if (exitoso) {
          toast({
            title: "Éxito",
            description: `Examen asignado a ${asignacionesExitosas} de ${alumnosSeleccionados.length} alumnos.`,
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

        exitoso = await asignarExamenGrupo(examenSeleccionado, grupoSeleccionado)
      }

      if (exitoso) {
        // Redirigir al detalle del examen después de un breve retraso
        setTimeout(() => {
          router.push(`/examenes/${examenSeleccionado}?t=${Date.now()}`)
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

  // Obtener objetos seleccionados
  const examenActual = examenes.find((e) => e.id === examenSeleccionado)
  const grupoActual = grupos.find((g) => g.id === grupoSeleccionado)

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
