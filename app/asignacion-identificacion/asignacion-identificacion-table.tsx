"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Search, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { AsignarIdentificacionModal } from "./asignar-identificacion-modal"
import { Input } from "@/components/ui/input"

interface AsignacionIdentificacionTableProps {
  alumnos: any[]
  loading: boolean
  fecha: string
  onAlumnoUpdated: () => void
}

export function AsignacionIdentificacionTable({
  alumnos,
  loading,
  fecha,
  onAlumnoUpdated,
}: AsignacionIdentificacionTableProps) {
  const [selectedAlumno, setSelectedAlumno] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const handleOpenModal = (alumno: any) => {
    setSelectedAlumno(alumno)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAlumno(null)
  }

  const handleSuccess = () => {
    handleCloseModal()
    onAlumnoUpdated()
  }

  // Filtrar alumnos basado en el término de búsqueda
  const filteredAlumnos = alumnos.filter((alumno) => {
    if (!searchTerm) return true

    const searchTermLower = searchTerm.toLowerCase()

    // Convertir cada campo a string si existe, manejar null/undefined
    const nombreMatch = alumno.nombre != null ? String(alumno.nombre).toLowerCase().includes(searchTermLower) : false

    const apellidoMatch =
      alumno.apellido != null ? String(alumno.apellido).toLowerCase().includes(searchTermLower) : false

    const nombreCompletoMatch =
      alumno.nombre != null && alumno.apellido != null
        ? `${alumno.nombre} ${alumno.apellido}`.toLowerCase().includes(searchTermLower)
        : false

    const documentoMatch =
      alumno.documento != null ? String(alumno.documento).toLowerCase().includes(searchTermLower) : false

    const identificacionMatch =
      alumno.numero_identificacion != null
        ? String(alumno.numero_identificacion).toLowerCase().includes(searchTermLower)
        : false

    return nombreMatch || apellidoMatch || nombreCompletoMatch || documentoMatch || identificacionMatch
  })

  // Ordenar los alumnos filtrados por apellido
  const sortedAlumnos = [...filteredAlumnos].sort((a, b) => {
    const apellidoA = a.apellido != null ? String(a.apellido).toLowerCase() : ""
    const apellidoB = b.apellido != null ? String(b.apellido).toLowerCase() : ""
    return apellidoA.localeCompare(apellidoB)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre, apellido, documento o identificación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {searchTerm && (
          <Button variant="outline" size="icon" onClick={() => setSearchTerm("")} aria-label="Limpiar búsqueda">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apellido</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Número de Identificación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-9 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : sortedAlumnos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm
                    ? "No se encontraron alumnos que coincidan con la búsqueda."
                    : "No hay alumnos asignados a exámenes en esta fecha."}
                </TableCell>
              </TableRow>
            ) : (
              sortedAlumnos.map((alumno) => (
                <TableRow key={alumno.id}>
                  <TableCell>{alumno.apellido || ""}</TableCell>
                  <TableCell>{alumno.nombre || ""}</TableCell>
                  <TableCell>{alumno.documento || ""}</TableCell>
                  <TableCell>
                    {alumno.numero_identificacion || <span className="text-muted-foreground italic">No asignado</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(alumno)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && selectedAlumno && (
        <AsignarIdentificacionModal
          alumno={selectedAlumno}
          fecha={fecha}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          alumnos={alumnos}
        />
      )}
    </div>
  )
}