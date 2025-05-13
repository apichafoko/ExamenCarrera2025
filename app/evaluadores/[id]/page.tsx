
/**
 * Página de detalle de un evaluador en el sistema.
 *
 * Esta página muestra información detallada de un evaluador específico, incluyendo
 * su información personal y los exámenes habilitados que puede tomar. También permite
 * navegar hacia la edición del evaluador o regresar a la lista de evaluadores.
 *
 * ## Comportamiento principal:
 * - Obtiene el ID del evaluador desde los parámetros de la URL.
 * - Realiza una solicitud a la API para obtener los datos del evaluador y los exámenes habilitados.
 * - Muestra un estado de carga mientras se obtienen los datos.
 * - Maneja errores en caso de que no se puedan cargar los datos del evaluador o los exámenes.
 *
 * ## Componentes principales:
 * - **Información Personal**: Muestra el nombre, email y especialidad del evaluador.
 * - **Exámenes Habilitados**: Lista de exámenes que el evaluador puede tomar, con opciones para ver detalles.
 * - **Botones de Navegación**:
 *   - Botón para regresar a la lista de evaluadores.
 *   - Botón para editar la información del evaluador.
 *
 * ## Estados:
 * - `isLoading`: Indica si los datos están siendo cargados.
 * - `error`: Contiene el mensaje de error en caso de que ocurra un problema al cargar los datos.
 * - `evaluador`: Almacena los datos del evaluador obtenidos de la API.
 * - `examenesEvaluador`: Almacena la lista de exámenes habilitados para el evaluador.
 *
 * ## API Endpoints:
 * - `/api/evaluadores/{id}`: Obtiene los datos del evaluador.
 * - `/api/evaluadores/{id}/examenes`: Obtiene los exámenes habilitados para el evaluador.
 *
 * ## Dependencias:
 * - **useRouter**: Para manejar la navegación entre páginas.
 * - **useToast**: Para mostrar notificaciones en caso de errores.
 * - **useEffect**: Para realizar las solicitudes a la API al cargar la página.
 *
 * ## Ejemplo de uso:
 * Esta página es útil para administradores o usuarios que necesitan consultar
 * información detallada de un evaluador y los exámenes que tiene asignados.
 *
 * ## Notas:
 * - Si el ID del evaluador no es válido o no se encuentra, se muestra un mensaje de error.
 * - Si no hay exámenes habilitados, se muestra un mensaje indicando que no hay exámenes disponibles.
 */
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, User, Mail, Award, ClipboardCheck, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { use } from "react"
import logger from "@/lib/logger"

export default function DetalleEvaluadorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  // Unwrap params using React.use
  const { id: paramId } = use(params)
  const id = Number.parseInt(paramId)
  const [evaluador, setEvaluador] = useState<any>(null)
  const [examenesEvaluador, setExamenesEvaluador] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para formatear fecha o mostrar texto alternativo
  const formatFechaOTexto = (fecha: string | null | undefined, textoAlternativo = "Fecha no definida") => {
    if (!fecha) return textoAlternativo
    try {
      return formatDate(fecha)
    } catch (error) {
      return textoAlternativo
    }
  }

  useEffect(() => {
    const fetchEvaluador = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (isNaN(id)) {
          throw new Error("ID de evaluador inválido")
        }

        // Obtener datos del evaluador
        const response = await fetch(`/api/evaluadores/${id}`, {
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
        logger.debug("Datos del evaluador recibidos:", data)
        setEvaluador(data)

        // Obtener exámenes habilitados para este evaluador
        const examenesResponse = await fetch(`/api/evaluadores/${id}/examenes`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (examenesResponse.ok) {
          const examenesData = await examenesResponse.json()
          logger.debug("Exámenes del evaluador recibidos:", examenesData)
          setExamenesEvaluador(examenesData)
        } else {
          const errorData = await examenesResponse.json().catch(() => ({}))
          logger.warn("Error al obtener exámenes del evaluador:", errorData)
          setExamenesEvaluador([])
        }
      } catch (error) {
        logger.error("Error cargando evaluador:", error)
        setError(error instanceof Error ? error.message : "Error desconocido al cargar evaluador")
        toast({
          title: "Error al cargar datos",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvaluador()
  }, [id, toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="text-muted-foreground">Cargando información del evaluador...</p>
      </div>
    )
  }

  if (error || !evaluador) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/evaluadores")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "No se pudo cargar la información del evaluador"}</p>
            <Button onClick={() => router.push("/evaluadores")} className="mt-4">
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
          <Button variant="ghost" size="icon" onClick={() => router.push("/evaluadores")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalle del Evaluador</h1>
            <p className="text-muted-foreground">Información completa del evaluador.</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/evaluadores/${id}/editar`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
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
              <p className="text-lg">{`${evaluador.nombre || ""} ${evaluador.apellido || ""}`}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </p>
              <p className="text-lg">{evaluador.email || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <Award className="mr-2 h-4 w-4" />
                Especialidad
              </p>
              <p className="text-lg">{evaluador.especialidad || "No especificada"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardCheck className="mr-2 h-5 w-5" />
              Exámenes Habilitados
            </CardTitle>
            <CardDescription>Listado de exámenes que puede tomar este evaluador.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examenesEvaluador.length > 0 ? (
                  examenesEvaluador.map((examen) => (
                    <TableRow key={examen.id}>
                      <TableCell className="font-medium">{examen.examen_titulo}</TableCell>
                      <TableCell>{formatFechaOTexto(examen.fecha_aplicacion)}</TableCell>
                      <TableCell>{examen.estado || "Pendiente"}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/evaluador/resultados/${examen.id}`}>Ver</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No hay exámenes habilitados para este evaluador.
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