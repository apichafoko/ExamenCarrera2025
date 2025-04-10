"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, Building2, MapPin, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import { useAppContext } from "@/context/app-context"

export default function DetalleHospitalPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { hospitales, alumnos } = useAppContext()
  const id = Number.parseInt(params.id)
  const [hospital, setHospital] = useState<any>(null)
  const [alumnosHospital, setAlumnosHospital] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Este useEffect se ejecutará cada vez que cambie el array de hospitales en el contexto
  useEffect(() => {
    // Buscar el hospital por ID
    const hospitalEncontrado = hospitales.find((h) => h.id === id)
    if (hospitalEncontrado) {
      setHospital(hospitalEncontrado)

      // Buscar alumnos asignados a este hospital
      const alumnosAsignados = alumnos.filter((a) => a.hospital_id === id)
      setAlumnosHospital(alumnosAsignados)
      setIsLoading(false)
    } else {
      // Si no se encuentra, redirigir a la lista
      router.push("/hospitales")
    }
  }, [id, router, hospitales, alumnos]) // Añadimos hospitales y alumnos como dependencias

  if (isLoading || !hospital) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Cargando información del hospital...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/hospitales")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalle del Hospital</h1>
            <p className="text-muted-foreground">Información completa del hospital.</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/hospitales/${id}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Información del Hospital
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-lg">{hospital.nombre}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                Dirección
              </p>
              <p className="text-lg">{hospital.direccion}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ciudad</p>
              <p className="text-lg">{hospital.ciudad}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <Badge
                variant={
                  hospital.tipo === "Público" ? "default" : hospital.tipo === "Privado" ? "secondary" : "outline"
                }
              >
                {hospital.tipo}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Alumnos Asignados
            </CardTitle>
            <CardDescription>Listado de alumnos asignados al hospital.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumnosHospital && alumnosHospital.length > 0 ? (
                  alumnosHospital.map((alumno) => (
                    <TableRow key={alumno.id}>
                      <TableCell className="font-medium">{alumno.id}</TableCell>
                      <TableCell>{`${alumno.nombre} ${alumno.apellido}`}</TableCell>
                      <TableCell>{alumno.email}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No hay alumnos asignados a este hospital.
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
