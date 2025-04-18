"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAppContext } from "@/context/app-context"
import { useToast } from "@/components/ui/use-toast"

export default function NuevoEvaluadorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { agregarEvaluador } = useAppContext()
  const [isLoading, setIsLoading] = useState(false)
  const [evaluador, setEvaluador] = useState({
    nombre: "",
    apellido: "", // Added apellido
    email: "",
    especialidad: "",
    categoria: "", // Removed categoria
    activo: true,
  })

  const handleGuardar = async () => {
    if (!evaluador.nombre || !evaluador.email || !evaluador.apellido) {
      toast({
        title: "Error",
        description: "El nombre, apellido y el correo electrónico son obligatorios.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Agregar el evaluador en el contexto global
      await agregarEvaluador({
        nombre: evaluador.nombre,
        apellido: evaluador.apellido, // Use apellido
        email: evaluador.email,
        especialidad: evaluador.especialidad || "",
        categoria: evaluador.categoria || "", // Removed categoria
        activo: evaluador.activo,
      })

      toast({
        title: "Evaluador creado",
        description: "El evaluador ha sido creado correctamente.",
      })

      // Redirigir después de un breve retraso para mostrar el estado de carga
      setTimeout(() => {
        setIsLoading(false)
        router.push("/evaluadores")
      }, 800)
    } catch (error) {
      console.error("Error al crear evaluador:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: `Ocurrió un error al crear el evaluador: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/evaluadores")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Evaluador</h1>
            <p className="text-muted-foreground">Crea un nuevo evaluador para los exámenes.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Evaluador</CardTitle>
          <CardDescription>Completa los campos para crear un nuevo evaluador.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                value={evaluador.nombre || ""}
                onChange={(e) => setEvaluador({ ...evaluador, nombre: e.target.value })}
                placeholder="Ej: Dr. Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                value={evaluador.apellido || ""}
                onChange={(e) => setEvaluador({ ...evaluador, apellido: e.target.value })}
                placeholder="Ej: Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={evaluador.email || ""}
                onChange={(e) => setEvaluador({ ...evaluador, email: e.target.value })}
                placeholder="Ej: juan.perez@hospital.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="especialidad">Especialidad</Label>
              <Input
                id="especialidad"
                value={evaluador.especialidad || ""}
                onChange={(e) => setEvaluador({ ...evaluador, especialidad: e.target.value })}
                placeholder="Ej: Cardiología"
              />
            </div>
            {/* Removed Categoria input */}
            <div className="flex items-center justify-between space-x-2 pt-6">
              <Label htmlFor="activo" className="flex flex-col space-y-1">
                <span>Estado</span>
                <span className="font-normal text-sm text-muted-foreground">
                  El evaluador estará disponible para asignar a exámenes.
                </span>
              </Label>
              <Switch
                id="activo"
                checked={evaluador.activo}
                onCheckedChange={(checked) => setEvaluador({ ...evaluador, activo: checked })}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleGuardar} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Evaluador
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
