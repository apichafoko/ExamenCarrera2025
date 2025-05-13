/**
 * Página de inicio de sesión para el Sistema de Evaluación Académica.
 *
 * Esta página permite a los usuarios autenticarse ingresando su correo electrónico
 * y contraseña. Si las credenciales son válidas, el usuario será redirigido a la
 * página principal del sistema. En caso de error, se mostrarán mensajes de error
 * específicos utilizando el sistema de notificaciones.
 *
 * Componentes principales:
 * - `Card`: Contenedor principal que organiza el contenido de la página.
 * - `Input`: Campos de entrada para el correo electrónico y la contraseña.
 * - `Button`: Botón para enviar el formulario de inicio de sesión.
 * - `useAuth`: Contexto para manejar la lógica de autenticación.
 * - `useToast`: Sistema de notificaciones para mostrar mensajes al usuario.
 *
 * Funcionalidad:
 * - El formulario captura los datos de inicio de sesión (correo y contraseña).
 * - Al enviar el formulario, se llama a la función `login` del contexto de autenticación.
 * - Si el inicio de sesión es exitoso, se muestra un mensaje de éxito y se redirige al usuario.
 * - Si ocurre un error, se muestra un mensaje de error específico.
 *
 * Estados:
 * - `isLoading`: Indica si la solicitud de inicio de sesión está en progreso.
 * - `error`: Almacena mensajes de error para mostrarlos en la interfaz.
 * - `formData`: Objeto que contiene los valores de los campos del formulario.
 *
 * Diseño:
 * - La página utiliza componentes de interfaz de usuario personalizados para mantener
 *   consistencia en el diseño.
 * - Incluye un logo y un ícono representativo del sistema.
 *
 * Uso:
 * - Esta página está diseñada para ser utilizada como la pantalla de inicio de sesión
 *   principal del sistema.
 */
"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const success = await login(formData.email, formData.password)

      if (success) {
        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido al sistema de evaluación académica.",
          duration: 3000,
        })
        router.push("/")
      } else {
        setError("Credenciales inválidas. Por favor, inténtalo de nuevo.")
        toast({
          title: "Error de autenticación",
          description: "Correo electrónico o contraseña incorrectos.",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error en login:", error)
      setError("Ocurrió un error al intentar iniciar sesión.")
      toast({
        title: "Error",
        description: "Ocurrió un error al intentar iniciar sesión.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Sistema de Evaluación Académica</CardTitle>
          <div className="flex justify-center mb-4 items-center gap-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-E6cObsYKXSKMv2Y2PidoSHrcoylfWw.png"
              alt="Logo AAARBA"
              width={120}
              height={40}
              className="h-12 w-auto"
            />
          </div>
          <CardDescription>Ingresa tus credenciales para acceder al sistema de evaluación académica</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Iniciar Sesión
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
