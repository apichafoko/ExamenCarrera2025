"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function NuevoExamenPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [examen, setExamen] = useState({
    titulo: "",
    descripcion: "",
    fecha_aplicacion: "",
    estado: "borrador",
  })

  const handleGuardar = async () => {
    if (!examen.titulo) {
      toast({
        title: "Error",
        description: "El título del examen es obligatorio.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/examenes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(examen),
      })

      if (!response.ok) throw new Error("Error al crear la estación")

      const nuevoExamen = await response.json()

      toast({
        title: "Examen creado",
        description: "La estación ha sido creada correctamente. Ahora puedes agregar casos y preguntas.",
      })

      setTimeout(() => {
        setIsLoading(false)
        if (nuevoExamen && nuevoExamen.id) {
          router.push(`/examenes/${nuevoExamen.id}/editar`)
        } else {
          console.error("Error: nuevoExamen o nuevoExamen.id es nulo/indefinido")
        }
      }, 800)
    } catch (error) {
      console.error("Error al crear la estación:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear la estación.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/examenes")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nueva Estación</h1>
            <p className="text-muted-foreground">Crea una nueva estación en el sistema.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Estación</CardTitle>
          <CardDescription>Completa los campos para crear una nueva estación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título de la estación</Label>
              <Input
                id="titulo"
                value={examen.titulo || ""}
                onChange={(e) => setExamen({ ...examen, titulo: e.target.value })}
                placeholder="Ej: Examen Final de Cardiología"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha del Examen</Label>
              <Input
                id="fecha"
                type="date"
                value={examen.fecha_aplicacion || ""}
                onChange={(e) => setExamen({ ...examen, fecha_aplicacion: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={examen.descripcion || ""}
                onChange={(e) => setExamen({ ...examen, descripcion: e.target.value })}
                placeholder="Descripción del examen..."
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleGuardar} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Crear estación
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
