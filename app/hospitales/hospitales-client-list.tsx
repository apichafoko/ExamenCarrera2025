"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Edit, Trash2, Eye, ArrowUpDown, Loader2, MapPin, Building, RefreshCw } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

// Importar el logger
import logger from "@/lib/logger"

export function HospitalesClientList() {
  const { toast } = useToast()
  const [busqueda, setBusqueda] = useState("")
  const [hospitales, setHospitales] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarHospitales = async () => {
    try {
      setIsLoading(true)
      setError(null)

      logger.log("Cargando hospitales...")
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
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      const data = await response.json()
      logger.log("Datos recibidos:", data)

      if (Array.isArray(data)) {
        setHospitales(data)
      } else {
        logger.error("Los datos recibidos no son un array:", data)
        setHospitales([])
        setError("Los datos recibidos no tienen el formato esperado")
      }
    } catch (error) {
      logger.error("Error cargando hospitales:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar hospitales")
      setHospitales([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarHospitales()
  }, [])

  const hospitalesFiltrados = hospitales.filter(
    (hospital) =>
      (hospital.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (hospital.direccion || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (hospital.ciudad || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (hospital.tipo || "").toLowerCase().includes(busqueda.toLowerCase()),
  )

  const handleEliminar = async (id: number) => {
    try {
      const response = await fetch(`/api/hospitales/${id}`, {
        method: "DELETE",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      setHospitales(hospitales.filter((hospital) => hospital.id !== id))
      toast({
        title: "Hospital eliminado",
        description: "El hospital ha sido eliminado correctamente.",
      })
    } catch (error) {
      logger.error("Error eliminando hospital:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el hospital",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lista de Hospitales</CardTitle>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={cargarHospitales} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {isLoading ? "Actualizando..." : "Actualizar"}
            </Button>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar hospitales..."
                className="pl-8"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 border border-destructive rounded-md bg-destructive/10">
            <p className="text-destructive font-medium">Error: {error}</p>
            <p className="text-sm mt-1">Verifica la conexión a la base de datos e intenta nuevamente.</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    Nombre
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    Dirección
                  </div>
                </TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hospitalesFiltrados.length > 0 ? (
                hospitalesFiltrados.map((hospital) => (
                  <TableRow key={hospital.id} className="hover-scale">
                    <TableCell className="font-medium">{hospital.id}</TableCell>
                    <TableCell>{hospital.nombre || ""}</TableCell>
                    <TableCell>{hospital.direccion || ""}</TableCell>
                    <TableCell>{hospital.ciudad || ""}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{hospital.tipo || "No especificado"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/hospitales/${hospital.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver detalles</span>
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/hospitales/${hospital.id}/editar`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará el hospital permanentemente. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleEliminar(hospital.id)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {busqueda
                      ? "No se encontraron hospitales con los filtros seleccionados."
                      : "No hay hospitales registrados."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {hospitalesFiltrados.length} de {hospitales.length} hospitales
        </div>
      </CardFooter>
    </Card>
  )
}
