/**
 * Página de detalle de un alumno en una aplicación Next.js.
 * 
 * Esta página muestra información detallada de un alumno, incluyendo datos personales,
 * exámenes asignados y opciones para editar o asignar nuevos exámenes. También permite
 * recargar los datos del alumno desde el servidor.
 * 
 * @component
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Promise<{ id: string }>} props.params - Parámetros de la ruta, incluyendo el ID del alumno.
 * 
 * @returns {JSX.Element} Página de detalle del alumno.
 * 
 * ## Funcionalidades principales:
 * 
 * - **Carga de datos del alumno:** 
 *   Utiliza el ID proporcionado en los parámetros de la ruta para obtener los datos del alumno desde una API.
 *   Si el ID es inválido o no se encuentra el alumno, redirige a la lista de alumnos.
 * 
 * - **Manejo de errores:**
 *   Muestra mensajes de error utilizando un sistema de notificaciones (`toast`) en caso de problemas al cargar los datos.
 * 
 * - **Recarga de datos:**
 *   Permite recargar manualmente los datos del alumno desde el servidor mediante un botón de "Actualizar".
 * 
 * - **Interfaz de usuario:**
 *   - Muestra información personal del alumno, como nombre, email, teléfono, fecha de nacimiento, etc.
 *   - Lista los exámenes asignados al alumno, incluyendo su estado y fecha.
 *   - Proporciona botones para editar la información del alumno o asignar nuevos exámenes.
 * 
 * - **Formato de datos:**
 *   Incluye una función para formatear fechas (`formatFechaOTexto`) y mostrar un texto alternativo si no hay datos disponibles.
 * 
 * ## Estados del componente:
 * 
 * - `alumno`: Contiene los datos del alumno cargados desde la API.
 * - `isLoading`: Indica si los datos del alumno están siendo cargados.
 * - `isRefreshing`: Indica si los datos están siendo recargados manualmente.
 * 
 * ## Hooks utilizados:
 * 
 * - `useEffect`: Carga los datos del alumno al montar el componente o cuando cambia el ID.
 * - `useState`: Maneja los estados locales del componente.
 * - `useRouter`: Permite la navegación programática entre páginas.
 * - `useToast`: Muestra notificaciones al usuario.
 * 
 * ## Componentes externos utilizados:
 * 
 * - **UI Components:** 
 *   - `Button`, `Card`, `Table`, `Badge`, etc., para construir la interfaz de usuario.
 * - **Icons:** 
 *   - Iconos de la librería `lucide-react` para mejorar la experiencia visual.
 * 
 * ## Flujo principal:
 * 
 * 1. Obtiene el ID del alumno desde los parámetros de la ruta.
 * 2. Valida el ID y carga los datos del alumno desde la API.
 * 3. Muestra un spinner mientras los datos están cargando.
 * 4. Si los datos se cargan correctamente, renderiza la información del alumno y los exámenes asignados.
 * 5. Si ocurre un error, muestra un mensaje y redirige a la lista de alumnos.
 * 6. Permite recargar los datos o navegar a otras páginas relacionadas (editar, asignar exámenes).
 */
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Edit,
  User,
  Mail,
  Phone,
  Building2,
  BookOpen,
  ClipboardList,
  Loader2,
  RefreshCw,
  Calendar,
  FileText,
  MapPin,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import logger from "@/lib/logger"
import { use } from "react"

export default function DetalleAlumnoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  // Unwrap params using React.use
  const { id: paramId } = use(params)
  const id = Number.parseInt(paramId)
  const [alumno, setAlumno] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const cargarAlumno = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/alumnos/${id}`, {
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

      const alumnoData = await response.json()
      logger.debug("Datos del alumno recibidos:", alumnoData)

      if (!alumnoData) {
        throw new Error("No se encontró el alumno solicitado")
      }

      setAlumno(alumnoData)
    } catch (error) {
      logger.error("Error cargando alumno:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al cargar los datos del alumno.",
        variant: "destructive",
      })
      router.push("/alumnos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isNaN(id)) {
      cargarAlumno()
    } else {
      logger.error("ID de alumno inválido:", paramId)
      toast({
        title: "Error",
        description: "ID de alumno inválido.",
        variant: "destructive",
      })
      router.push("/alumnos")
    }
  }, [id])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await cargarAlumno()
      toast({
        title: "Datos actualizados",
        description: "La información del alumno ha sido actualizada.",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Función para formatear fecha o mostrar texto alternativo
  const formatFechaOTexto = (fecha: string | null | undefined, textoAlternativo = "No especificado") => {
    if (!fecha) return textoAlternativo
    try {
      return new Date(fecha).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch (error) {
      return textoAlternativo
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="text-muted-foreground">Cargando información del alumno...</p>
      </div>
    )
  }

  if (!alumno) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-muted-foreground">No se encontró el alumno solicitado</p>
        <Button onClick={() => router.push("/alumnos")}>Volver a la lista de alumnos</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/alumnos")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalle del Alumno</h1>
            <p className="text-muted-foreground">Información completa del alumno.</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button asChild variant="outline">
            <Link href={`/asignar-examen?alumnoId=${id}`}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Asignar Examen
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/alumnos/${id}/editar`}>
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
              <User className="mr-2 h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-lg">
                {alumno.nombre} {alumno.apellido}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </p>
              <p className="text-lg">{alumno.email || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                Teléfono
              </p>
              <p className="text-lg">{alumno.telefono || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Fecha de Nacimiento
              </p>
              <p className="text-lg">{formatFechaOTexto(alumno.fecha_nacimiento)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Documento
              </p>
              <p className="text-lg">{alumno.documento || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Promoción
              </p>
              <p className="text-lg">{alumno.promocion || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                Sede
              </p>
              <p className="text-lg">{alumno.sede || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <Building2 className="mr-2 h-4 w-4" />
                Hospital
              </p>
              <p className="text-lg">{alumno.hospital_nombre || "No asignado"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Exámenes Asignados
            </CardTitle>
            <CardDescription>Listado de exámenes asignados al alumno.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumno.examenes && alumno.examenes.length > 0 ? (
                  alumno.examenes.map((examen: any) => (
                    <TableRow key={examen.id}>
                      <TableCell className="font-medium">{examen.id}</TableCell>
                      <TableCell>{examen.nombre || examen.titulo}</TableCell>
                      <TableCell>
                        {formatFechaOTexto(examen.fecha || examen.fecha)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={examen.estado === "Completado" ? "default" : "outline"}>{examen.estado}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No hay exámenes asignados a este alumno.
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