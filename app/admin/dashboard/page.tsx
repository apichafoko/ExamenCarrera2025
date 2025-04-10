import { DatabaseStats } from "@/components/database-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SyncStatus } from "@/components/sync-status"
import { Database, RefreshCw } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Panel de control para administrar y visualizar datos del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <DatabaseStats />
        </div>
        <div className="space-y-6">
          <SyncStatus />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Estado de la Base de Datos
              </CardTitle>
              <CardDescription>Información sobre la conexión a PostgreSQL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Estado</div>
                <div className="flex items-center text-sm text-green-500">
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Conectado
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Tablas</div>
                <div className="text-sm">14 tablas</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Proveedor</div>
                <div className="text-sm">Neon PostgreSQL</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
