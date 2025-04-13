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

export default function EditarGrupoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [grupo, setGrupo] = useState({
    id: 0,
    nombre: "",
    fecha: "",
    activo: true,
  })

  const [todosLosAlumnos, setTodosLosAlumnos] = useState<any[]>([])
  const [alumnosAsignados, setAlumnosAsignados] = useState<any[]>([])
  const [alumnosNoAsignados, setAlumnosNoAsignados] = useState<any[]>([])

  const id = Number.parseInt(params.id)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsDataLoading(true)

        const grupoRes = await fetch(`/api/grupos/${id}`)
        const alumnosRes = await fetch("/api/alumnos")
        const asignadosRes = await fetch(`/api/grupos/${id}/alumnos`)

        if (!grupoRes.ok || !alumnosRes.ok || !asignadosRes.ok) {
          throw new Error("Error al obtener datos")
        }

        const grupoData = await grupoRes.json()
        const alumnosData = await alumnosRes.json()
        const alumnosGrupo = await asignadosRes.json()

        setGrupo({
          id: grupoData.id,
          nombre: grupoData.nombre || "",
          fecha: grupoData.fecha_creacion ? new Date(grupoData.fecha_creacion).toISOString().split("T")[0] : "",
          activo: grupoData.activo !== undefined ? grupoData.activo : true,
        })

        setTodosLosAlumnos(alumnosData)
        setAlumnosAsignados(alumnosGrupo)

        const alumnosIds = new Set(alumnosGrupo.map((a: any) => a.id))
        const noAsignados = alumnosData.filter((alumno: any) => !alumnosIds.has(alumno.id))
        setAlumnosNoAsignados(noAsignados)
      } catch (error) {
        console.error("Error cargando datos:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los datos.",
          variant: "destructive",
        })
      } finally {
        setIsDataLoading(false)
      }
    }

    cargarDatos()
  }, [id, toast])

  const asignarAlumno = (alumno: any) => {
    setAlumnosAsignados([...alumnosAsignados, alumno])
    setAlumnosNoAsignados(alumnosNoAsignados.filter((a) => a.id !== alumno.id))
  }

  const desasignarAlumno = (alumno: any) => {
    setAlumnosNoAsignados([...alumnosNoAsignados, alumno])
    setAlumnosAsignados(alumnosAsignados.filter((a) => a.id !== alumno.id))
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

    setIsLoading(true)

    try {
      // Actualizar grupo
      await fetch(`/api/grupos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: grupo.nombre,
          fecha: grupo.fecha,
          activo: grupo.activo,
        }),
      })

      // Obtener asignaciones actuales
      const actualesRes = await fetch(`/api/grupos/${id}/alumnos`)
      const alumnosActuales = await actualesRes.json()
      const alumnosActualesIds = new Set(alumnosActuales.map((a: any) => a.id))
      const alumnosNuevosIds = new Set(alumnosAsignados.map((a: any) => a.id))

      const alumnosParaAgregar = alumnosAsignados.filter((a: any) => !alumnosActualesIds.has(a.id))
      const alumnosParaEliminar = alumnosActuales.filter((a: any) => !alumnosNuevosIds.has(a.id))

      const operaciones = [
        ...alumnosParaAgregar.map((alumno: any) =>
          fetch(`/api/grupos/${id}/alumnos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alumnoId: alumno.id }),
          }),
        ),
        ...alumnosParaEliminar.map((alumno: any) =>
          fetch(`/api/grupos/${id}/alumnos/${alumno.id}`, {
            method: "DELETE",
          }),
        ),
      ]

      await Promise.all(operaciones)

      toast({
        title: "Grupo actualizado",
        description: "El grupo y sus alumnos han sido actualizados correctamente.",
      })

      setTimeout(() => {
        setIsLoading(false)
        router.push(`/grupos/${id}`)
      }, 800)
    } catch (error) {
      console.error("Error al actualizar el grupo:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el grupo.",
        variant: "destructive",
      })
    }
  }

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/grupos/${id}`)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Grupo</h1>
            <p className="text-muted-foreground">Modifica la información del grupo y sus alumnos.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Información del Grupo</CardTitle>
            <CardDescription>Modifica los datos básicos del grupo.</CardDescription>
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
              Guardar Cambios
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
              Asigna o desasigna alumnos al grupo. Mueve los alumnos entre las columnas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna de alumnos no asignados */}
              <div className="border rounded-md">
                <div className="bg-muted p-2 rounded-t-md">
                  <h3 className="font-medium">Alumnos disponibles ({alumnosNoAsignados.length})</h3>
                </div>
                <ScrollArea className="h-[300px] p-2">
                  <div className="space-y-1">
                    {alumnosNoAsignados.length > 0 ? (
                      alumnosNoAsignados.map((alumno) => (
                        <div
                          key={alumno.id}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                        >
                          <span>
                            {alumno.nombre} {alumno.apellido}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => asignarAlumno(alumno)}
                            title="Asignar al grupo"
                          >
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

              {/* Columna de alumnos asignados */}
              <div className="border rounded-md">
                <div className="bg-secondary p-2 rounded-t-md">
                  <h3 className="font-medium">Alumnos asignados ({alumnosAsignados.length})</h3>
                </div>
                <ScrollArea className="h-[300px] p-2">
                  <div className="space-y-1">
                    {alumnosAsignados.length > 0 ? (
                      alumnosAsignados.map((alumno) => (
                        <div
                          key={alumno.id}
                          className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded-md"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => desasignarAlumno(alumno)}
                            title="Quitar del grupo"
                          >
                            <ArrowLeftCircle className="h-4 w-4" />
                          </Button>
                          <span>
                            {alumno.nombre} {alumno.apellido}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-2">No hay alumnos asignados</p>
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
