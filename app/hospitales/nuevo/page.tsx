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
