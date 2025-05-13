

/**
 * Página de Asignación de Identificación.
 *
 * Esta página permite a los administradores y colaboradores asignar números de identificación
 * a los alumnos para los exámenes. Los usuarios pueden seleccionar una fecha de examen y ver
 * la lista de alumnos asignados a esa fecha. También pueden actualizar la lista de alumnos
 * después de realizar asignaciones.
 *
 * ## Comportamiento principal:
 * - **Autorización**: Solo los usuarios con permisos de administrador o colaborador pueden acceder
 *   a esta página. Si un usuario no tiene permisos, es redirigido a la página principal (`/`).
 * - **Carga de fechas**: Al montar el componente, se realiza una solicitud a la API para obtener
 *   las fechas de los exámenes disponibles. Estas fechas se muestran en un menú desplegable.
 * - **Selección de fecha**: Al seleccionar una fecha, se realiza una solicitud a la API para obtener
 *   la lista de alumnos asignados a esa fecha.
 * - **Actualización de alumnos**: Después de asignar un número de identificación a un alumno,
 *   la lista de alumnos se actualiza automáticamente.
 *
 * ## Componentes utilizados:
 * - **Select**: Componente para seleccionar una fecha de examen.
 * - **Card**: Contenedor para mostrar la selección de fecha.
 * - **Alert**: Muestra errores en caso de fallos al cargar las fechas o los alumnos.
 * - **Skeleton**: Indicador de carga mientras se obtienen los datos de la API.
 * - **AsignacionIdentificacionTable**: Tabla que muestra la lista de alumnos asignados a la fecha seleccionada.
 *
 * ## Estado:
 * - `fechas`: Lista de fechas de exámenes disponibles.
 * - `selectedFecha`: Fecha seleccionada por el usuario.
 * - `alumnos`: Lista de alumnos asignados a la fecha seleccionada.
 * - `loading`: Indica si las fechas de exámenes están cargando.
 * - `loadingAlumnos`: Indica si los alumnos están cargando.
 * - `error`: Mensaje de error en caso de fallos al cargar datos.
 *
 * ## API Endpoints:
 * - `/api/asignacion/fechas`: Devuelve las fechas de exámenes disponibles.
 * - `/api/asignacion/alumnos`: Devuelve la lista de alumnos asignados a una fecha específica.
 *
 * ## Flujo de trabajo:
 * 1. Al montar el componente, se verifica si el usuario tiene permisos para acceder.
 * 2. Se cargan las fechas de exámenes desde la API.
 * 3. El usuario selecciona una fecha, y se cargan los alumnos asignados a esa fecha.
 * 4. Después de asignar un número de identificación, la lista de alumnos se actualiza automáticamente.
 *
 * ## Errores:
 * - Si ocurre un error al cargar las fechas o los alumnos, se muestra un mensaje de error en un componente `Alert`.
 *
 * ## Notas:
 * - Se utiliza un timestamp en las solicitudes a la API para evitar problemas de caché.
 * - La página está diseñada para ser responsiva y utiliza clases de Tailwind CSS para el diseño.
 */
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AsignacionIdentificacionTable } from "./asignacion-identificacion-table"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Calendar } from "lucide-react"

export default function AsignacionIdentificacionPage() {
  const [fechas, setFechas] = useState<any[]>([])
  const [selectedFecha, setSelectedFecha] = useState<string>("")
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAlumnos, setLoadingAlumnos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAdmin, isColaborador } = useAuth()
  const router = useRouter()

  // Verificar si el usuario tiene permisos para acceder a esta página
  useEffect(() => {
    if (!isAdmin && !isColaborador) {
      router.push("/")
    }
  }, [isAdmin, isColaborador, router])

  // Cargar las fechas de exámenes al montar el componente
  useEffect(() => {
    const fetchFechasExamenes = async () => {
      try {
        setLoading(true)
        setError(null)

        // Usar un timestamp para evitar caché
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/asignacion/fechas?t=${timestamp}`)

        if (!response.ok) {
          let errorMessage = "Error al cargar las fechas de exámenes"
          try {
            const errorData = await response.json()
            if (errorData && errorData.message) {
              errorMessage = errorData.message
            }
          } catch (e) {
            // Si no podemos parsear la respuesta como JSON, usamos el mensaje genérico
            console.error("No se pudo parsear la respuesta como JSON:", e)
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        setFechas(data)
      } catch (error) {
        console.error("Error al cargar fechas:", error)
        setError(`Error al cargar fechas: ${error instanceof Error ? error.message : "Error desconocido"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchFechasExamenes()
  }, [])

  // Cargar los alumnos cuando se selecciona una fecha
  useEffect(() => {
    const fetchAlumnosPorFecha = async () => {
      if (!selectedFecha) return

      try {
        setLoadingAlumnos(true)
        setError(null)

        // Usar un timestamp para evitar caché
        const timestamp = new Date().getTime()
        const response = await fetch(
          `/api/asignacion/alumnos?fecha=${encodeURIComponent(selectedFecha)}&t=${timestamp}`,
        )

        if (!response.ok) {
          let errorMessage = "Error al cargar los alumnos"
          try {
            const errorData = await response.json()
            if (errorData && errorData.message) {
              errorMessage = errorData.message
            }
          } catch (e) {
            // Si no podemos parsear la respuesta como JSON, usamos el mensaje genérico
            console.error("No se pudo parsear la respuesta como JSON:", e)
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        setAlumnos(data)
      } catch (error) {
        console.error("Error al cargar alumnos:", error)
        setError(`Error al cargar los alumnos: ${error instanceof Error ? error.message : "Error desconocido"}`)
        setAlumnos([])
      } finally {
        setLoadingAlumnos(false)
      }
    }

    fetchAlumnosPorFecha()
  }, [selectedFecha])

  // Manejar la actualización de la lista de alumnos después de asignar un número de identificación
  const handleAlumnoUpdated = async () => {
    if (selectedFecha) {
      setLoadingAlumnos(true)
      try {
        // Usar un timestamp para evitar caché
        const timestamp = new Date().getTime()
        const response = await fetch(
          `/api/asignacion/alumnos?fecha=${encodeURIComponent(selectedFecha)}&t=${timestamp}`,
        )

        if (response.ok) {
          const data = await response.json()
          setAlumnos(data)
        } else {
          console.error("Error al actualizar la lista de alumnos:", response.statusText)
        }
      } catch (error) {
        console.error("Error al actualizar la lista de alumnos:", error)
      } finally {
        setLoadingAlumnos(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Asignación de Identificación</h1>
      <p className="text-muted-foreground">Asigne números de identificación a los alumnos para los exámenes.</p>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Fecha de Examen</CardTitle>
          <CardDescription>
            Seleccione una fecha para ver los alumnos con exámenes asignados en esa fecha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Select value={selectedFecha} onValueChange={setSelectedFecha}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Seleccionar fecha" />
                </SelectTrigger>
                <SelectContent>
                  {fechas.length > 0 ? (
                    fechas.map((fecha) => (
                      <SelectItem key={fecha.fecha} value={fecha.fecha}>
                        {fecha.fecha} ({fecha.cantidad} estaciones)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-fechas" disabled>
                      No hay fechas disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedFecha && (
        <AsignacionIdentificacionTable
          alumnos={alumnos}
          loading={loadingAlumnos}
          fecha={selectedFecha}
          onAlumnoUpdated={handleAlumnoUpdated}
        />
      )}
    </div>
  )
}
