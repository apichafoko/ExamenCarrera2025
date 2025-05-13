
/**
 * Componente `AsignacionIdentificacionTable`:
 * 
 * Este componente representa una tabla interactiva que permite gestionar la asignación de números de identificación
 * a los alumnos asignados a exámenes en una fecha específica. Incluye funcionalidades de búsqueda, ordenamiento,
 * y edición de los datos de los alumnos.
 * 
 * ## Props:
 * 
 * - `alumnos` (any[]): Lista de alumnos que se mostrarán en la tabla. Cada alumno debe contener información como
 *   `nombre`, `apellido`, `documento`, y `numero_identificacion`.
 * - `loading` (boolean): Indica si los datos de los alumnos están cargando. Si es `true`, se muestran placeholders
 *   (skeletons) en lugar de los datos.
 * - `fecha` (string): Fecha del examen a la que están asignados los alumnos.
 * - `onAlumnoUpdated` (function): Callback que se ejecuta cuando se actualiza la información de un alumno.
 * 
 * ## Funcionalidades principales:
 * 
 * 1. **Búsqueda**:
 *    - Permite filtrar alumnos por nombre, apellido, documento o número de identificación.
 *    - La búsqueda es insensible a mayúsculas y minúsculas.
 *    - Incluye un botón para limpiar el término de búsqueda.
 * 
 * 2. **Ordenamiento**:
 *    - Los alumnos se ordenan alfabéticamente por apellido.
 * 
 * 3. **Edición**:
 *    - Cada fila de la tabla incluye un botón "Editar" que abre un modal para asignar o modificar el número de
 *      identificación del alumno.
 *    - El modal utiliza el componente `AsignarIdentificacionModal` para gestionar la edición.
 * 
 * 4. **Estados visuales**:
 *    - Si `loading` es `true`, se muestran placeholders (skeletons) en lugar de los datos.
 *    - Si no hay alumnos que coincidan con el término de búsqueda, se muestra un mensaje indicando que no se
 *      encontraron resultados.
 *    - Si no hay alumnos asignados a exámenes en la fecha proporcionada, se muestra un mensaje indicando que no
 *      hay alumnos disponibles.
 * 
 * ## Estructura del componente:
 * 
 * - **Barra de búsqueda**:
 *   - Input para ingresar el término de búsqueda.
 *   - Icono de búsqueda y botón para limpiar el término.
 * 
 * - **Tabla**:
 *   - Cabecera con columnas: Apellido, Nombre, Documento, Número de Identificación, y Acciones.
 *   - Cuerpo:
 *     - Si `loading` es `true`, muestra filas con placeholders.
 *     - Si no hay resultados, muestra un mensaje en una fila.
 *     - Si hay resultados, muestra los datos de los alumnos ordenados y filtrados.
 * 
 * - **Modal**:
 *   - Se abre al hacer clic en "Editar" y permite asignar o modificar el número de identificación de un alumno.
 *   - Se cierra automáticamente al completar la acción o al cancelar.
 * 
 * ## Uso:
 * 
 * Este componente es útil en aplicaciones donde se necesita gestionar la asignación de identificaciones a alumnos
 * de manera eficiente, con soporte para búsqueda y edición en tiempo real.
 */
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
