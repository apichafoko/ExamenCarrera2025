"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { hospitalesService } from "@/lib/db-service"

export default function HospitalForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [hospital, setHospital] = useState({
    nombre: "",
    direccion: "",
    ciudad: "",
    tipo: "",
  })

  const handleGuardar = async () => {
    if (!hospital.nombre) {
      toast({
        title: "Error",
        description: "El nombre del hospital es obligatorio.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Crear el hospital en la base de datos
      await hospitalesService.create(hospital)

      toast({
        title: "Hospital creado",
        description: "El hospital ha sido creado correctamente.",
      })

      // Redirigir después de un breve retraso para mostrar el estado de carga
      setTimeout(() => {
        setIsLoading(false)
        router.push("/hospitales")
      }, 800)
    } catch (error) {
      console.error("Error al crear el hospital:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el hospital.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/hospitales")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Hospital</h1>
            <p className="text-muted-foreground">Crea un nuevo hospital en el sistema.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Hospital</CardTitle>
          <CardDescription>Completa los campos para crear un nuevo hospital.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Hospital</Label>
              <Input
                id="nombre"
                value={hospital.nombre || ""}
                onChange={(e) => setHospital({ ...hospital, nombre: e.target.value })}
                placeholder="Ej: Hospital Universitario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={hospital.direccion || ""}
                onChange={(e) => setHospital({ ...hospital, direccion: e.target.value })}
                placeholder="Ej: Av. Principal 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={hospital.ciudad || ""}
                onChange={(e) => setHospital({ ...hospital, ciudad: e.target.value })}
                placeholder="Ej: Buenos Aires"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Hospital</Label>
              <Select value={hospital.tipo || ""} onValueChange={(value) => setHospital({ ...hospital, tipo: value })}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Público">Público</SelectItem>
                  <SelectItem value="Privado">Privado</SelectItem>
                  <SelectItem value="Universitario">Universitario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleGuardar} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Hospital
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
