
/**
 * Página para registrar un nuevo hospital en el sistema.
 *
 * Esta página permite a los usuarios ingresar la información necesaria para registrar un nuevo hospital.
 * Incluye un formulario interactivo y componentes adicionales para mejorar la experiencia del usuario.
 *
 * Estructura de la página:
 * - Encabezado: Contiene un botón para regresar a la lista de hospitales y un título con descripción.
 * - Estado de conexión a la base de datos: Muestra el estado actual de la conexión a la base de datos.
 * - Tarjeta de formulario: Contiene el formulario para ingresar los datos del nuevo hospital.
 *
 * Componentes utilizados:
 * - `Link`: Proporciona navegación hacia la página de lista de hospitales.
 * - `Button`: Botón estilizado para regresar a la página anterior.
 * - `ArrowLeft`: Icono de flecha para indicar navegación hacia atrás.
 * - `DatabaseConnectionStatus`: Componente que muestra el estado de la conexión a la base de datos.
 * - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`: Componentes para estructurar y estilizar la tarjeta del formulario.
 * - `HospitalFormClient`: Componente que contiene el formulario para registrar un nuevo hospital.
 *
 * Estilos:
 * - Utiliza clases de Tailwind CSS para el diseño y espaciado.
 * - Clases como `text-3xl`, `font-bold`, y `tracking-tight` se usan para estilizar el título.
 * - Clases como `text-muted-foreground` se usan para estilizar la descripción.
 *
 * Navegación:
 * - El botón de regreso redirige a la página `/hospitales`.
 *
 * Uso:
 * Esta página está diseñada para ser utilizada por administradores o personal autorizado
 * que necesite agregar nuevos hospitales al sistema.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatabaseConnectionStatus } from "@/components/database-connection-status"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { HospitalFormClient } from "./hospital-form-client"

export default function NuevoHospitalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/hospitales">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Hospital</h1>
            <p className="text-muted-foreground">Registra un nuevo hospital en el sistema</p>
          </div>
        </div>
      </div>

      <DatabaseConnectionStatus />

      <Card>
        <CardHeader>
          <CardTitle>Información del Hospital</CardTitle>
          <CardDescription>Ingresa los datos del nuevo hospital</CardDescription>
        </CardHeader>
        <CardContent>
          <HospitalFormClient />
        </CardContent>
      </Card>
    </div>
  )
}
