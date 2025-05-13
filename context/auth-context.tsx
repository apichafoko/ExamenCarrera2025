/**
 * Este archivo define un contexto de autenticación para una aplicación React utilizando TypeScript.
 * Proporciona un `AuthProvider` que gestiona el estado de autenticación del usuario y expone
 * funciones y propiedades relacionadas con la autenticación a través de un contexto.
 *
 * ### Funcionalidad principal:
 * - **Autenticación del usuario:** Permite iniciar sesión (`login`) y cerrar sesión (`logout`).
 * - **Gestión del estado del usuario:** Almacena información del usuario autenticado, como su rol
 *   (admin, evaluador o colaborador) y si está autenticado.
 * - **Persistencia del usuario:** Carga y guarda la información del usuario en `localStorage` para
 *   mantener la sesión activa entre recargas de la página.
 * - **Redirección:** Redirige al usuario a la página de inicio de sesión al cerrar sesión.
 *
 * ### Tipos definidos:
 * - `User`: Representa la estructura de un usuario autenticado, incluyendo su ID, nombre, email,
 *   rol y un identificador opcional de evaluador.
 * - `AuthContextType`: Define las propiedades y funciones expuestas por el contexto de autenticación.
 *
 * ### Componentes principales:
 * - **`AuthProvider`:** Componente que envuelve la aplicación y proporciona el contexto de autenticación.
 *   - Gestiona el estado del usuario, roles y autenticación.
 *   - Proporciona funciones para iniciar y cerrar sesión.
 *   - Carga el usuario desde `localStorage` al inicializarse.
 * - **`useAuth`:** Hook personalizado que permite acceder al contexto de autenticación.
 *   - Lanza un error si se utiliza fuera de un `AuthProvider`.
 *
 * ### Estados manejados:
 * - `user`: Información del usuario autenticado o `null` si no hay sesión activa.
 * - `isAuthenticated`: Indica si el usuario está autenticado.
 * - `isAdmin`: Indica si el usuario tiene rol de administrador.
 * - `isEvaluador`: Indica si el usuario tiene rol de evaluador.
 * - `isColaborador`: Indica si el usuario tiene rol de colaborador.
 * - `loading`: Indica si hay una operación de autenticación en curso.
 *
 * ### Funciones principales:
 * - **`login(email, password): Promise<boolean>`**
 *   - Realiza una solicitud a la API para autenticar al usuario.
 *   - Si la autenticación es exitosa, actualiza el estado del usuario y roles, y guarda la información
 *     en `localStorage`.
 *   - Retorna `true` si el inicio de sesión fue exitoso, `false` en caso contrario.
 * - **`logout(): void`**
 *   - Limpia el estado del usuario y roles.
 *   - Elimina la información del usuario de `localStorage`.
 *   - Redirige al usuario a la página de inicio de sesión.
 *
 * ### Uso:
 * 1. Envuelve tu aplicación con el `AuthProvider` en el nivel superior (por ejemplo, en `_app.tsx`).
 * 2. Utiliza el hook `useAuth` en cualquier componente para acceder al contexto de autenticación.
 *
 * ### Ejemplo:
 * ```tsx
 * import { useAuth } from "@/context/auth-context";
 *
 * const MiComponente = () => {
 *   const { user, login, logout, isAuthenticated } = useAuth();
 *
 *   return (
 *     <div>
 *       {isAuthenticated ? (
 *         <p>Bienvenido, {user?.nombre}</p>
 *       ) : (
 *         <button onClick={() => login("email@example.com", "password123")}>
 *           Iniciar sesión
 *         </button>
 *       )}
 *       {isAuthenticated && <button onClick={logout}>Cerrar sesión</button>}
 *     </div>
 *   );
 * };
 * ```
 */
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: number
  nombre: string
  email: string
  role: string
  evaluador_id?: number | null
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isEvaluador: boolean
  isColaborador: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEvaluador, setIsEvaluador] = useState(false)
  const [isColaborador, setIsColaborador] = useState(false)
  const router = useRouter()

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        return false
      }

      const userData = await response.json()

      // Actualizar el estado
      setUser(userData)
      setIsAuthenticated(true)
      setIsAdmin(userData.role === "admin")
      setIsEvaluador(userData.role === "evaluador")
      setIsColaborador(userData.role === "colaborador")

      localStorage.setItem("user", JSON.stringify(userData))
      return true
    } catch (error) {
      console.error("Error en login:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
    setIsAuthenticated(false)
    setIsAdmin(false)
    setIsEvaluador(false)
    setIsColaborador(false)
  }

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    isEvaluador,
    isColaborador,
    login,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
