
/**
 * Página de detalle de un grupo en la aplicación.
 *
 * Esta página muestra información detallada de un grupo específico, incluyendo
 * su estado (activo/inactivo), nombre, fecha de creación, cantidad de alumnos
 * asignados, y un listado de los alumnos pertenecientes al grupo.
 *
 * ## Características principales:
 * - **Carga de datos del grupo**: Se obtiene la información del grupo y sus alumnos
 *   desde un endpoint de la API (`/api/grupos/:id`).
 * - **Manejo de errores**: Si ocurre un error al cargar los datos, se muestra un mensaje
 *   de error y se permite al usuario regresar a la lista de grupos.
 * - **Indicadores visuales**: Se utiliza iconografía para mostrar el estado del grupo
 *   (activo/inactivo) y otros detalles relevantes.
 * - **Listado de alumnos**: Los alumnos se muestran en una tabla ordenada alfabéticamente
 *   por nombre y apellido. Cada fila incluye información como ID, nombre, email, documento,
 *   promoción, sede, hospital, y un enlace para ver más detalles del alumno.
 * - **Acciones disponibles**:
 *   - Asignar un examen al grupo.
 *   - Editar la información del grupo.
 *   - Ver detalles de un alumno específico.
 *
 * ## Props:
 * @param {Promise<{ id: string }>} params - Parámetros de la ruta, incluyendo el ID del grupo.
 *
 * ## Hooks utilizados:
 * - `useRouter`: Para manejar la navegación entre páginas.
 * - `useToast`: Para mostrar notificaciones de éxito o error.
 * - `useEffect`: Para cargar los datos del grupo al montar el componente.
 * - `useState`: Para manejar el estado del grupo, los alumnos, el estado de carga y los errores.
 *
 * ## Componentes utilizados:
 * - `Button`: Botones para acciones como regresar, asignar examen, editar, etc.
 * - `Card`: Contenedores para mostrar información del grupo y la lista de alumnos.
 * - `Table`: Tabla para mostrar el listado de alumnos.
 * - `Loader2`: Indicador de carga mientras se obtienen los datos.
 *
 * ## Flujo de la página:
 * 1. Se extrae el ID del grupo desde los parámetros de la ruta.
 * 2. Se realiza una llamada a la API para obtener los datos del grupo y sus alumnos.
 * 3. Si los datos se cargan correctamente, se muestran en la interfaz.
 * 4. Si ocurre un error, se muestra un mensaje de error con opciones para regresar.
 * 5. El usuario puede interactuar con los botones para realizar acciones adicionales.
 *
 * ## Notas:
 * - Los datos de los alumnos se ordenan alfabéticamente por nombre y apellido.
 * - Se utiliza un enfoque de "no-cache" para asegurar que los datos siempre estén actualizados.
 * - El diseño es responsivo, con una disposición en columnas para pantallas más grandes.
 */
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, Calendar, Users, User, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { use } from "react"
import logger from "@/lib/logger"

export default function DetalleGrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  // Unwrap params using React.use
  const { id: paramId } = use(params)
  const id = Number.parseInt(paramId)
  const [grupo, setGrupo] = useState<any>(null)
  const [alumnosGrupo, setAlumnosGrupo] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para formatear fecha o mostrar texto alternativo
  const formatFechaOTexto = (fecha: string | null | undefined, textoAlternativo = "Sin fecha") => {
    if (!fecha) return textoAlternativo
    try {
      return formatDate(fecha)
    } catch (error) {
      return textoAlternativo
    }
  }

  useEffect(() => {
    const fetchGrupo = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (isNaN(id)) {
          throw new Error("ID de grupo inválido")
        }

        // Obtener datos del grupo y sus alumnos
        const response = await fetch(`/api/grupos/${id}`, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Error: ${response.status}`)
        }

        const data = await response.json()
        logger.debug("Datos del grupo recibidos:", data)
        setGrupo(data)

        // Ordenar alumnos alfabéticamente por nombre y luego por apellido
        const alumnosOrdenados = (data.alumnos || []).sort((a: any, b: any) => {
          const nombreComparison = a.nombre.localeCompare(b.nombre);
          if (nombreComparison !== 0) return nombreComparison;
          return a.apellido.localeCompare(b.apellido);
        });

        setAlumnosGrupo(alumnosOrdenados)
      } catch (error) {
        logger.error("Error cargando grupo:", error)
        setError(error instanceof Error ? error.message : "Error desconocido al cargar grupo")
        toast({
          title: "Error al cargar datos",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchGrupo()
  }, [id, toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="text-muted-foreground">Cargando información del grupo...</p>
      </div>
    )
  }

  if (error || !grupo) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/grupos")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "No se pudo cargar la información del grupo"}</p>
            <Button onClick={() => router.push("/grupos")} className="mt-4">
              Volver a la lista
            </Button>
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold tracking-tight">Detalle del Grupo</h1>
            <p className="text-muted-foreground">Información completa del grupo.</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href={`/asignar-examen?grupoId=${id}`}>Asignar Examen</Link>
          </Button>
          <Button asChild>
            <Link href=''>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Información del Grupo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center">
                {grupo.activo !== undefined ? (
                  grupo.activo ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-1" />
                      <span className="font-medium">Activo</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-5 w-5 mr-1" />
                      <span className="font-medium">Inactivo</span>
                    </div>
                  )
                ) : null}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-lg">{grupo.nombre}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Fecha
              </p>
              <p className="text-lg">{formatFechaOTexto(grupo.fecha_creacion)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cantidad de Alumnos</p>
              <p className="text-lg">{alumnosGrupo.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Alumnos del Grupo
            </CardTitle>
            <CardDescription>Listado de alumnos asignados a este grupo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Promoción</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumnosGrupo.length > 0 ? (
                  alumnosGrupo.map((alumno) => (
                    <TableRow key={alumno.id}>
                      <TableCell className="font-medium">{alumno.id}</TableCell>
                      <TableCell>{`${alumno.nombre} ${alumno.apellido}`}</TableCell>
                      <TableCell>{alumno.email || "-"}</TableCell>
                      <TableCell>{alumno.documento || "-"}</TableCell>
                      <TableCell>{alumno.promocion || "-"}</TableCell>
                      <TableCell>{alumno.sede || "-"}</TableCell>
                      <TableCell>{alumno.hospital_nombre || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/alumnos/${alumno.id}`}>Ver Detalle</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No hay alumnos asignados a este grupo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}