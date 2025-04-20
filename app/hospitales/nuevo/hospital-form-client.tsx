"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import logger from "@/lib/logger"

export function HospitalFormClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    ciudad: "",
    tipo: "Público",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, tipo: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar campos
    if (!formData.nombre || !formData.direccion || !formData.ciudad) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Por favor complete todos los campos requeridos",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/hospitales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al crear el hospital")
      }

      toast({
        title: "Hospital creado",
        description: "El hospital ha sido registrado exitosamente",
      })

      router.push("/hospitales")
      router.refresh()
    } catch (error) {
      logger.error("Error al crear hospital:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el hospital",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            placeholder="Nombre del hospital"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            required
            placeholder="Dirección del hospital"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ciudad">Ciudad</Label>
          <Input
            id="ciudad"
            name="ciudad"
            value={formData.ciudad}
            onChange={handleChange}
            required
            placeholder="Ciudad donde se encuentra el hospital"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={formData.tipo} onValueChange={handleSelectChange}>
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Público">Público</SelectItem>
              <SelectItem value="Privado">Privado</SelectItem>
              <SelectItem value="Universitario">Universitario</SelectItem>
              <SelectItem value="Clínica">Clínica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/hospitales")} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar Hospital"
          )}
        </Button>
      </div>
    </form>
  )
}
