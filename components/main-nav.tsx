"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  BookOpen,
  ClipboardCheck,
  Building2,
  Award,
  Menu,
  X,
  LogOut,
  User,
  UsersRound,
  ClipboardList,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function MainNav() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout, isAuthenticated, isAdmin, isEvaluador } = useAuth()

  // Si no está autenticado y no está en la página de login, no mostrar la navegación
  if (!isAuthenticated && pathname !== "/login") {
    return null
  }

  // Si está en la página de login, no mostrar la navegación
  if (pathname === "/login") {
    return null
  }

  // Rutas para administradores
  const adminRoutes = [
    {
      href: "/",
      label: "Inicio",
      icon: <Home className="h-5 w-5 mr-2" />,
      active: pathname === "/",
    },
    {
      href: "/alumnos",
      label: "Alumnos",
      icon: <Users className="h-5 w-5 mr-2" />,
      active: pathname === "/alumnos" || pathname.startsWith("/alumnos/"),
    },
    {
      href: "/examenes",
      label: "Exámenes",
      icon: <BookOpen className="h-5 w-5 mr-2" />,
      active: pathname === "/examenes" || pathname.startsWith("/examenes/"),
    },
    {
      href: "/grupos",
      label: "Grupos",
      icon: <UsersRound className="h-5 w-5 mr-2" />,
      active: pathname === "/grupos" || pathname.startsWith("/grupos/"),
    },
    {
      href: "/hospitales",
      label: "Hospitales",
      icon: <Building2 className="h-5 w-5 mr-2" />,
      active: pathname === "/hospitales" || pathname.startsWith("/hospitales/"),
    },
    {
      href: "/evaluadores",
      label: "Evaluadores",
      icon: <Award className="h-5 w-5 mr-2" />,
      active: pathname === "/evaluadores" || pathname.startsWith("/evaluadores/"),
    },
    {
      href: "/asignar-examen",
      label: "Asignar Exámenes",
      icon: <ClipboardList className="h-5 w-5 mr-2" />,
      active: pathname === "/asignar-examen",
    },
  ]

  // Rutas para evaluadores
  const evaluadorRoutes = [
    {
      href: "/",
      label: "Inicio",
      icon: <Home className="h-5 w-5 mr-2" />,
      active: pathname === "/",
    },
    {
      href: "/tomar-examen",
      label: "Tomar Examen",
      icon: <ClipboardCheck className="h-5 w-5 mr-2" />,
      active: pathname === "/tomar-examen" || pathname.startsWith("/tomar-examen/"),
    },
  ]

  // Seleccionar las rutas según el rol
  const routes = isAdmin ? adminRoutes : evaluadorRoutes

  return (
    <nav className="bg-white shadow-md dark:bg-gray-900">
      <div className="w-full mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">ExamenCarrera</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:justify-between md:flex-1 md:ml-10">
            <div className="flex space-x-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-primary/10",
                    route.active ? "text-primary bg-primary/10" : "text-gray-600 hover:text-primary dark:text-gray-300",
                  )}
                >
                  {route.icon}
                  {route.label}
                </Link>
              ))}
            </div>

            {/* User Menu - Desktop (ahora dentro del mismo contenedor) */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuLabel className="font-normal text-sm">{user?.nombre}</DropdownMenuLabel>
                  <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                    {isAdmin ? "Administrador" : "Evaluador"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Mi perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuLabel className="font-normal text-sm">{user?.nombre}</DropdownMenuLabel>
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                  {isAdmin ? "Administrador" : "Evaluador"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Mi perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-base font-medium",
                  route.active
                    ? "text-primary bg-primary/10"
                    : "text-gray-600 hover:text-primary hover:bg-primary/10 dark:text-gray-300",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {route.icon}
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
