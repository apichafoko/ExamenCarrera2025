"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, UserCheck } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import SyncManager from "@/components/sync-manager"

export default function SyncPage() {
  const { toast } = useToast()
  const [isSyncingUsers, setIsSyncingUsers] = useState(false)

  const handleSyncUsers = async () => {
    try {
      setIsSyncingUsers(true)
      const response = await fetch("/api/admin/sync-users", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Error al sincronizar usuarios")
      }

      const data = await response.json()
      toast({
        title: "Sincronización completada",
        description: data.message || "Usuarios sincronizados correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron sincronizar los usuarios",
        variant: "destructive",
      })
    } finally {
      setIsSyncingUsers(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sincronización</h1>
        <p className="text-muted-foreground">
          Gestiona la sincronización de datos entre el almacenamiento local y la base de datos.
        </p>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data">Datos</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>
        <TabsContent value="data" className="space-y-4 mt-4">
          <SyncManager />
        </TabsContent>
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="mr-2 h-5 w-5" />
                Sincronización de Usuarios
              </CardTitle>
              <CardDescription>
                Sincroniza los evaluadores de la base de datos con los usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Esta acción creará usuarios para todos los evaluadores que no tengan un usuario asociado. Los usuarios
                creados tendrán como contraseña por defecto: <strong>password</strong>
              </p>
              <Button onClick={handleSyncUsers} disabled={isSyncingUsers} className="w-full">
                {isSyncingUsers ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar Usuarios
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
