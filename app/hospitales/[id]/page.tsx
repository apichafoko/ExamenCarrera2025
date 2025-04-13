"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, MapPin, Phone, Mail, Users, Edit, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface Hospital {
  id: number
  nombre: string
  direccion: string
  ciudad: string
  estado: string
  codigo_postal: string
  telefono: string
  email: string
  tipo: string
  total_alumnos: number
}

interface Alumno {
  id: number
  nombre: string
  apellido: string
  email: string
  documento: string
}

export default function DetalleHospitalPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Obtener datos del hospital
      const hospitalResponse = await fetch(`/api/hospitales/${params.id}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!hospitalResponse.ok) {
        throw new Error(`Error al obtener datos del hospital: ${hospitalResponse.status}`)
      }

      const hospitalData = await hospitalResponse.json()
      setHospital(hospitalData)

      // Obtener alumnos del hospital
      const alumnosResponse = await fetch(`/api/hospitales/${params.id}/alumnos`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!alumnosResponse.ok) {
        throw new Error(`Error al obtener alumnos del hospital: ${alumnosResponse.status}`)
      }

      const alumnosData = await alumnosResponse.json()
      setAlumnos(alumnosData)
    } catch (error) {
      console.error("Error cargando datos:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar datos")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al cargar datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <h1 className="text-3xl font-semibold">Cargando hospital...</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <h1 className="text-3xl font-semibold">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
            <Button className="mt-4" onClick={cargarDatos}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hospital) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <h1 className="text-3xl font-semibold">Hospital no encontrado</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>No se encontró el hospital solicitado.</p>
            <Button className="mt-4" onClick={() => router.push("/hospitales")}>
              Ver todos los hospitales
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <h1 className="text-3xl font-semibold">{hospital.nombre}</h1>
        <div className="ml-auto">
          <Link href={`/hospitales/${hospital.id}/editar`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="informacion">
        <TabsList className="mb-4">
          <TabsTrigger value="informacion">Información</TabsTrigger>
          <TabsTrigger value="alumnos">Alumnos ({alumnos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="informacion">
          <Card>
            <CardHeader>
              <CardTitle>Información del Hospital</CardTitle>
              <CardDescription>Detalles completos del hospital</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Dirección</h3>
                    <div className="flex items-center mt-1">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <p>
                        {hospital.direccion}, {hospital.ciudad}, {hospital.estado} {hospital.codigo_postal}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contacto</h3>
                    <div className="flex items-center mt-1">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <p>{hospital.telefono || "No disponible"}</p>
                    </div>
                    <div className="flex items-center mt-1">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <p>{hospital.email || "No disponible"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Tipo</h3>
                    <div className="flex items-center mt-1">
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      <p>{hospital.tipo || "No especificado"}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Alumnos</h3>
                    <div className="flex items-center mt-1">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <p>{hospital.total_alumnos || 0} alumnos asignados</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alumnos">
          <Card>
            <CardHeader>
              <CardTitle>Alumnos Asignados</CardTitle>
              <CardDescription>Listado de alumnos asignados a este hospital</CardDescription>
            </CardHeader>
            <CardContent>
              {alumnos.length === 0 ? (
                <p className="text-muted-foreground">No hay alumnos asignados a este hospital.</p>
              ) : (
                <div className="border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Nombre
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Apellido
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Documento
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alumnos.map((alumno) => (
                        <tr key={alumno.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{alumno.nombre}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{alumno.apellido}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{alumno.documento}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/alumnos/${alumno.id}`} className="text-indigo-600 hover:text-indigo-900">
                              Ver
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
