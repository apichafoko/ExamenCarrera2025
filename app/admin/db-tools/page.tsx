"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, CheckCircle, Database, RefreshCw, Play } from "lucide-react"

// Importar el logger
import logger from "@/lib/logger"

export default function DbToolsPage() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [initStatus, setInitStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sqlQuery, setSqlQuery] = useState<string>("")
  const [queryResult, setQueryResult] = useState<any>(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)

  const testConnection = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/test-db-direct", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })

      const data = await response.json()
      setConnectionStatus(data)

      if (!data.success) {
        setError(data.error || "Error desconocido al probar la conexión")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      logger.error("Error probando conexión:", err)
    } finally {
      setLoading(false)
    }
  }

  const initializeDb = async () => {
    try {
      setInitLoading(true)
      setError(null)

      const response = await fetch("/api/init-db", {
        method: "POST",
        headers: { "Cache-Control": "no-cache" },
      })

      const data = await response.json()
      setInitStatus(data)

      if (!data.success) {
        setError(data.error || "Error desconocido al inicializar la base de datos")
      } else {
        // Actualizar el estado de conexión después de inicializar
        await testConnection()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      logger.error("Error inicializando DB:", err)
    } finally {
      setInitLoading(false)
    }
  }

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      setQueryError("La consulta SQL no puede estar vacía")
      return
    }

    try {
      setQueryLoading(true)
      setQueryError(null)
      setQueryResult(null)

      const response = await fetch("/api/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ query: sqlQuery }),
      })

      const data = await response.json()

      if (!data.success) {
        setQueryError(data.error || "Error ejecutando la consulta")
      } else {
        setQueryResult(data.result)
      }
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : "Error desconocido")
      logger.error("Error ejecutando consulta:", err)
    } finally {
      setQueryLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Herramientas de Base de Datos</h1>

      <Tabs defaultValue="connection">
        <TabsList className="mb-6">
          <TabsTrigger value="connection">Conexión</TabsTrigger>
          <TabsTrigger value="initialize">Inicializar DB</TabsTrigger>
          <TabsTrigger value="query">Consulta SQL</TabsTrigger>
        </TabsList>

        <TabsContent value="connection">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Estado de la Conexión
              </CardTitle>
              <CardDescription>Prueba la conexión a la base de datos</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Probando conexión...</span>
                </div>
              ) : connectionStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Estado:</span>
                    {connectionStatus.success ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" /> Conectado
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" /> Error de conexión
                      </span>
                    )}
                  </div>

                  {connectionStatus.tables && (
                    <div>
                      <span className="font-medium">Tablas encontradas:</span>
                      {connectionStatus.tables.length > 0 ? (
                        <ul className="list-disc pl-5 mt-2">
                          {connectionStatus.tables.map((table: string) => (
                            <li key={table}>{table}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-yellow-600">No se encontraron tablas</p>
                      )}
                    </div>
                  )}

                  {connectionStatus.message && <p className="text-sm text-gray-500">{connectionStatus.message}</p>}
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button onClick={testConnection} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Probando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Probar Conexión
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="initialize">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Inicializar Base de Datos</CardTitle>
              <CardDescription>Crea las tablas necesarias e inserta datos de ejemplo</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  Esta acción creará todas las tablas necesarias si no existen y agregará datos de ejemplo. Las tablas
                  existentes no se modificarán.
                </AlertDescription>
              </Alert>

              {initLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Inicializando base de datos...</span>
                </div>
              ) : initStatus ? (
                <div className="space-y-4">
                  <Alert variant={initStatus.success ? "default" : "destructive"}>
                    {initStatus.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{initStatus.success ? "Éxito" : "Error"}</AlertTitle>
                    <AlertDescription>{initStatus.message || initStatus.error}</AlertDescription>
                  </Alert>

                  {initStatus.tables && (
                    <div>
                      <span className="font-medium">Tablas creadas:</span>
                      <ul className="list-disc pl-5 mt-2">
                        {initStatus.tables.map((table: string) => (
                          <li key={table}>{table}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button onClick={initializeDb} disabled={initLoading} className="w-full">
                {initLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Inicializar Base de Datos
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="query">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ejecutar Consulta SQL</CardTitle>
              <CardDescription>Ejecuta consultas SQL directamente en la base de datos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Escribe tu consulta SQL aquí..."
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={5}
                  className="font-mono"
                />

                <div className="flex justify-end">
                  <Button onClick={executeQuery} disabled={queryLoading || !sqlQuery.trim()}>
                    {queryLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Ejecutando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Ejecutar
                      </>
                    )}
                  </Button>
                </div>

                {queryError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{queryError}</AlertDescription>
                  </Alert>
                )}

                {queryResult && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Resultado:</h3>
                    {Array.isArray(queryResult) && queryResult.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(queryResult[0]).map((key) => (
                                <th
                                  key={key}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {queryResult.map((row: any, i: number) => (
                              <tr key={i}>
                                {Object.values(row).map((value: any, j: number) => (
                                  <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {value === null ? "NULL" : String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : Array.isArray(queryResult) ? (
                      <p>La consulta se ejecutó correctamente pero no devolvió resultados.</p>
                    ) : (
                      <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(queryResult, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
