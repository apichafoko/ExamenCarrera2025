import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { hospitalesService } from "@/lib/db-service"

// Este es un componente de servidor que puede usar async/await
export async function HospitalesListServer() {
  // Intentar obtener la lista de hospitales
  let hospitales = []
  let error = null

  try {
    hospitales = await hospitalesService.getAll()
  } catch (err) {
    console.error("Error al cargar hospitales:", err)
    error = err instanceof Error ? err.message : "Error desconocido al cargar hospitales"
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>No se pudieron cargar los hospitales debido a un error:</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-mono bg-muted p-2 rounded">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (hospitales.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>No hay hospitales registrados</CardTitle>
          <CardDescription>Comienza agregando un nuevo hospital al sistema</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {hospitales.map((hospital) => (
        <Link key={hospital.id} href={`/hospitales/${hospital.id}`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>{hospital.nombre}</CardTitle>
              <CardDescription>{hospital.ciudad}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{hospital.direccion}</p>
              {hospital.telefono && <p className="text-sm mt-2">Tel: {hospital.telefono}</p>}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
