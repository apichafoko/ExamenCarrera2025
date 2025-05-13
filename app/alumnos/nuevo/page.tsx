

/**
 * Página para la creación de un nuevo alumno en el sistema.
 * 
 * Esta página permite a los usuarios ingresar información sobre un nuevo alumno
 * y guardarla en la base de datos. Incluye validaciones básicas y manejo de errores
 * para garantizar que los datos requeridos sean proporcionados y que el proceso de creación
 * sea exitoso.
 * 
 * ## Funcionalidades principales:
 * 
 * - **Carga de hospitales**: Al cargar la página, se realiza una solicitud a la API para obtener
 *   la lista de hospitales disponibles, que se muestra en un menú desplegable.
 * - **Formulario de creación**: El formulario incluye campos para ingresar información como
 *   nombre, apellido, correo electrónico, teléfono, hospital, fecha de nacimiento, promoción,
 *   sede y documento.
 * - **Validación de campos obligatorios**: Antes de enviar los datos, se valida que los campos
 *   `nombre`, `apellido` y `email` estén completos.
 * - **Manejo de errores**: Si ocurre un error al cargar los hospitales o al guardar el alumno,
 *   se muestra un mensaje de error al usuario utilizando el componente `toast`.
 * - **Indicadores de carga**: Se muestran indicadores visuales mientras se cargan los hospitales
 *   o se guarda el alumno.
 * - **Redirección**: Una vez que el alumno es creado exitosamente, el usuario es redirigido
 *   a la lista de alumnos.
 * 
 * ## Componentes utilizados:
 * 
 * - **UI Components**: Se utilizan componentes personalizados como `Button`, `Card`, `Input`,
 *   `Label`, `Select`, y `Toast` para construir la interfaz de usuario.
 * - **Iconos**: Iconos de `lucide-react` como `ArrowLeft`, `Save` y `Loader2` para mejorar
 *   la experiencia visual.
 * - **Hooks**:
 *   - `useState`: Para manejar el estado del formulario, la lista de hospitales y los indicadores
 *     de carga.
 *   - `useEffect`: Para cargar los hospitales al montar el componente.
 *   - `useRouter`: Para manejar la navegación entre páginas.
 *   - `useToast`: Para mostrar notificaciones al usuario.
 * 
 * ## Flujo de trabajo:
 * 
 * 1. Al cargar la página, se ejecuta el efecto `useEffect` para obtener la lista de hospitales
 *    desde la API.
 * 2. El usuario completa los campos del formulario.
 * 3. Al hacer clic en el botón "Guardar Alumno", se valida la información ingresada.
 * 4. Si la validación es exitosa, se envían los datos a la API para crear el alumno.
 * 5. Si la creación es exitosa, se muestra un mensaje de éxito y se redirige al usuario.
 * 6. Si ocurre un error, se muestra un mensaje de error al usuario.
 * 
 * ## Notas:
 * 
 * - La API de hospitales se espera en la ruta `/api/hospitales`.
 * - La API para crear alumnos se espera en la ruta `/api/alumnos`.
 * - Los campos `telefono`, `hospital_id`, `fecha_nacimiento`, `promocion`, `sede` y `documento`
 *   son opcionales y pueden enviarse como `null` si no se completan.
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
    fecha_nacimiento: "",
    promocion: "",
    sede: "",
    documento: "",
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
        logger.error("Error cargando hospitales:", error)
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
        body: JSON.stringify({
          nombre: alumno.nombre,
          apellido: alumno.apellido,
          email: alumno.email,
          telefono: alumno.telefono || null,
          hospital_id: alumno.hospital_id ? Number.parseInt(alumno.hospital_id) : null,
          fecha_nacimiento: alumno.fecha_nacimiento || null,
          promocion: alumno.promocion ? Number.parseInt(alumno.promocion) : null,
          sede: alumno.sede || null,
          documento: alumno.documento ? Number.parseInt(alumno.documento) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al crear el alumno")
      }

      toast({
        title: "Alumno creado",
        description: "El alumno ha sido creado correctamente.",
      })

      setTimeout(() => {
        setIsLoading(false)
        router.push("/alumnos")
      }, 800)
    } catch (error) {
      logger.error("Error al crear el alumno:", error)
      setIsLoading(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al crear el alumno.",
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
                placeholder="Ej: 2000-01-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promocion">Promoción</Label>
              <Input
                id="promocion"
                type="number"
                value={alumno.promocion}
                onChange={(e) => setAlumno({ ...alumno, promocion: e.target.value })}
                placeholder="Ej: 2023"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sede">Sede</Label>
              <Input
                id="sede"
                value={alumno.sede}
                onChange={(e) => setAlumno({ ...alumno, sede: e.target.value })}
                placeholder="Ej: Madrid"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento">Documento</Label>
              <Input
                id="documento"
                type="number"
                value={alumno.documento}
                onChange={(e) => setAlumno({ ...alumno, documento: e.target.value })}
                placeholder="Ej: 12345678"
              />
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