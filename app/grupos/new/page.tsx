"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2, ArrowRightCircle, ArrowLeftCircle, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function NuevoGrupoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [grupo, setGrupo] = useState({
    nombre: "",
    fecha: "",
  })

  const [alumnosDisponibles, setAlumnosDisponibles] = useState<any[]>([])
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<any[]>([])

  useEffect(() => {
    const cargarAlumnos = async () => {
      try {
        setIsDataLoading(true)
        const res = await fetch("/api/alumnos")
        if (!res.ok) throw new Error("No se pudieron cargar los alumnos")
        const alumnosData = await res.json()
        setAlumnosDisponibles(alumnosData)
      } catch (error) {
        console.error("Error cargando alumnos:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los alumnos.",
          variant: "destructive",
        })
      } finally {
        setIsDataLoading(false)
      }
    }

    cargarAlumnos()
  }, [toast])

  const seleccionarAlumno = (alumno: any) => {
    setAlumnosSeleccionados([...alumnosSeleccionados, alumno])
    setAlumnosDisponibles(alumnosDisponibles.filter((a) => a.id !== alumno.id))
  }

  const deseleccionarAlumno = (alumno: any) => {
    setAlumnosDisponibles([...alumnosDisponibles, alumno])
    setAlumnosSeleccionados(alumnosSeleccionados.filter((a) => a.id !== alumno.id))
  }

  const handleGuardar = async () => {
    if (!grupo.nombre) {
      toast({
        title: "Error",
        description: "El nombre del grupo es obligatorio.",
        variant: "destructive",
      })
      return
    }

    if (alumnosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un alumno para el grupo.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    console.log(
      "ENVIANDO A API:",
      JSON.stringify({
        ...grupo,
        alumnos_ids: alumnosSeleccionados.map((a) => a.id),
      }),
    )

    const idsInvalidos = alumnosSeleccionados.filter((a) => !a.id)
    if (idsInvalidos.length > 0) {
      console.error("IDs inválidos detectados:", idsInvalidos)
      toast({
        title: "Error",
        description: "Uno o más alumnos tienen un ID inválido.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/grupos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...grupo,
          alumnos_ids: alumnosSeleccionados.map((a) => a.id),
        }),
      })

      if (!response.ok) throw new Error("Error al crear el grupo")

      toast({
        title: "Grupo creado",
        description: "El grupo ha sido creado correctamente.",
      })

      setTimeout(() => {
        setIsLoading(false)
        router.push("/grupos")
      }, 800)
    } catch (error) {
      console.error("Error al crear el grupo:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el grupo.",
        variant: "destructive",
      })
    }
  }

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="text-muted-foreground">Cargando alumnos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/grupos")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Grupo</h1>
            <p className="text-muted-foreground">Crea un nuevo grupo de alumnos.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Información del Grupo</CardTitle>
            <CardDescription>Completa los datos básicos del grupo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Grupo</Label>
              <Input
                id="nombre"
                value={grupo.nombre}
                onChange={(e) => setGrupo({ ...grupo, nombre: e.target.value })}
                placeholder="Ej: Grupo A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={grupo.fecha}
                onChange={(e) => setGrupo({ ...grupo, fecha: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGuardar} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Grupo
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Alumnos del Grupo
            </CardTitle>
            <CardDescription>
              Selecciona los alumnos que formarán parte de este grupo. Mueve los alumnos entre las columnas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md">
                <div className="bg-muted p-2 rounded-t-md">
                  <h3 className="font-medium">Alumnos disponibles ({alumnosDisponibles.length})</h3>
                </div>
                <ScrollArea className="h-[300px] p-2">
                  <div className="space-y-1">
                    {alumnosDisponibles.length > 0 ? (
                      alumnosDisponibles.map((alumno) => (
                        <div
                          key={alumno.id}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                        >
                          <span>
                            {alumno.nombre} {alumno.apellido}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => seleccionarAlumno(alumno)}>
                            <ArrowRightCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-2">No hay alumnos disponibles</p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="border rounded-md">
                <div className="bg-secondary p-2 rounded-t-md">
                  <h3 className="font-medium">Alumnos seleccionados ({alumnosSeleccionados.length})</h3>
                </div>
                <ScrollArea className="h-[300px] p-2">
                  <div className="space-y-1">
                    {alumnosSeleccionados.length > 0 ? (
                      alumnosSeleccionados.map((alumno) => (
                        <div
                          key={alumno.id}
                          className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded-md"
                        >
                          <Button variant="ghost" size="sm" onClick={() => deseleccionarAlumno(alumno)}>
                            <ArrowLeftCircle className="h-4 w-4" />
                          </Button>
                          <span>
                            {alumno.nombre} {alumno.apellido}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-2">No hay alumnos seleccionados</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
