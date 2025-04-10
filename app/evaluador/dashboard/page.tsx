"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Loader2, ClipboardList, CheckCircle, Clock, Calendar, User, FileText } from "lucide-react"

export default function EvaluadorDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>({
    totalExamenes: 0,
    pendientes: 0,
    enProgreso: 0,
    completados: 0,
    examenesRecientes: [],
    distribucionCalificaciones: [],
    promedioCalificacion: 0,
    examenesCompletadosPorDia: [],
  })

  useEffect(() => {
    if (!user) {
      return
    }

    const cargarEstadisticas = async () => {
      setIsLoading(true)
      try {
        // Simulamos la carga de estadísticas
        // En una implementación real, esto vendría de una API
        setTimeout(() => {
          const mockStats = {
            totalExamenes: 24,
            pendientes: 8,
            enProgreso: 5,
            completados: 11,
            promedioCalificacion: 7.8,
            examenesRecientes: [
              {
                id: 1,
                alumno_nombre: "Juan Pérez",
                examen_titulo: "Examen Clínico 1",
                estado: "Completado",
                fecha: "2023-05-15",
                calificacion: 8.5,
              },
              {
                id: 2,
                alumno_nombre: "María López",
                examen_titulo: "Examen Práctico 2",
                estado: "En Progreso",
                fecha: "2023-05-14",
              },
              {
                id: 3,
                alumno_nombre: "Carlos Gómez",
                examen_titulo: "Evaluación Final",
                estado: "Pendiente",
                fecha: "2023-05-20",
              },
              {
                id: 4,
                alumno_nombre: "Ana Martínez",
                examen_titulo: "Examen Clínico 2",
                estado: "Completado",
                fecha: "2023-05-12",
                calificacion: 9.2,
              },
              {
                id: 5,
                alumno_nombre: "Roberto Sánchez",
                examen_titulo: "Examen Práctico 1",
                estado: "Completado",
                fecha: "2023-05-10",
                calificacion: 7.5,
              },
            ],
            distribucionCalificaciones: [
              { name: "0-4", value: 1 },
              { name: "4-6", value: 2 },
              { name: "6-8", value: 4 },
              { name: "8-10", value: 4 },
            ],
            examenesCompletadosPorDia: [
              { name: "10/05", value: 2 },
              { name: "11/05", value: 1 },
              { name: "12/05", value: 3 },
              { name: "13/05", value: 0 },
              { name: "14/05", value: 2 },
              { name: "15/05", value: 3 },
            ],
          }

          setStats(mockStats)
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error al cargar estadísticas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las estadísticas",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    cargarEstadisticas()
  }, [user, toast])

  const handleVerExamenes = () => {
    router.push("/evaluador")
  }

  const handleVerExamen = (id: number) => {
    router.push(`/evaluador/editar-examen/${id}`)
  }

  const COLORS = ["#FF8042", "#FFBB28", "#00C49F", "#0088FE"]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Evaluador</h1>
        <Button onClick={handleVerExamenes}>Ver todos los exámenes</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Exámenes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExamenes}</div>
            <p className="text-xs text-muted-foreground">Exámenes asignados a tu cuenta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
            <Progress value={(stats.pendientes / stats.totalExamenes) * 100} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enProgreso}</div>
            <Progress value={(stats.enProgreso / stats.totalExamenes) * 100} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completados}</div>
            <Progress value={(stats.completados / stats.totalExamenes) * 100} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recientes">Exámenes Recientes</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
        </TabsList>
        <TabsContent value="recientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exámenes Recientes</CardTitle>
              <CardDescription>Los últimos exámenes asignados a tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.examenesRecientes.map((examen) => (
                  <div
                    key={examen.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => handleVerExamen(examen.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="font-medium">{examen.examen_titulo}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="mr-1 h-3 w-3" />
                        {examen.alumno_nombre}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {examen.fecha}
                      </div>
                      <Badge
                        variant={
                          examen.estado === "Completado"
                            ? "default"
                            : examen.estado === "En Progreso"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {examen.estado}
                      </Badge>
                      {examen.calificacion && <Badge variant="outline">{examen.calificacion}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="estadisticas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Calificaciones</CardTitle>
                <CardDescription>Distribución de calificaciones en exámenes completados</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.distribucionCalificaciones}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.distribucionCalificaciones.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Exámenes Completados por Día</CardTitle>
                <CardDescription>Número de exámenes completados en los últimos días</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.examenesCompletadosPorDia}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Promedio de Calificaciones</CardTitle>
              <CardDescription>Calificación promedio de los exámenes completados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-5xl font-bold">{stats.promedioCalificacion.toFixed(1)}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Basado en {stats.completados} exámenes completados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
