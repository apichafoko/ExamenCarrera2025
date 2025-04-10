"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, User, Mail, Award, ClipboardCheck } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

export default function DetalleEvaluadorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const id = Number.parseInt(params.id)
  const [evaluador, setEvaluador] = useState<any>(null)
  const [examenesEvaluador, setExamenesEvaluador] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvaluador = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Obtener datos del evaluador
        const response = await fetch(`/api/evaluadores/${id}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Error: ${response.status}`)
        }

        const data = await response.json()
        setEvaluador(data)

        // Obtener exámenes habilitados para este evaluador
        try {
          const examenesResponse = await fetch(`/api/evaluadores/${id}/examenes`, {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          })

          if (examenesResponse.ok) {
            const examenesData = await examenesResponse.json()
            setExamenesEvaluador(examenesData)
          } else {
            console.error("Error al obtener exámenes del evaluador")
            setExamenesEvaluador([])
          }
        } catch (error) {
          console.error("Error al obtener exámenes del evaluador:", error)
          setExamenesEvaluador([])
        }
      } catch (error) {
        console.error("Error cargando evaluador:", error)
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

    if (id) {
      fetchEvaluador()
    }
  }, [id, toast])

  // Función para formatear fecha o mostrar texto alternativo
  const formatFechaOTexto = (fecha: string | null | undefined, textoAlternativo = "Fecha no definida") => {
    if (!fecha) return textoAlternativo
    try {
      return formatDate(fecha)
    } catch (error) {
      return textoAlternativo
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
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
        <Button onClick={() => router.push(`/evaluadores/${id}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
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
                {examenesEvaluador && examenesEvaluador.length > 0 ? (
                  examenesEvaluador.map((examen) => (
                    <TableRow key={examen.id}>
                      <TableCell className="font-medium">{examen.titulo}</TableCell>
                      <TableCell>{formatFechaOTexto(examen.fecha_aplicacion)}</TableCell>
                      <TableCell>{examen.estado || "Pendiente"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/examenes/${examen.id}`)}>
                          Ver
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
