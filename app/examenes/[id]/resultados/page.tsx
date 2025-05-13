

/**
 * Página de resultados de un examen específico.
 *
 * Esta página muestra los resultados detallados de un examen, incluyendo estadísticas generales,
 * resultados individuales por alumno y un desglose por estaciones del examen.
 *
 * ## Comportamiento principal:
 * - Obtiene el ID del examen desde los parámetros de la URL (`params.id`).
 * - Busca los resultados del examen en el contexto global (`useAppContext`).
 * - Si no se encuentran resultados para el ID proporcionado, redirige al usuario a la lista de exámenes (`/examenes`).
 * - Muestra un estado de carga mientras se obtienen los datos.
 *
 * ## Secciones principales:
 * 1. **Encabezado de la página**:
 *    - Botón para regresar a la página del examen.
 *    - Título del examen y fecha.
 *    - Botón para exportar los resultados.
 *
 * 2. **Estadísticas generales**:
 *    - Número de alumnos evaluados.
 *    - Calificación promedio de los alumnos completados.
 *    - Número de evaluaciones pendientes.
 *
 * 3. **Tabla de resultados por alumno**:
 *    - Muestra el nombre del alumno, estado de la evaluación, calificación, evaluador asignado y un botón para ver detalles.
 *    - Las calificaciones se colorean según el rango (verde, azul, amarillo, rojo).
 *    - Si el estado del alumno es "Pendiente", el botón de detalles está deshabilitado.
 *
 * 4. **Pestañas de estadísticas**:
 *    - **Estadísticas Generales**:
 *      - Placeholder para un gráfico de distribución de calificaciones.
 *    - **Resultados por Estación**:
 *      - Tabla con el rendimiento promedio, calificación más alta y más baja por estación del examen.
 *
 * ## Dependencias:
 * - `useRouter`: Para manejar la navegación entre páginas.
 * - `useAppContext`: Para acceder a los resultados almacenados en el contexto global.
 * - Componentes de UI como `Button`, `Card`, `Table`, `Tabs`, etc., para estructurar y estilizar la página.
 *
 * ## Props:
 * @param params.id - ID del examen obtenido desde la URL.
 *
 * ## Notas:
 * - Asegúrate de que el contexto global (`useAppContext`) contenga los resultados del examen en el formato esperado.
 * - Si se agregan nuevas estaciones o métricas, actualiza las tablas y estadísticas correspondientes.
 */
"use client"


import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Calendar, User, Award, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { useAppContext } from "@/context/app-context"

export default function ResultadosExamenPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { resultados } = useAppContext()
  const id = Number.parseInt(params.id)
  const [resultadosExamen, setResultadosExamen] = useState<any>(null)

  // Este useEffect se ejecutará cada vez que cambie el array de resultados en el contexto
  useEffect(() => {
    // Buscar los resultados por ID de examen
    const resultadosEncontrados = Array.isArray(resultados) ? resultados.find((r: any) => r && r.id === id) : undefined

    if (resultadosEncontrados) {
      setResultadosExamen(resultadosEncontrados)
    } else {
      // Si no se encuentra, redirigir a la lista
      router.push("/examenes")
    }
  }, [id, router, resultados]) // Añadimos resultados como dependencia para que se actualice cuando cambie

  if (!resultadosExamen) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Cargando resultados del examen...</p>
      </div>
    )
  }

  const alumnosCompletados = resultadosExamen.alumnos.filter((a: any) => a.estado === "Completado")
  const promedioGeneral =
    alumnosCompletados.length > 0
      ? alumnosCompletados.reduce((sum: number, a: any) => sum + (a.calificacion || 0), 0) / alumnosCompletados.length
      : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/examenes/${id}`)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resultados del Examen</h1>
            <p className="text-muted-foreground flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              {resultadosExamen.nombre} - {new Date(resultadosExamen.fecha).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Resultados
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{alumnosCompletados.length}</CardTitle>
            <CardDescription>Alumnos evaluados</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{promedioGeneral.toFixed(1)}</CardTitle>
            <CardDescription>Calificación promedio</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{resultadosExamen.alumnos.length - alumnosCompletados.length}</CardTitle>
            <CardDescription>Evaluaciones pendientes</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultados por Alumno</CardTitle>
          <CardDescription>Detalle de las calificaciones de cada alumno.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Alumno
                  </div>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <Award className="mr-2 h-4 w-4" />
                    Calificación
                  </div>
                </TableHead>
                <TableHead>Evaluador</TableHead>
                <TableHead className="text-right">Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultadosExamen.alumnos.map((alumno: any) => (
                <TableRow key={alumno.id}>
                  <TableCell className="font-medium">{alumno.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={alumno.estado === "Completado" ? "default" : "outline"}>{alumno.estado}</Badge>
                  </TableCell>
                  <TableCell>
                    {alumno.calificacion !== null ? (
                      <span
                        className={`font-semibold ${
                          alumno.calificacion >= 90
                            ? "text-green-600"
                            : alumno.calificacion >= 80
                              ? "text-blue-600"
                              : alumno.calificacion >= 70
                                ? "text-yellow-600"
                                : "text-red-600"
                        }`}
                      >
                        {alumno.calificacion}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Pendiente</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {alumno.evaluador || <span className="text-muted-foreground">No asignado</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {alumno.estado === "Completado" ? (
                      <Button variant="ghost" size="sm" className="flex items-center" onClick={() => {}}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver detalle
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled>
                        Pendiente
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Estadísticas Generales</TabsTrigger>
          <TabsTrigger value="estaciones">Resultados por Estación</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Calificaciones</CardTitle>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico de distribución de calificaciones</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="estaciones" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Estación</CardTitle>
              <CardDescription>Calificaciones promedio por cada estación del examen.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estación</TableHead>
                    <TableHead>Calificación Promedio</TableHead>
                    <TableHead>Calificación Más Alta</TableHead>
                    <TableHead>Calificación Más Baja</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Estación 1: Diagnóstico de Infarto</TableCell>
                    <TableCell>92.5</TableCell>
                    <TableCell>95</TableCell>
                    <TableCell>90</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Estación 2: Interpretación de ECG</TableCell>
                    <TableCell>85.0</TableCell>
                    <TableCell>90</TableCell>
                    <TableCell>80</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
