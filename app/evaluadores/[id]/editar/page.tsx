

/**
 * Página de edición de evaluadores.
 *
 * Esta página permite editar la información de un evaluador existente. 
 * Los datos del evaluador se obtienen ya sea desde el contexto global o desde una API externa.
 * Una vez cargados, los datos se muestran en un formulario editable.
 *
 * ## Flujo principal:
 * 1. **Carga inicial**:
 *    - Se obtiene el `id` del evaluador desde los parámetros de la URL.
 *    - Se busca el evaluador en el contexto global (`useAppContext`).
 *    - Si no se encuentra en el contexto, se realiza una solicitud a la API para obtener los datos.
 *    - Si ocurre un error (por ejemplo, el evaluador no existe), se muestra un mensaje de error y se redirige al usuario.
 *
 * 2. **Edición de datos**:
 *    - Los campos del evaluador (nombre, apellido, email, especialidad, estado) se muestran en un formulario.
 *    - El usuario puede modificar los valores directamente en los campos.
 *
 * 3. **Guardado de cambios**:
 *    - Al hacer clic en el botón "Guardar Cambios", se valida que los campos requeridos estén completos.
 *    - Se envían los datos actualizados a la API mediante una solicitud `PUT`.
 *    - Si la actualización es exitosa, se actualiza el contexto global y se muestra un mensaje de éxito.
 *    - Si ocurre un error, se muestra un mensaje de error.
 *
 * ## Componentes utilizados:
 * - **UI Components**:
 *   - `Button`, `Card`, `Input`, `Label`, `Switch` para construir la interfaz de usuario.
 * - **Íconos**:
 *   - `ArrowLeft`, `Save`, `Loader2` de `lucide-react` para mejorar la experiencia visual.
 * - **Contexto**:
 *   - `useAppContext` para acceder al estado global de evaluadores y la función `actualizarEvaluador`.
 * - **Toast**:
 *   - `useToast` para mostrar notificaciones de éxito o error.
 *
 * ## Estados:
 * - `isLoading`: Indica si la página está cargando datos o procesando una acción.
 * - `evaluador`: Contiene los datos del evaluador que se están editando.
 *
 * ## Manejo de errores:
 * - Si el `id` del evaluador es inválido o no se encuentra, se muestra un mensaje de error y se redirige al usuario.
 * - Si ocurre un error al guardar los cambios, se muestra un mensaje de error con detalles.
 *
 * ## Redirecciones:
 * - Si no se encuentra el evaluador o hay un error crítico, se redirige a la lista de evaluadores (`/evaluadores`).
 * - Después de guardar los cambios exitosamente, se redirige a la página de detalles del evaluador (`/evaluadores/[id]`).
 *
 * @param params - Parámetros de la página, incluyendo el `id` del evaluador.
 * @returns Componente de React que renderiza la página de edición de evaluadores.
 */
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
import { use } from "react"
import logger from "@/lib/logger"

export default function EditarEvaluadorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const { evaluadores, actualizarEvaluador } = useAppContext()
  // Unwrap params using React.use
  const { id: paramId } = use(params)
  const id = Number.parseInt(paramId)
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
      try {
        setIsLoading(true)

        if (isNaN(id)) {
          throw new Error("ID de evaluador inválido")
        }

        // Primero intentar buscar el evaluador por ID desde el contexto
        const evaluadorEncontrado = evaluadores.find((e) => e.id === id)

        if (evaluadorEncontrado) {
          // Si lo encuentra en el contexto, usarlo
          logger.debug("Evaluador encontrado en contexto:", evaluadorEncontrado)
          setEvaluador({
            id: evaluadorEncontrado.id,
            nombre: evaluadorEncontrado.nombre || "",
            apellido: evaluadorEncontrado.apellido || "",
            email: evaluadorEncontrado.email || "",
            especialidad: evaluadorEncontrado.especialidad || "",
            categoria: evaluadorEncontrado.categoria || "",
            activo: evaluadorEncontrado.activo === undefined ? true : evaluadorEncontrado.activo,
          })
        } else {
          // Si no está en el contexto, intentar obtenerlo de la API
          logger.debug(`Buscando evaluador ${id} en la API`)
          const response = await fetch(`/api/evaluadores/${id}`, {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          })

          if (response.ok) {
            const data = await response.json()
            logger.debug("Evaluador recibido de la API:", data)
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
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || "No se pudo encontrar el evaluador")
          }
        }
      } catch (error) {
        logger.error("Error al obtener evaluador:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Ocurrió un error al cargar los datos del evaluador",
          variant: "destructive",
        })
        router.push("/evaluadores")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvaluador()
  }, [id, evaluadores, router, toast])

  const handleGuardar = async () => {
    if (!evaluador) return

    setIsLoading(true)

    try {
      // Validar campos requeridos
      if (!evaluador.nombre || !evaluador.email) {
        throw new Error("El nombre y el correo electrónico son obligatorios")
      }

      // Actualizar el evaluador en la API
      const response = await fetch(`/api/evaluadores/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(evaluador),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al actualizar el evaluador")
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
      logger.error("Error al guardar evaluador:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al guardar los cambios.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="text-muted-foreground">Cargando información del evaluador...</p>
      </div>
    )
  }

  if (!evaluador) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">No se encontró el evaluador</p>
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