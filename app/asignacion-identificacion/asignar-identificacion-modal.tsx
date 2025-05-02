"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AsignarIdentificacionModalProps {
  alumno: any
  fecha: string
  onClose: () => void
  onSuccess: () => void
  alumnos: any[]
}

export function AsignarIdentificacionModal({
  alumno,
  fecha,
  onClose,
  onSuccess,
  alumnos,
}: AsignarIdentificacionModalProps) {
  const [numeroIdentificacion, setNumeroIdentificacion] = useState(alumno?.numero_identificacion || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que el número de identificación no esté vacío
    if (!numeroIdentificacion.trim()) {
      setError("El número de identificación no puede estar vacío")
      return
    }

    // Validar que el número de identificación no esté asignado a otro alumno
    const isDuplicate = alumnos.some(
      (a) =>
        a.id !== alumno.id &&
        a.numero_identificacion &&
        typeof a.numero_identificacion === "string" &&
        a.numero_identificacion.trim() === numeroIdentificacion.trim(),
    )

    if (isDuplicate) {
      setError("El número de identificación ya está asignado a otro alumno en esta fecha")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/asignacion/identificacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alumnoId: alumno.id,
          fecha: fecha,
          numeroIdentificacion: numeroIdentificacion.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al asignar número de identificación")
      }

      onSuccess()
    } catch (error) {
      console.error("Error al asignar número de identificación:", error)
      setError(error instanceof Error ? error.message : "Error al asignar el número de identificación")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Número de Identificación</DialogTitle>
          <DialogDescription>
            Asigna un número de identificación único al alumno {alumno.nombre} {alumno.apellido} para el examen del{" "}
            {fecha}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="identificacion" className="text-right">
                Número
              </Label>
              <Input
                id="identificacion"
                value={numeroIdentificacion}
                onChange={(e) => {
                  setNumeroIdentificacion(e.target.value)
                  setError(null) // Limpiar error cuando el usuario cambia el valor
                }}
                className="col-span-3"
                placeholder="Ingrese el número de identificación"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
