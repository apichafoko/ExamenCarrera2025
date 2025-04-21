"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

// Importar el logger
import logger from "@/lib/logger"

export default function EditarAlumnoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const id = Number.parseInt(params.id)
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [alumno, setAlumno] = useState<any>({
    id: 0,
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    hospital_id: "",
  })
  const [hospitales, setHospitales] = useState<any[]>([])

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsDataLoading(true)

        const [alumnoRes, hospitalesRes] = await Promise.all([fetch(`/api/alumnos/${id}`), fetch("/api/hospitales")])

        if (!alumnoRes.ok) throw new Error("No se pudo obtener el alumno")
        if (!hospitalesRes.ok) throw new Error("No se pudo obtener los hospitales")

        const alumnoData = await alumnoRes.json()
        const hospitalesData = await hospitalesRes.json()

        if (!alumnoData) {
          toast({
            title: "Error",
            description: "No se encontró el alumno solicitado.",
            variant: "destructive",
          })
          router.push("/alumnos")
          return
        }

        setAlumno({
          id: alumnoData.id,
          nombre: alumnoData.nombre || "",
          apellido: alumnoData.apellido || "",
          email: alumnoData.email || "",
          telefono: alumnoData.telefono || "",
          hospital_id: alumnoData.hospital_id?.toString() || "",
        })

        setHospitales(hospitalesData)
      } catch (error) {
        // Reemplazar todas las instancias de console.error
        // Por ejemplo, cambiar:
        // console.error("Error cargando datos:", error)
        // a:
        // logger.error("Error cargando datos:", error)
        logger.error("Error cargando datos:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los datos.",
          variant: "destructive",
        })
      } finally {
        setIsDataLoading(false)
      }
    }

    cargarDatos()
  }, [id, router, toast])

  const handleGuardar = async () => {
    if (!alumno) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/alumnos/${alumno.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(alumno),
      })

      if (!response.ok) throw new Error("Error al actualizar el alumno")

      toast({
        title: "Cambios guardados",
        description: "Los datos del alumno han sido actualizados correctamente.",
      })

      setTimeout(() => {
        setIsLoading(false)
        router.push(`/alumnos/${id}`)
      }, 800)
    } catch (error) {
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los cambios.",
        variant: "destructive",
      })
    }
  }

  if (isDataLoading) {
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
          <Button variant="ghost" size="icon" onClick={() => router.push(`/alumnos/${id}`)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Alumno</h1>
            <p className="text-muted-foreground">Modifica la información del alumno.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Alumno</CardTitle>
          <CardDescription>Actualiza los campos que deseas modificar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={alumno.nombre}
                onChange={(e) => setAlumno({ ...alumno, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                value={alumno.apellido}
                onChange={(e) => setAlumno({ ...alumno, apellido: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={alumno.email}
                onChange={(e) => setAlumno({ ...alumno, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={alumno.telefono}
                onChange={(e) => setAlumno({ ...alumno, telefono: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hospital">Hospital</Label>
              <Select
                value={alumno.hospital_id?.toString() || ""}
                onValueChange={(value) => setAlumno({ ...alumno, hospital_id: Number.parseInt(value) })}
              >
                <SelectTrigger id="hospital">
                  <SelectValue placeholder="Seleccionar hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitales.map((hospital) => (
                    <SelectItem key={hospital.id} value={hospital.id.toString()}>
                      {hospital.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleGuardar} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
