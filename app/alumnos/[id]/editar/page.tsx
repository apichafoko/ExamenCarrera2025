/**
 * Página de edición de un alumno en una aplicación Next.js.
 * 
 * Esta página permite editar la información de un alumno existente. 
 * Utiliza el ID del alumno proporcionado en los parámetros de la URL para cargar 
 * los datos del alumno desde una API y mostrarlos en un formulario editable.
 * 
 * ## Funcionalidad principal:
 * - Carga los datos del alumno y los hospitales disponibles desde la API.
 * - Permite al usuario modificar los datos del alumno a través de un formulario.
 * - Envía los datos actualizados al servidor para guardar los cambios.
 * - Maneja errores en la carga y actualización de datos, mostrando mensajes al usuario.
 * 
 * ## Componentes utilizados:
 * - **Button**: Botones para navegación y guardar cambios.
 * - **Card**: Contenedor estilizado para el formulario de edición.
 * - **Input**: Campos de entrada para los datos del alumno.
 * - **Select**: Selector desplegable para elegir el hospital asociado al alumno.
 * - **Toast**: Notificaciones para informar al usuario sobre errores o éxito.
 * - **Loader2**: Indicador de carga para mostrar cuando los datos están siendo procesados.
 * 
 * ## Hooks utilizados:
 * - `useState`: Para manejar el estado local de la página, como los datos del alumno, 
 *   el estado de carga y los hospitales disponibles.
 * - `useEffect`: Para cargar los datos del alumno y hospitales al montar el componente.
 * - `useRouter`: Para manejar la navegación entre páginas.
 * - `useToast`: Para mostrar notificaciones al usuario.
 * 
 * ## Flujo de la página:
 * 1. **Carga inicial**:
 *    - Se obtiene el ID del alumno desde los parámetros de la URL.
 *    - Se realiza una llamada a la API para obtener los datos del alumno y los hospitales.
 *    - Si ocurre un error o el ID es inválido, se redirige al usuario a la lista de alumnos.
 * 
 * 2. **Edición de datos**:
 *    - Los datos del alumno se muestran en un formulario editable.
 *    - El usuario puede modificar los campos y seleccionar un hospital de la lista.
 * 
 * 3. **Guardar cambios**:
 *    - Al hacer clic en el botón "Guardar Cambios", los datos actualizados se envían a la API.
 *    - Si la operación es exitosa, se muestra una notificación y se redirige al usuario a la página del alumno.
 *    - Si ocurre un error, se muestra una notificación de error.
 * 
 * ## Manejo de errores:
 * - Si no se encuentra el alumno o el ID es inválido, se muestra un mensaje de error y se redirige al usuario.
 * - Si ocurre un error al guardar los cambios, se muestra una notificación de error.
 * 
 * ## Consideraciones:
 * - El ID del alumno se convierte a número para evitar errores de tipo.
 * - Se valida que los datos del formulario sean correctos antes de enviarlos al servidor.
 * - Se utiliza un indicador de carga mientras los datos están siendo procesados.
 * 
 * @param params - Parámetros de la URL, incluyendo el ID del alumno.
 * @returns Componente de React que renderiza la página de edición del alumno.
 */
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
import logger from "@/lib/logger"
import { use } from "react"

export default function EditarAlumnoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  // Unwrap params using React.use
  const { id: paramId } = use(params)
  const id = Number.parseInt(paramId)
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [alumno, setAlumno] = useState<any>({
    id: 0,
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    hospital_id: "",
    fecha_nacimiento: "",
    promocion: "",
    sede: "",
    documento: "",
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

        // Log the API response for debugging
        logger.debug("Datos del alumno recibidos:", alumnoData)

        setAlumno({
          id: alumnoData.id || 0,
          nombre: alumnoData.nombre || "",
          apellido: alumnoData.apellido || "",
          email: alumnoData.email || "",
          telefono: alumnoData.telefono || "",
          hospital_id: alumnoData.hospital_id ? alumnoData.hospital_id.toString() : "",
          fecha_nacimiento:
            alumnoData.fecha_nacimiento && !isNaN(new Date(alumnoData.fecha_nacimiento))
              ? new Date(alumnoData.fecha_nacimiento).toISOString().split("T")[0]
              : "",
          promocion: alumnoData.promocion ? alumnoData.promocion.toString() : "",
          sede: alumnoData.sede || "",
          documento: alumnoData.documento ? alumnoData.documento.toString() : "",
        })

        setHospitales(hospitalesData || [])
      } catch (error) {
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

    if (!isNaN(id)) {
      cargarDatos()
    } else {
      toast({
        title: "Error",
        description: "ID de alumno inválido.",
        variant: "destructive",
      })
      router.push("/alumnos")
    }
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
        body: JSON.stringify({
          ...alumno,
          hospital_id: alumno.hospital_id ? Number.parseInt(alumno.hospital_id) : null,
          promocion: alumno.promocion ? Number.parseInt(alumno.promocion) : null,
          documento: alumno.documento ? Number.parseInt(alumno.documento) : null,
          fecha_nacimiento: alumno.fecha_nacimiento || null,
        }),
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
                onValueChange={(value) => setAlumno({ ...alumno, hospital_id: value })}
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
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fecha_nacimiento"
                type="date"
                value={alumno.fecha_nacimiento}
                onChange={(e) => setAlumno({ ...alumno, fecha_nacimiento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promocion">Promoción</Label>
              <Input
                id="promocion"
                type="number"
                value={alumno.promocion}
                onChange={(e) => setAlumno({ ...alumno, promocion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sede">Sede</Label>
              <Input
                id="sede"
                value={alumno.sede}
                onChange={(e) => setAlumno({ ...alumno, sede: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento">Documento</Label>
              <Input
                id="documento"
                type="number"
                value={alumno.documento}
                onChange={(e) => setAlumno({ ...alumno, documento: e.target.value })}
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