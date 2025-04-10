"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, Calendar, Users, User, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import { useAppContext } from "@/context/app-context"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { gruposService } from "@/lib/db-service"

export default function DetalleGrupoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { grupos } = useAppContext()
  const id = Number.parseInt(params.id)
  const [grupo, setGrupo] = useState<any>(null)
  const [alumnosGrupo, setAlumnosGrupo] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para formatear fecha o mostrar texto alternativo
  const formatFechaOTexto = (fecha, textoAlternativo = "Sin fecha") => {
    if (!fecha) return textoAlternativo
    try {
      return formatDate(fecha)
    } catch (error) {
      return textoAlternativo
    }
  }

  // Este useEffect se ejecutará cada vez que cambie el array de grupos en el contexto
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Buscar el grupo por ID
        const grupoEncontrado = await gruposService.getById(Number(id))

        if (grupoEncontrado) {
          setGrupo(grupoEncontrado)

          // Cargar los alumnos del grupo
          const alumnos = await cargarAlumnosGrupo(id)
          setAlumnosGrupo(alumnos)
        } else {
          setError("Grupo no encontrado")
        }
      } catch (error) {
        setError("Error al cargar el grupo")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, router, grupos]) // Añadimos grupos como dependencia

  // Cargar los alumnos del grupo desde la API
  const cargarAlumnosGrupo = async (grupoId) => {
    try {
      const response = await fetch(`/api/grupos/${grupoId}/alumnos`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        console.error(`Error al cargar alumnos del grupo ${grupoId}: ${response.status}`)
        return []
      }

      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error(`Error al cargar alumnos del grupo ${grupoId}:`, error)
      return []
    }
  }

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
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">No se encontró el grupo solicitado</h1>
        <Button onClick={() => router.push("/grupos")}>Volver a la lista de grupos</Button>
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
          <Button onClick={() => router.push(`/grupos/${id}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
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
                  <TableHead>Hospital</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumnosGrupo && alumnosGrupo.length > 0 ? (
                  alumnosGrupo.map((alumno) => (
                    <TableRow key={alumno.id}>
                      <TableCell className="font-medium">{alumno.id}</TableCell>
                      <TableCell>{`${alumno.nombre} ${alumno.apellido}`}</TableCell>
                      <TableCell>{alumno.email || "-"}</TableCell>
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
                    <TableCell colSpan={5} className="text-center py-4">
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
