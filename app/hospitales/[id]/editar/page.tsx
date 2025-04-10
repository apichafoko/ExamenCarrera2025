"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppContext } from "@/context/app-context"
import { useToast } from "@/components/ui/use-toast"

export default function EditarHospitalPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { hospitales, actualizarHospital } = useAppContext()
  const id = Number.parseInt(params.id)
  const [isLoading, setIsLoading] = useState(false)
  const [hospital, setHospital] = useState<any>({
    id: 0,
    nombre: "",
    direccion: "",
    ciudad: "",
    tipo: "",
  })

  useEffect(() => {
    // Buscar el hospital por ID desde el contexto
    const hospitalEncontrado = hospitales.find((h) => h.id === id)
    if (hospitalEncontrado) {
      // Asegurarse de que todos los campos tengan valores definidos
      setHospital({
        id: hospitalEncontrado.id,
        nombre: hospitalEncontrado.nombre || "",
        direccion: hospitalEncontrado.direccion || "",
        ciudad: hospitalEncontrado.ciudad || "",
        tipo: hospitalEncontrado.tipo || "",
      })
    } else {
      // Si no se encuentra, redirigir a la lista
      router.push("/hospitales")
    }
  }, [id, hospitales, router])

  const handleGuardar = () => {
    if (!hospital) return

    setIsLoading(true)

    try {
      // Actualizar el hospital en el contexto global
      actualizarHospital(hospital)

      toast({
        title: "Cambios guardados",
        description: "Los datos del hospital han sido actualizados correctamente.",
      })

      // Redirigir después de un breve retraso para mostrar el estado de carga
      setTimeout(() => {
        setIsLoading(false)
        router.push(`/hospitales/${id}`)
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

  if (!hospital) {
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
          <Button variant="ghost" size="icon" onClick={() => router.push(`/hospitales/${id}`)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Hospital</h1>
            <p className="text-muted-foreground">Modifica la información del hospital.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Hospital</CardTitle>
          <CardDescription>Actualiza los campos que deseas modificar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Hospital</Label>
              <Input
                id="nombre"
                value={hospital.nombre || ""}
                onChange={(e) => setHospital({ ...hospital, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={hospital.direccion || ""}
                onChange={(e) => setHospital({ ...hospital, direccion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={hospital.ciudad || ""}
                onChange={(e) => setHospital({ ...hospital, ciudad: e.target.value })}
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
            Guardar Cambios
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
