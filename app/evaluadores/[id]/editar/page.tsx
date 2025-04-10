"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAppContext } from "@/context/app-context"
import { useToast } from "@/components/ui/use-toast"

export default function EditarEvaluadorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { evaluadores, actualizarEvaluador } = useAppContext()
  const id = Number.parseInt(params.id)
  const [isLoading, setIsLoading] = useState(false)
  const [evaluador, setEvaluador] = useState<any>({
    nombre: "",
    apellido: "",
    email: "",
    especialidad: "",
    categoria: "",
    activo: false,
  })

  useEffect(() => {
    const fetchEvaluador = async () => {
      setIsLoading(true)

      // Primero intentar buscar el evaluador por ID desde el contexto
      const evaluadorEncontrado = evaluadores.find((e) => e.id === id)

      if (evaluadorEncontrado) {
        // Si lo encuentra en el contexto, usarlo
        setEvaluador({
          id: evaluadorEncontrado.id,
          nombre: evaluadorEncontrado.nombre || "",
          apellido: evaluadorEncontrado.apellido || "",
          email: evaluadorEncontrado.email || "",
          especialidad: evaluadorEncontrado.especialidad || "",
          categoria: evaluadorEncontrado.categoria || "",
          activo: evaluadorEncontrado.activo === undefined ? true : evaluadorEncontrado.activo,
        })
        setIsLoading(false)
      } else {
        // Si no está en el contexto, intentar obtenerlo de la API
        try {
          const response = await fetch(`/api/evaluadores/${id}`, {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          })

          if (response.ok) {
            const data = await response.json()
            setEvaluador({
              id: data.id,
              nombre: data.nombre || "",
              apellido: data.apellido || "",
              email: data.email || "",
              especialidad: data.especialidad || "",
              categoria: data.categoria || "",
              activo: data.activo === undefined ? true : data.activo,
            })
          } else {
            // Si tampoco está en la API, mostrar un error y redirigir
            toast({
              title: "Error",
              description: "No se pudo encontrar el evaluador",
              variant: "destructive",
            })
            router.push("/evaluadores")
          }
        } catch (error) {
          console.error("Error al obtener evaluador:", error)
          toast({
            title: "Error",
            description: "Ocurrió un error al cargar los datos del evaluador",
            variant: "destructive",
          })
          router.push("/evaluadores")
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (id) {
      fetchEvaluador()
    }
  }, [id, evaluadores, router, toast])

  const handleGuardar = async () => {
    if (!evaluador) return

    setIsLoading(true)

    try {
      // Actualizar el evaluador en la API
      const response = await fetch(`/api/evaluadores/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(evaluador),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar el evaluador")
      }

      // Actualizar el evaluador en el contexto global
      actualizarEvaluador(evaluador)

      toast({
        title: "Cambios guardados",
        description: "Los datos del evaluador han sido actualizados correctamente.",
      })

      // Redirigir después de un breve retraso para mostrar el estado de carga
      setTimeout(() => {
        setIsLoading(false)
        router.push(`/evaluadores/${id}`)
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

  if (!evaluador) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Cargando información del evaluador...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/evaluadores/${id}`)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Evaluador</h1>
            <p className="text-muted-foreground">Modifica la información del evaluador.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Evaluador</CardTitle>
          <CardDescription>Actualiza los campos que deseas modificar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                value={evaluador.nombre || ""}
                onChange={(e) => setEvaluador({ ...evaluador, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                value={evaluador.apellido || ""}
                onChange={(e) => setEvaluador({ ...evaluador, apellido: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={evaluador.email || ""}
                onChange={(e) => setEvaluador({ ...evaluador, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="especialidad">Especialidad</Label>
              <Input
                id="especialidad"
                value={evaluador.especialidad || ""}
                onChange={(e) => setEvaluador({ ...evaluador, especialidad: e.target.value })}
              />
            </div>
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
            Guardar Cambios
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
