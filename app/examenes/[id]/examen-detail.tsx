// ExamenDetail.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, ArrowLeft, Calendar, ListChecks, Users, UserCheck, Loader2, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { format, isBefore } from "date-fns"

export default function ExamenDetail({ id }: { id: string }) {
  const router = useRouter()
  const [examen, setExamen] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    const fetchExamen = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const res = await fetch(`/api/examenes/${id}`)
        if (!res.ok) throw new Error("No se pudo obtener el examen")

        const data = await res.json()
        setExamen(data)
      } catch (error) {
        console.error("Error cargando examen:", error)
        setError(error instanceof Error ? error.message : "Error desconocido al cargar examen")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchExamen()
  }, [id])

  const handleEliminarExamen = async () => {
    try {
      const res = await fetch(`/api/examenes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar el examen")

      toast({
        title: "Examen eliminado",
        description: "El examen ha sido eliminado correctamente.",
      })
      router.push("/examenes")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el examen",
        variant: "destructive",
      })
    }
  }

  const handleDuplicarExamen = async () => {
    if (!selectedDate || isBefore(selectedDate, new Date())) {
      toast({
        title: "Fecha inválida",
        description: "La fecha debe ser futura.",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch(`/api/examenes/${id}/duplicar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha_aplicacion: selectedDate.toISOString() }),
      })

      if (!res.ok) throw new Error("No se pudo duplicar el examen")

      const nuevo = await res.json()
      toast({
        title: "Examen duplicado",
        description: `Examen creado para el ${format(selectedDate, "dd/MM/yyyy")}`,
      })
      setModalOpen(false)
      router.push(`/examenes/${nuevo.id}`)
    } catch (error) {
      toast({
        title: "Error al duplicar",
        description: error instanceof Error ? error.message : "Error inesperado",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg">Cargando información del examen...</p>
      </div>
    )
  }

  if (error || !examen) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/examenes")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "No se pudo cargar la información del examen"}</p>
            <Button onClick={() => router.push("/examenes")} className="mt-4">
              Volver a la lista
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/examenes")} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{examen.titulo}</h1>
            <p className="text-muted-foreground">
              {examen.fecha_aplicacion ? formatDate(examen.fecha_aplicacion) : "Fecha no definida"}
            </p>
          </div>
        </div>
        <div className="space-x-2">
          <Button onClick={() => router.push(`/examenes/${id}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleEliminarExamen} disabled={examen.alumnos.length > 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar Examen
          </Button>
        </div>
      </div>

      {/* Información general */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
          <CardDescription>Detalles del examen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium">Descripción</h3>
              <p className="text-muted-foreground">{examen.descripcion || "Sin descripción"}</p>
            </div>
            <div>
              <h3 className="font-medium">Estado</h3>
              <Badge variant={examen.estado === "Completado" ? "success" : "secondary"}>{examen.estado}</Badge>
            </div>
            <div className="flex items-center justify-end">
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setModalOpen(true)}>
              <Calendar className="mr-2 h-4 w-4" /> Duplicar nueva fecha
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="estaciones" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="estaciones" className="flex items-center">
            <ListChecks className="mr-2 h-4 w-4" />
            Casos
          </TabsTrigger>
          <TabsTrigger value="alumnos" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Alumnos
          </TabsTrigger>
          <TabsTrigger value="evaluadores" className="flex items-center">
            <UserCheck className="mr-2 h-4 w-4" />
            Evaluadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estaciones" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Casos del Examen
              </CardTitle>
              <CardDescription>{examen.estaciones?.length || 0} casos configurados para este examen</CardDescription>
            </CardHeader>
            <CardContent>
              {examen.estaciones && examen.estaciones.length > 0 ? (
                <div className="space-y-6">
                  {examen.estaciones.map((estacion: any, index: number) => (
                    <div key={estacion.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <h3 className="text-lg font-semibold mb-2">{estacion.titulo || `Estación ${index + 1}`}</h3>
                      <p className="text-muted-foreground mb-2">{estacion.descripcion || "Sin descripción"}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-4">Duración: {estacion.duracion_minutos || 15} minutos</span>
                        <span>Preguntas: {estacion.preguntas?.length || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No hay casos configurados para este examen.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alumnos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Alumnos Asignados
              </CardTitle>
              <CardDescription>{examen.alumnos?.length || 0} alumnos asignados a este examen</CardDescription>
            </CardHeader>
            <CardContent>
              {examen.alumnos && examen.alumnos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Apellido</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examen.alumnos.map((alumno: any) => (
                      <TableRow key={alumno.id}>
                        <TableCell className="font-medium">{alumno.apellido}</TableCell>
                        <TableCell className="font-medium">{alumno.nombre}</TableCell>
                        <TableCell>{alumno.documento || "No disponible"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              alumno.estado_asignacion === "Completado"
                                ? "success"
                                : alumno.estado_asignacion === "En progreso"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {alumno.estado_asignacion || "Pendiente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">No hay alumnos asignados a este examen.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluadores" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="mr-2 h-4 w-4" />
                Evaluadores Habilitados
              </CardTitle>
              <CardDescription>
                {examen.evaluadores?.length || 0} evaluadores habilitados para tomar este examen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {examen.evaluadores && examen.evaluadores.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Especialidad</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examen.evaluadores.map((evaluador: any) => (
                      <TableRow key={evaluador.id}>
                        <TableCell className="font-medium">
                          {evaluador.nombre} {evaluador.apellido}
                        </TableCell>
                        <TableCell>{evaluador.especialidad || "No especificada"}</TableCell>
                        <TableCell>{evaluador.email || "No disponible"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No hay evaluadores habilitados para este examen.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar examen en otra fecha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Seleccioná la nueva fecha de aplicación para el examen duplicado.
            </p>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-input rounded-md p-2 text-sm"
              placeholderText="Seleccionar fecha"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDuplicarExamen} disabled={!selectedDate}>
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
