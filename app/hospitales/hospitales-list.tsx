"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { Hospital } from "@/lib/db-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Edit, Users } from "lucide-react"

export default function HospitalesList() {
  const [hospitales, setHospitales] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHospitales = async () => {
      try {
        const response = await fetch("/api/hospitales")
        if (!response.ok) {
          throw new Error("Error al cargar hospitales")
        }
        const data = await response.json()
        console.log("Datos recibidos:", data)
        setHospitales(data)
      } catch (err) {
        console.error("Error:", err)
        setError("Error al cargar los hospitales. Intente nuevamente.")
      } finally {
        setLoading(false)
      }
    }

    fetchHospitales()
  }, [])

  if (loading) {
    return <div className="flex justify-center p-4">Cargando hospitales...</div>
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Hospitales</CardTitle>
        <Link href="/hospitales/nuevo">
          <Button>Nuevo Hospital</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Alumnos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hospitales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No hay hospitales registrados
                </TableCell>
              </TableRow>
            ) : (
              hospitales.map((hospital) => (
                <TableRow key={hospital.id}>
                  <TableCell className="font-medium">{hospital.nombre}</TableCell>
                  <TableCell>{hospital.ciudad}</TableCell>
                  <TableCell>{hospital.tipo}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {hospital.total_alumnos || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/hospitales/${hospital.id}`}>
                        <Button variant="outline" size="icon">
                          <Building2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/hospitales/${hospital.id}/editar`}>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
