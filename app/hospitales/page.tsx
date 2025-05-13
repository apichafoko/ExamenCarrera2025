
/**
 * Página principal para la visualización de hospitales.
 *
 * Esta página permite a los usuarios buscar y visualizar una lista de hospitales,
 * mostrando información relevante como nombre, dirección, ciudad, tipo de hospital
 * y el número total de alumnos asociados. Además, permite la navegación a una página
 * de detalles de un hospital específico al hacer clic en una tarjeta de hospital.
 *
 * ## Funcionalidades principales:
 * - **Carga de datos:** Los datos de los hospitales se obtienen desde un endpoint `/api/hospitales`.
 * - **Búsqueda:** Los usuarios pueden buscar hospitales por nombre utilizando un campo de entrada.
 * - **Manejo de errores:** Se muestra un mensaje de error si ocurre algún problema al cargar los datos.
 * - **Indicador de carga:** Se muestra un mensaje mientras los datos están siendo cargados.
 * - **Navegación:** Al hacer clic en una tarjeta de hospital, el usuario es redirigido a la página de detalles del hospital.
 *
 * ## Componentes utilizados:
 * - **Card:** Para mostrar la información de cada hospital en un formato visual atractivo.
 * - **Badge:** Para destacar el tipo de hospital.
 * - **Icons (MapPin, Building2, Users):** Para representar visualmente la ubicación, el tipo y el número de alumnos.
 * - **useToast:** Para mostrar notificaciones en caso de errores al cargar los datos.
 *
 * ## Estado:
 * - `hospitales`: Lista de hospitales obtenida desde la API.
 * - `isLoading`: Indica si los datos están siendo cargados.
 * - `error`: Almacena el mensaje de error en caso de que ocurra un problema.
 * - `searchTerm`: Término de búsqueda ingresado por el usuario para filtrar hospitales.
 *
 * ## Efectos:
 * - `useEffect`: Llama a la función `cargarHospitales` al montar el componente para obtener los datos iniciales.
 *
 * ## Funciones principales:
 * - `cargarHospitales`: Realiza una solicitud a la API para obtener la lista de hospitales.
 *   Maneja errores y actualiza el estado correspondiente.
 * - `filteredHospitales`: Filtra la lista de hospitales según el término de búsqueda ingresado.
 *
 * ## Interacción del usuario:
 * - Los usuarios pueden buscar hospitales escribiendo en el campo de entrada.
 * - Los usuarios pueden hacer clic en una tarjeta de hospital para navegar a su página de detalles.
 *
 * @component
 * @example
 * // Uso en una aplicación Next.js
 * import HospitalesPage from "@/app/hospitales/page";
 * 
 * export default function App() {
 *   return <HospitalesPage />;
 * }
 */
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

const HospitalesPage = () => {
  const router = useRouter()
  const [hospitales, setHospitales] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    cargarHospitales()
  }, [])

  const cargarHospitales = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Cargando hospitales...")
      const response = await fetch("/api/hospitales", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error en respuesta:", errorData)
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Datos recibidos:", data)

      if (Array.isArray(data)) {
        setHospitales(data)
      } else {
        console.error("Los datos recibidos no son un array:", data)
        setHospitales([])
        setError("Los datos recibidos no tienen el formato esperado")
      }
    } catch (error) {
      console.error("Error cargando hospitales:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar hospitales")
      toast({
        title: "Error al cargar hospitales",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      setHospitales([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredHospitales = hospitales.filter((hospital) =>
    hospital.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-6">Hospitales</h1>

      <input
        type="text"
        placeholder="Buscar hospital..."
        className="w-full px-4 py-2 border rounded-md mb-4"
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {isLoading && <p>Cargando hospitales...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredHospitales.map((hospital) => (
          <Card
            key={hospital.id}
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => router.push(`/hospitales/${hospital.id}`)}
          >
            <CardHeader className="pb-2">
              <CardTitle>{hospital.nombre || "Sin nombre"}</CardTitle>
              <CardDescription>{hospital.direccion || "Sin dirección"}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2 grid gap-2">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{hospital.ciudad || "Sin ciudad"}</span>
              </div>
              <div className="flex items-center">
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <Badge variant="outline">{hospital.tipo || "No especificado"}</Badge>
                </span>
              </div>
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{hospital.total_alumnos || 0} alumnos</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default HospitalesPage
