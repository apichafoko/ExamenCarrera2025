"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2, ArrowRightCircle, ArrowLeftCircle, Users, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import logger from "@/lib/logger"
import { use } from "react"

export default function EditarGrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  // Unwrap params using React.use
  const { id: paramId } = use(params)
  const id = Number.parseInt(paramId)
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
  const [searchTermNoAsignados, setSearchTermNoAsignados] = useState("")
  const [searchTermAsignados, setSearchTermAsignados] = useState("")

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsDataLoading(true)

        if (isNaN(id)) {
          throw new Error("ID de grupo inválido")
        }

        const grupoRes = await fetch(`/api/grupos/${id}`, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })
        const alumnosRes = await fetch("/api/alumnos", {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })
        const asignadosRes = await fetch(`/api/grupos/${id}/alumnos`, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!grupoRes.ok || !alumnosRes.ok || !asignadosRes.ok) {
          const errorData = await Promise.any([
            grupoRes.json().catch(() => ({})),
            alumnosRes.json().catch(() => ({})),
            asignadosRes.json().catch(() => ({})),
          ])
          throw new Error(errorData.message || "Error al obtener datos")
        }

        const grupoData = await grupoRes.json()
        const alumnosData = await alumnosRes.json()
        const alumnosGrupo = await asignadosRes.json()

        logger.debug("Datos recibidos:", { grupo: grupoData, alumnos: alumnosData, asignados: alumnosGrupo })

        setGrupo({
          id: grupoData.id,
          nombre: grupoData.nombre || "",
          fecha: grupoData.fecha_creacion ? new Date(grupoData.fecha_creacion).toISOString().split("T")[0] : "",
          activo: grupoData.activo !== undefined ? grupoData.activo : true,
        })

        // Ordenar todos los alumnos alfabéticamente por nombre y luego por apellido
        const alumnosOrdenados = alumnosData.sort((a: any, b: any) => {
          const nombreComparison = a.nombre.localeCompare(b.nombre);
          if (nombreComparison !== 0) return nombreComparison;
          return a.apellido.localeCompare(b.apellido);
        })

        // Ordenar alumnos asignados alfabéticamente
        const alumnosGrupoOrdenados = alumnosGrupo.sort((a: any, b: any) => {
          const nombreComparison = a.nombre.localeCompare(b.nombre);
          if (nombreComparison !== 0) return nombreComparison;
          return a.apellido.localeCompare(b.apellido);
        })

        setTodosLosAlumnos(alumnosOrdenados)
        setAlumnosAsignados(alumnosGrupoOrdenados)

        const alumnosIds = new Set(alumnosGrupoOrdenados.map((a: any) => a.id))
        const noAsignados = alumnosOrdenados.filter((alumno: any) => !alumnosIds.has(alumno.id))
        setAlumnosNoAsignados(noAsignados)
      } catch (error) {
        logger.error("Error cargando datos:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Ocurrió un error al cargar los datos.",
          variant: "destructive",
        })
        router.push("/grupos")
      } finally {
        setIsDataLoading(false)
      }
    }

    cargarDatos()
  }, [id, toast, router])

  const asignarAlumno = (alumno: any) => {
    const nuevosAsignados = [...alumnosAsignados, alumno].sort((a: any, b: any) => {
      const nombreComparison = a.nombre.localeCompare(b.nombre);
      if (nombreComparison !== 0) return nombreComparison;
      return a.apellido.localeCompare(b.apellido);
    })
    setAlumnosAsignados(nuevosAsignados)
    setAlumnosNoAsignados(alumnosNoAsignados.filter((a) => a.id !== alumno.id))
  }

  const desasignarAlumno = (alumno: any) => {
    const nuevosNoAsignados = [...alumnosNoAsignados, alumno].sort((a: any, b: any) => {
      const nombreComparison = a.nombre.localeCompare(b.nombre);
      if (nombreComparison !== 0) return nombreComparison;
      return a.apellido.localeCompare(b.apellido);
    })
    setAlumnosNoAsignados(nuevosNoAsignados)
    setAlumnosAsignados(alumnosAsignados.filter((a) => a.id !== alumno.id))
  }

  // Filtrar alumnos no asignados según el término de búsqueda
  const filteredAlumnosNoAsignados = alumnosNoAsignados.filter((alumno) => {
    const searchLower = searchTermNoAsignados.toLowerCase();
    return (
      alumno.nombre.toLowerCase().includes(searchLower) ||
      alumno.apellido.toLowerCase().includes(searchLower) ||
      alumno.email.toLowerCase().includes(searchLower)
    );
  });

  // Filtrar alumnos asignados según el término de búsqueda
  const filteredAlumnosAsignados = alumnosAsignados.filter((alumno) => {
    const searchLower = searchTermAsignados.toLowerCase();
    return (
      alumno.nombre.toLowerCase().includes(searchLower) ||
      alumno.apellido.toLowerCase().includes(searchLower) ||
      alumno.email.toLowerCase().includes(searchLower)
    );
  });

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
      const grupoResponse = await fetch(`/api/grupos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: grupo.nombre,
          fecha: grupo.fecha,
          activo: grupo.activo,
        }),
      })

      if (!grupoResponse.ok) {
        const errorData = await grupoResponse.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al actualizar el grupo")
      }

      // Obtener asignaciones actuales
      const actualesRes = await fetch(`/api/grupos/${id}/alumnos`)
      if (!actualesRes.ok) {
        const errorData = await actualesRes.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al obtener alumnos asignados")
      }
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

      const results = await Promise.all(operaciones)
      for (const res of results) {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || "Error al actualizar asignaciones de alumnos")
        }
      }

      toast({
        title: "Grupo actualizado",
        description: "El grupo y sus alumnos han sido actualizados correctamente.",
      })

      setTimeout(() => {
        setIsLoading(false)
        router.push(`/grupos/${id}`)
      }, 800)
    } catch (error) {
      logger.error("Error al actualizar el grupo:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al actualizar el grupo.",
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
                  <h3 className="font-medium">Alumnos disponibles ({filteredAlumnosNoAsignados.length})</h3>
                </div>
                <div className="p-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar alumnos..."
                      className="pl-8"
                      value={searchTermNoAsignados}
                      onChange={(e) => setSearchTermNoAsignados(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-[300px] p-2">
                  <div className="space-y-1">
                    {filteredAlumnosNoAsignados.length > 0 ? (
                      filteredAlumnosNoAsignados.map((alumno) => (
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
                      <p className="text-sm text-muted-foreground p-2">
                        {searchTermNoAsignados
                          ? "No se encontraron alumnos que coincidan con la búsqueda"
                          : "No hay alumnos disponibles"}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Columna de alumnos asignados */}
              <div className="border rounded-md">
                <div className="bg-secondary p-2 rounded-t-md">
                  <h3 className="font-medium">Alumnos asignados ({filteredAlumnosAsignados.length})</h3>
                </div>
                <div className="p-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar alumnos..."
                      className="pl-8"
                      value={searchTermAsignados}
                      onChange={(e) => setSearchTermAsignados(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-[300px] p-2">
                  <div className="space-y-1">
                    {filteredAlumnosAsignados.length > 0 ? (
                      filteredAlumnosAsignados.map((alumno) => (
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
                      <p className="text-sm text-muted-foreground p-2">
                        {searchTermAsignados
                          ? "No se encontraron alumnos que coincidan con la búsqueda"
                          : "No hay alumnos asignados"}
                      </p>
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