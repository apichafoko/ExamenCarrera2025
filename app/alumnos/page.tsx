


/**
 * Página principal para la gestión de alumnos en el sistema.
 *
 * Esta página permite a los usuarios visualizar, buscar, actualizar y eliminar
 * información de los alumnos registrados. También proporciona acceso a la creación
 * de nuevos alumnos y la edición de los existentes.
 *
 * ## Funcionalidades principales:
 * - **Visualización de alumnos**: Muestra una tabla con la lista de alumnos registrados,
 *   incluyendo información como nombre, documento, promoción, sede y hospital asignado.
 * - **Búsqueda**: Permite filtrar alumnos por nombre, apellido, documento o nombre del hospital.
 * - **Actualización de datos**: Incluye un botón para recargar la lista de alumnos desde el servidor.
 * - **Gestión de alumnos**:
 *   - Crear un nuevo alumno mediante un botón que redirige a la página de creación.
 *   - Editar un alumno existente mediante un enlace en la tabla.
 *   - Eliminar un alumno con confirmación mediante un diálogo de alerta.
 *
 * ## Componentes utilizados:
 * - **UI Components**: Botones, tablas, tarjetas, entradas de texto y diálogos de alerta
 *   proporcionados por la biblioteca de componentes personalizados.
 * - **Íconos**: Íconos de la biblioteca `lucide-react` para mejorar la experiencia visual.
 * - **Toast Notifications**: Notificaciones para informar al usuario sobre el éxito o error
 *   de las operaciones realizadas.
 *
 * ## Estados:
 * - `busqueda`: Cadena utilizada para filtrar los alumnos mostrados en la tabla.
 * - `alumnos`: Lista de alumnos obtenida desde el servidor.
 * - `isLoading`: Indica si los datos están siendo cargados desde el servidor.
 * - `error`: Mensaje de error en caso de que ocurra un problema al cargar los datos.
 *
 * ## Hooks:
 * - `useEffect`: Carga la lista de alumnos al montar el componente.
 * - `useState`: Maneja los estados locales como la lista de alumnos, el estado de carga y los errores.
 * - `useRouter`: Navegación programática para redirigir a otras páginas.
 * - `useToast`: Muestra notificaciones al usuario.
 *
 * ## API:
 * - **GET /api/alumnos**: Obtiene la lista de alumnos.
 * - **DELETE /api/alumnos/:id**: Elimina un alumno específico.
 *
 * ## Interacciones del usuario:
 * - **Buscar alumnos**: Escribe en el campo de búsqueda para filtrar la lista.
 * - **Actualizar lista**: Haz clic en el botón "Actualizar" para recargar los datos.
 * - **Crear nuevo alumno**: Haz clic en el botón "Nuevo Alumno" para redirigirse a la página de creación.
 * - **Editar alumno**: Haz clic en el ícono de edición en la tabla para redirigirse a la página de edición.
 * - **Eliminar alumno**: Haz clic en el ícono de eliminar y confirma la acción en el diálogo de alerta.
 *
 * ## Mensajes de error:
 * - Si ocurre un error al cargar los datos, se muestra un mensaje con la opción de reintentar.
 * - Si no se encuentran alumnos con los filtros aplicados, se muestra un mensaje informativo.
 *
 * ## Diseño:
 * - La página utiliza un diseño responsivo con espacio entre secciones y componentes alineados.
 * - Los estados de carga y error están claramente indicados al usuario.
 *
 * Esta página es parte del sistema de gestión de alumnos y está diseñada para ser intuitiva
 * y eficiente para los administradores del sistema.
 */
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Mail, Phone, Edit, Trash2, Eye, ArrowUpDown, Loader2, Building, RefreshCw } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

export default function AlumnosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [busqueda, setBusqueda] = useState("")
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarAlumnos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Cargando alumnos...")
      const response = await fetch("/api/alumnos", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Datos recibidos:", data)

      if (Array.isArray(data)) {
        setAlumnos(data)
      } else {
        console.error("Los datos recibidos no son un array:", data)
        setAlumnos([])
        setError("Los datos recibidos no tienen el formato esperado")
      }
    } catch (error) {
      console.error("Error cargando alumnos:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar alumnos")
      setAlumnos([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarAlumnos()
  }, [])

  const alumnosFiltrados = alumnos.filter(
    (alumno) =>
      (alumno.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (alumno.apellido || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      String(alumno.documento || "")
        .toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      (alumno.hospital_nombre || "").toLowerCase().includes(busqueda.toLowerCase()),
  )

  const handleEliminar = async (id: number) => {
    try {
      const response = await fetch(`/api/alumnos/${id}`, {
        method: "DELETE",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      setAlumnos(alumnos.filter((alumno) => alumno.id !== id))
      toast({
        title: "Alumno eliminado",
        description: "El alumno ha sido eliminado correctamente.",
      })
    } catch (error) {
      console.error("Error eliminando alumno:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el alumno",
        variant: "destructive",
      })
    }
  }

  const handleNuevoAlumno = () => {
    router.push("/alumnos/nuevo")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alumnos</h1>
          <p className="text-muted-foreground">Gestiona la información de los alumnos registrados en el sistema.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={cargarAlumnos} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isLoading ? "Actualizando..." : "Actualizar"}
          </Button>
          <Button onClick={handleNuevoAlumno}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Alumno
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-2 text-sm">Verifica la conexión a la base de datos e intenta nuevamente.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={cargarAlumnos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Alumnos</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alumnos..."
                className="pl-8"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Nombre
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      Documento
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4" />
                      Promocion
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <Building className="mr-2 h-4 w-4" />
                      Sede
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <Building className="mr-2 h-4 w-4" />
                      Hospital
                    </div>
                  </TableHead>

                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumnosFiltrados.length > 0 ? (
                  alumnosFiltrados.map((alumno) => (
                    <TableRow key={alumno.id} className="hover-scale">
                      <TableCell className="font-medium">{alumno.id}</TableCell>
                      <TableCell>{`${alumno.nombre || ""} ${alumno.apellido || ""}`}</TableCell>
                      <TableCell>{alumno.documento || ""}</TableCell>
                      <TableCell>{alumno.promocion || ""}</TableCell>
                      <TableCell>{alumno.sede || ""}</TableCell>
                      <TableCell>{alumno.hospital_nombre || "No asignado"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/alumnos/${alumno.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver detalles</span>
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/alumnos/${alumno.id}/editar`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará al alumno permanentemente. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleEliminar(alumno.id)}
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {busqueda
                        ? "No se encontraron alumnos con los filtros seleccionados."
                        : "No hay alumnos registrados."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {alumnosFiltrados.length} de {alumnos.length} alumnos
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
