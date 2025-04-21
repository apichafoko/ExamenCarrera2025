"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Building2,
  Award,
  ArrowRight,
  FileSpreadsheet,
  BadgeIcon as IdCard,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"

export default function Home() {
  const { isAdmin, isEvaluador, isColaborador, user } = useAuth()

  // Características para administradores
  const adminFeatures = [
    {
      icon: <BookOpen className="h-12 w-12 text-primary" />,
      title: "Gestión de Exámenes",
      description: "Crea y administra exámenes con múltiples estaciones y preguntas personalizadas.",
      href: "/examenes",
    },
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: "Administración de Alumnos",
      description: "Gestiona la información de los alumnos y su progreso académico.",
      href: "/alumnos",
    },
    {
      icon: <Building2 className="h-12 w-12 text-primary" />,
      title: "Gestión de Hospitales",
      description: "Administra los hospitales asociados y sus características.",
      href: "/hospitales",
    },
    {
      icon: <Award className="h-12 w-12 text-primary" />,
      title: "Evaluadores",
      description: "Gestiona el equipo de evaluadores y sus asignaciones.",
      href: "/evaluadores",
    },
    {
      icon: <FileSpreadsheet className="h-12 w-12 text-primary" />,
      title: "Asignación de Exámenes",
      description: "Asigna exámenes a alumnos y gestiona las fechas de aplicación.",
      href: "/asignar-examen",
    },
    {
      icon: <IdCard className="h-12 w-12 text-primary" />,
      title: "Asignación de Identificación",
      description: "Asigna números de identificación a los alumnos para mantener el anonimato en las evaluaciones.",
      href: "/asignacion-identificacion",
    },
  ]

  // Características para evaluadores
  const evaluadorFeatures = [
    {
      icon: <ClipboardCheck className="h-12 w-12 text-primary" />,
      title: "Estaciones asignadas",
      description: "Evalúa a los alumnos de manera anónima y objetiva.",
      href: "/tomar-examen",
    },
    /*{
      icon: <ClipboardCheck className="h-12 w-12 text-primary" />,
      title: "Examenes Completados",
      description: "Controla los resultados de los examenes completados.",
      href: "/examenes-completados",
    },*/
  ]

  // Características para colaboradores
  const colaboradorFeatures = [
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: "Asignar Identificación",
      description: "Asigná números de identificación a los alumnos para que puedan ser evaluados correctamente.",
      href: "/asignacion-identificacion",
    },
  ]

  // Seleccionar las características según el rol
  const features = isAdmin ? adminFeatures : isColaborador ? colaboradorFeatures : evaluadorFeatures

  return (
    <div className="space-y-10 pb-10">
      <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 to-secondary/20 rounded-3xl">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Examen Clínico Estructurado y Objetivo (ECEO) 2025
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                {isAdmin
                  ? "Gestiona exámenes, alumnos y evaluaciones de manera eficiente y moderna."
                  : isColaborador
                    ? "Asigna identificaciones a los alumnos y colabora con la organización de los exámenes."
                    : `Bienvenido, ${user?.nombre}. Accede a las estaciones asignadas para evaluación.`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {isAdmin ? (
                <Button asChild size="lg">
                  <Link href="/examenes">
                    Gestionar Exámenes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : isColaborador ? (
                <Button asChild size="lg">
                  <Link href="/asignacion-identificacion">
                    Asignar Identificación
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/tomar-examen">
                    Ir a Estaciones Asignadas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 md:px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">
            {isAdmin ? "Características Principales" : "Funcionalidades Disponibles"}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-[700px] mx-auto">
            {isAdmin
              ? "Nuestro sistema ofrece todas las herramientas necesarias para la gestión académica completa."
              : "Accede a las herramientas de evaluación para calificar a los alumnos de manera objetiva."}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover-scale">
              <CardHeader className="flex flex-col items-center text-center space-y-2">
                {feature.icon}
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
              <CardFooter className="flex justify-center pt-0">
                <Button asChild variant="ghost">
                  <Link href={feature.href}>
                    Acceder
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
