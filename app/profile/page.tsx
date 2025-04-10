"use client"

import { CardFooter } from "@/components/ui/card"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: user?.nombre || "",
    apellido: "",
    email: user?.email || "",
    password: "",
    newPassword: "",
  })
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validar que la contraseña actual sea correcta
      const response = await fetch("/api/auth/validate-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user?.email, password: formData.password }),
      })

      if (!response.ok) {
        setError("La contraseña actual es incorrecta.")
        toast({
          title: "Error",
          description: "La contraseña actual es incorrecta.",
          variant: "destructive",
        })
        return
      }

      // Enviar los datos actualizados al backend
      const updateResponse = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user?.id,
          nombre: formData.nombre,
          email: formData.email,
          newPassword: formData.newPassword,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.message || "Error al actualizar el perfil")
      }

      toast({
        title: "Cambios guardados",
        description: "Tu perfil ha sido actualizado correctamente.",
      })

      // Forzar un logout para que el usuario vuelva a iniciar sesión con las nuevas credenciales
      logout()
      router.push("/login")
    } catch (error) {
      console.error("Error al actualizar el perfil:", error)
      setError("Ocurrió un error al actualizar el perfil.")
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el perfil.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=100&width=100" alt={user?.nombre || "Usuario"} />
              <AvatarFallback>{user?.nombre?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">Perfil de Usuario</CardTitle>
          <CardDescription>Modifica la información de tu cuenta</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña actual</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar Cambios
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
