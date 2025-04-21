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
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import logger from "@/lib/logger"

export default function DetalleAlumnoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const id = Number.parseInt(params.id)
  const [alumno, setAlumno] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const cargarAlumno = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/alumnos/${id}`)

      if (!response.ok) {
        throw new Error("No se pudo cargar el alumno")
      }

      const alumnoData = await response.json()

      if (!alumnoData) {
        toast({
          title: "Error",
          description: "No se encontró el alumno solicitado.",
          variant: "destructive",
        })
        router.push("/alumnos")
        return
      }

      setAlumno(alumnoData)
    } catch (error) {
      logger.error("Error cargando alumno:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los datos del alumno.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarAlumno()
  }, [id])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await cargarAlumno()
    setIsRefreshing(false)

    toast({
      title: "Datos actualizados",
      description: "La información del alumno ha sido actualizada.",
    })
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
          <Button onClick={() => router.push(`/alumnos/${id}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
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
              <p className="text-lg">{alumno.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                Teléfono
              </p>
              <p className="text-lg">{alumno.telefono}</p>
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
                        {new Date(examen.fecha_aplicacion || examen.fecha_aplicacion).toLocaleDateString()}
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
