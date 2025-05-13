
/**
 * Página para la creación de un nuevo grupo de alumnos.
 *
 * Esta página permite al usuario crear un grupo, asignarle un nombre, una fecha
 * y seleccionar alumnos que formarán parte del grupo. Los alumnos disponibles
 * se cargan desde una API y se pueden mover entre dos listas: "Alumnos disponibles"
 * y "Alumnos seleccionados". También incluye validaciones y manejo de errores
 * para garantizar que los datos sean correctos antes de enviarlos al servidor.
 *
 * ## Funcionalidades principales:
 *
 * - **Carga de datos iniciales**:
 *   - Se realiza una solicitud a la API `/api/alumnos` para obtener la lista de alumnos disponibles.
 *   - Los alumnos se ordenan alfabéticamente por nombre y apellido.
 *   - Se muestra un indicador de carga mientras se obtienen los datos.
 *
 * - **Formulario de creación del grupo**:
 *   - El usuario puede ingresar el nombre del grupo y una fecha.
 *   - Validaciones:
 *     - El nombre del grupo es obligatorio.
 *     - Debe haber al menos un alumno seleccionado para guardar el grupo.
 *
 * - **Gestión de alumnos**:
 *   - Los alumnos se dividen en dos listas:
 *     1. **Alumnos disponibles**: Lista de alumnos que aún no han sido seleccionados.
 *     2. **Alumnos seleccionados**: Lista de alumnos que formarán parte del grupo.
 *   - Los alumnos se pueden mover entre las listas utilizando botones de acción.
 *   - Ambas listas incluyen un campo de búsqueda para filtrar alumnos por nombre, apellido o email.
 *
 * - **Guardar grupo**:
 *   - Al presionar el botón "Guardar Grupo", se valida la información ingresada.
 *   - Si los datos son válidos, se envían a la API `/api/grupos` mediante una solicitud POST.
 *   - En caso de éxito, se muestra un mensaje de confirmación y se redirige al usuario a la página de grupos.
 *   - En caso de error, se muestra un mensaje descriptivo del problema.
 *
 * ## Componentes utilizados:
 *
 * - **UI Components**:
 *   - `Button`, `Card`, `Input`, `Label`, `ScrollArea`: Componentes reutilizables para la interfaz de usuario.
 * - **Icons**:
 *   - `ArrowLeft`, `Save`, `Loader2`, `ArrowRightCircle`, `ArrowLeftCircle`, `Users`, `Search`: Íconos para mejorar la experiencia visual.
 * - **Toast Notifications**:
 *   - Se utiliza `useToast` para mostrar mensajes de error, éxito o advertencia al usuario.
 *
 * ## Estados principales:
 *
 * - `isLoading`: Indica si se está procesando la solicitud para guardar el grupo.
 * - `isDataLoading`: Indica si los datos iniciales (alumnos) están cargando.
 * - `grupo`: Objeto que contiene los datos del grupo (nombre y fecha).
 * - `alumnosDisponibles`: Lista de alumnos que aún no han sido seleccionados.
 * - `alumnosSeleccionados`: Lista de alumnos que formarán parte del grupo.
 * - `searchTermDisponibles`: Término de búsqueda para filtrar alumnos disponibles.
 * - `searchTermSeleccionados`: Término de búsqueda para filtrar alumnos seleccionados.
 *
 * ## Manejo de errores:
 *
 * - Si ocurre un error al cargar los alumnos, se muestra un mensaje de error y se registra en el logger.
 * - Si ocurre un error al guardar el grupo, se muestra un mensaje descriptivo y se registra en el logger.
 *
 * ## Navegación:
 *
 * - El botón de retroceso permite regresar a la página de grupos (`/grupos`).
 * - Después de guardar exitosamente un grupo, el usuario es redirigido automáticamente a `/grupos`.
 */
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
  const [searchTermDisponibles, setSearchTermDisponibles] = useState("")
  const [searchTermSeleccionados, setSearchTermSeleccionados] = useState("")

  useEffect(() => {
    const cargarAlumnos = async () => {
      try {
        setIsDataLoading(true)
        const res = await fetch("/api/alumnos", {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })
        if (!res.ok) throw new Error("No se pudieron cargar los alumnos")
        const alumnosData = await res.json()

        // Ordenar alumnos alfabéticamente por nombre y luego por apellido
        const alumnosOrdenados = alumnosData.sort((a: any, b: any) => {
          const nombreComparison = a.nombre.localeCompare(b.nombre);
          if (nombreComparison !== 0) return nombreComparison;
          return a.apellido.localeCompare(b.apellido);
        })

        setAlumnosDisponibles(alumnosOrdenados)
      } catch (error) {
        logger.error("Error cargando alumnos:", error)
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
    const nuevosSeleccionados = [...alumnosSeleccionados, alumno].sort((a: any, b: any) => {
      const nombreComparison = a.nombre.localeCompare(b.nombre);
      if (nombreComparison !== 0) return nombreComparison;
      return a.apellido.localeCompare(b.apellido);
    })
    setAlumnosSeleccionados(nuevosSeleccionados)
    setAlumnosDisponibles(alumnosDisponibles.filter((a) => a.id !== alumno.id))
  }

  const deseleccionarAlumno = (alumno: any) => {
    const nuevosDisponibles = [...alumnosDisponibles, alumno].sort((a: any, b: any) => {
      const nombreComparison = a.nombre.localeCompare(b.nombre);
      if (nombreComparison !== 0) return nombreComparison;
      return a.apellido.localeCompare(b.apellido);
    })
    setAlumnosDisponibles(nuevosDisponibles)
    setAlumnosSeleccionados(alumnosSeleccionados.filter((a) => a.id !== alumno.id))
  }

  // Filtrar alumnos disponibles según el término de búsqueda
  const filteredAlumnosDisponibles = alumnosDisponibles.filter((alumno) => {
    const searchLower = searchTermDisponibles.toLowerCase();
    return (
      alumno.nombre.toLowerCase().includes(searchLower) ||
      alumno.apellido.toLowerCase().includes(searchLower) ||
      alumno.email.toLowerCase().includes(searchLower)
    );
  });

  // Filtrar alumnos seleccionados según el término de búsqueda
  const filteredAlumnosSeleccionados = alumnosSeleccionados.filter((alumno) => {
    const searchLower = searchTermSeleccionados.toLowerCase();
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

    if (alumnosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un alumno para el grupo.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const payload = {
      ...grupo,
      alumnos_ids: alumnosSeleccionados.map((a) => a.id),
    };
    logger.debug("ENVIANDO A API:", payload)

    const idsInvalidos = alumnosSeleccionados.filter((a) => !a.id)
    if (idsInvalidos.length > 0) {
      logger.error("IDs inválidos detectados:", idsInvalidos)
      toast({
        title: "Error",
        description: "Uno o más alumnos tienen un ID inválido.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/grupos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al crear el grupo")
      }

      toast({
        title: "Grupo creado",
        description: "El grupo ha sido creado correctamente.",
      })

      setTimeout(() => {
        setIsLoading(false)
        router.push("/grupos")
      }, 800)
    } catch (error) {
      logger.error("Error al crear el grupo:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al crear el grupo.",
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
              {/* Columna de alumnos disponibles */}
              <div className="border rounded-md">
                <div className="bg-muted p-2 rounded-t-md">
                  <h3 className="font-medium">Alumnos disponibles ({filteredAlumnosDisponibles.length})</h3>
                </div>
                <div className="p-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar alumnos..."
                      className="pl-8"
                      value={searchTermDisponibles}
                      onChange={(e) => setSearchTermDisponibles(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-[300px] p-2">
                  <div className="space-y-1">
                    {filteredAlumnosDisponibles.length > 0 ? (
                      filteredAlumnosDisponibles.map((alumno) => (
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
                            onClick={() => seleccionarAlumno(alumno)}
                            title="Seleccionar alumno"
                          >
                            <ArrowRightCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-2">
                        {searchTermDisponibles
                          ? "No se encontraron alumnos que coincidan con la búsqueda"
                          : "No hay alumnos disponibles"}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Columna de alumnos seleccionados */}
              <div className="border rounded-md">
                <div className="bg-secondary p-2 rounded-t-md">
                  <h3 className="font-medium">Alumnos seleccionados ({filteredAlumnosSeleccionados.length})</h3>
                </div>
                <div className="p-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar alumnos..."
                      className="pl-8"
                      value={searchTermSeleccionados}
                      onChange={(e) => setSearchTermSeleccionados(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-[300px] p-2">
                  <div className="space-y-1">
                    {filteredAlumnosSeleccionados.length > 0 ? (
                      filteredAlumnosSeleccionados.map((alumno) => (
                        <div
                          key={alumno.id}
                          className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded-md"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deseleccionarAlumno(alumno)}
                            title="Deseleccionar alumno"
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
                        {searchTermSeleccionados
                          ? "No se encontraron alumnos que coincidan con la búsqueda"
                          : "No hay alumnos seleccionados"}
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