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

export default function NuevoAlumnoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [alumno, setAlumno] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    hospital_id: "",
  })
  const [hospitales, setHospitales] = useState<any[]>([])

  useEffect(() => {
    const cargarHospitales = async () => {
      try {
        setIsDataLoading(true)
        const response = await fetch("/api/hospitales")
        if (!response.ok) throw new Error("Error al cargar hospitales")

        const hospitalesData = await response.json()
        setHospitales(hospitalesData)
      } catch (error) {
        console.error("Error cargando hospitales:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los hospitales.",
          variant: "destructive",
        })
      } finally {
        setIsDataLoading(false)
      }
    }

    cargarHospitales()
  }, [toast])

  const handleGuardar = async () => {
    if (!alumno.nombre || !alumno.apellido || !alumno.email) {
      toast({
        title: "Error",
        description: "El nombre, apellido y correo electrónico son obligatorios.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/alumnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(alumno),
      })

      if (!response.ok) throw new Error("Error al crear el alumno")

      toast({
        title: "Alumno creado",
        description: "El alumno ha sido creado correctamente.",
      })

      setTimeout(() => {
        setIsLoading(false)
        router.push("/alumnos")
      }, 800)
    } catch (error) {
      console.error("Error al crear el alumno:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el alumno.",
        variant: "destructive",
      })
    }
  }

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="text-muted-foreground">Cargando hospitales...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Alumno</h1>
            <p className="text-muted-foreground">Crea un nuevo alumno en el sistema.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Alumno</CardTitle>
          <CardDescription>Completa los campos para crear un nuevo alumno.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={alumno.nombre}
                onChange={(e) => setAlumno({ ...alumno, nombre: e.target.value })}
                placeholder="Ej: Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                value={alumno.apellido}
                onChange={(e) => setAlumno({ ...alumno, apellido: e.target.value })}
                placeholder="Ej: Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={alumno.email}
                onChange={(e) => setAlumno({ ...alumno, email: e.target.value })}
                placeholder="Ej: juan.perez@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={alumno.telefono}
                onChange={(e) => setAlumno({ ...alumno, telefono: e.target.value })}
                placeholder="Ej: +54 11 1234-5678"
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
            Guardar Alumno
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
