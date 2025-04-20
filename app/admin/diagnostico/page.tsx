"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Database, RefreshCw } from "lucide-react"

// Importar el logger
import logger from "@/lib/logger"

export default function DiagnosticoDB() {
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creandoTablas, setCreandoTablas] = useState(false)
  const [resultadoCreacion, setResultadoCreacion] = useState<any>(null)

  const obtenerDiagnostico = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/diagnostico-db", {
        cache: "no-store",
        headers: {
          pragma: "no-cache",
          "cache-control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDiagnostico(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      logger.error("Error obteniendo diagnóstico:", err)
    } finally {
      setLoading(false)
    }
  }

  const crearTablas = async () => {
    try {
      setCreandoTablas(true)
      setResultadoCreacion(null)

      const response = await fetch("/api/crear-tablas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResultadoCreacion(data)

      // Actualizar el diagnóstico después de crear las tablas
      await obtenerDiagnostico()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      logger.error("Error creando tablas:", err)
    } finally {
      setCreandoTablas(false)
    }
  }

  useEffect(() => {
    obtenerDiagnostico()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Base de Datos</h1>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando diagnóstico...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Estado de la Conexión
                </CardTitle>
                <CardDescription>Información sobre la conexión a la base de datos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">URL de la Base de Datos:</span>
                    <span>{diagnostico?.databaseUrl}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Estado de la Conexión:</span>
                    {diagnostico?.isConnected ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" /> Conectado
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-1" /> Desconectado
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={obtenerDiagnostico} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar Estado
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tablas en la Base de Datos</CardTitle>
                <CardDescription>Listado de tablas encontradas en la base de datos</CardDescription>
              </CardHeader>
              <CardContent>
                {diagnostico?.tables && diagnostico.tables.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {diagnostico.tables.map((table: string) => (
                      <li key={table}>{table}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-yellow-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    No se encontraron tablas en la base de datos
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={crearTablas} disabled={creandoTablas} className="w-full">
                  {creandoTablas ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creando tablas...
                    </>
                  ) : (
                    <>Crear/Actualizar Tablas</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {diagnostico?.alumnosTableExists && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Estructura de la Tabla Alumnos</CardTitle>
                <CardDescription>Columnas y tipos de datos de la tabla alumnos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Columna
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo de Dato
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {diagnostico.alumnosColumns.map((column: any) => (
                        <tr key={column.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {column.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{column.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <p>Número de registros: {diagnostico.alumnosCount}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {resultadoCreacion && (
            <Alert variant={resultadoCreacion.success ? "default" : "destructive"} className="mb-6">
              {resultadoCreacion.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>{resultadoCreacion.success ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{resultadoCreacion.message || resultadoCreacion.error}</AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  )
}
