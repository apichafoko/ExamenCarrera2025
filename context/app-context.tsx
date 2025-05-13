
/**
 * @file app-context.tsx
 * 
 * Este archivo define un contexto global para la aplicación utilizando React Context API.
 * Proporciona un conjunto de datos y funciones relacionadas con la gestión de alumnos, hospitales,
 * evaluadores, exámenes y grupos. Este contexto permite que los componentes hijos accedan y manipulen
 * estos datos de manera centralizada.
 * 
 * @module AppContext
 * 
 * @example
 * // Ejemplo de uso del contexto en un componente
 * import { useAppContext } from "@/context/app-context";
 * 
 * const MiComponente = () => {
 *   const { alumnos, agregarAlumno } = useAppContext();
 * 
 *   const handleAgregarAlumno = async () => {
 *     await agregarAlumno({ nombre: "Nuevo Alumno", edad: 20 });
 *   };
 * 
 *   return (
 *     <div>
 *       <h1>Lista de Alumnos</h1>
 *       <ul>
 *         {alumnos.map((alumno) => (
 *           <li key={alumno.id}>{alumno.nombre}</li>
 *         ))}
 *       </ul>
 *       <button onClick={handleAgregarAlumno}>Agregar Alumno</button>
 *     </div>
 *   );
 * };
 */

/**
 * Tipo de datos para el contexto de la aplicación.
 * Contiene los datos principales (alumnos, hospitales, evaluadores, exámenes, grupos)
 * y las funciones para manipularlos (actualizar, agregar, eliminar, asignar, refrescar).
 * 
 * @typedef {Object} AppContextType
 * @property {Alumno[]} alumnos - Lista de alumnos.
 * @property {Hospital[]} hospitales - Lista de hospitales.
 * @property {Evaluador[]} evaluadores - Lista de evaluadores.
 * @property {Examen[]} examenes - Lista de exámenes.
 * @property {Grupo[]} grupos - Lista de grupos.
 * @property {boolean} isLoading - Indica si los datos están cargando.
 * @property {Function} actualizarAlumno - Actualiza un alumno existente.
 * @property {Function} actualizarHospital - Actualiza un hospital existente.
 * @property {Function} actualizarEvaluador - Actualiza un evaluador existente.
 * @property {Function} actualizarExamen - Actualiza un examen existente.
 * @property {Function} actualizarGrupo - Actualiza un grupo existente.
 * @property {Function} agregarAlumno - Agrega un nuevo alumno.
 * @property {Function} agregarHospital - Agrega un nuevo hospital.
 * @property {Function} agregarEvaluador - Agrega un nuevo evaluador.
 * @property {Function} agregarExamen - Agrega un nuevo examen.
 * @property {Function} agregarGrupo - Agrega un nuevo grupo.
 * @property {Function} eliminarAlumno - Elimina un alumno por ID.
 * @property {Function} eliminarHospital - Elimina un hospital por ID.
 * @property {Function} eliminarEvaluador - Elimina un evaluador por ID.
 * @property {Function} eliminarExamen - Elimina un examen por ID.
 * @property {Function} eliminarGrupo - Elimina un grupo por ID.
 * @property {Function} asignarExamenAlumno - Asigna un examen a un alumno con un evaluador.
 * @property {Function} asignarAlumnoGrupo - Asigna un alumno a un grupo.
 * @property {Function} refrescarDatos - Refresca todos los datos desde el servidor.
 */

/**
 * Hook personalizado para acceder al contexto de la aplicación.
 * Lanza un error si se usa fuera de un `AppProvider`.
 * 
 * @function useAppContext
 * @returns {AppContextType} El contexto de la aplicación.
 * @throws {Error} Si se usa fuera de un `AppProvider`.
 */

/**
 * Proveedor del contexto de la aplicación.
 * Envuelve a los componentes hijos y proporciona acceso al contexto.
 * 
 * @function AppProvider
 * @param {Object} props - Propiedades del componente.
 * @param {ReactNode} props.children - Componentes hijos que tendrán acceso al contexto.
 * @returns {JSX.Element} El proveedor del contexto.
 * 
 * @example
 * // Uso del AppProvider en la raíz de la aplicación
 * import { AppProvider } from "@/context/app-context";
 * 
 * const App = () => (
 *   <AppProvider>
 *     <MiComponente />
 *   </AppProvider>
 * );
 */
"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import {
  alumnosService,
  hospitalesService,
  evaluadoresService,
  examenesService,
  gruposService,
  type Alumno,
  type Hospital,
  type Evaluador,
  type Examen,
  type Grupo,
} from "@/lib/db-service"

// Tipo para el contexto
type AppContextType = {
  alumnos: Alumno[]
  hospitales: Hospital[]
  evaluadores: Evaluador[]
  examenes: Examen[]
  grupos: Grupo[]
  isLoading: boolean
  actualizarAlumno: (alumno: Alumno) => Promise<void>
  actualizarHospital: (hospital: Hospital) => Promise<void>
  actualizarEvaluador: (evaluador: Evaluador) => Promise<void>
  actualizarExamen: (examen: Examen) => Promise<void>
  actualizarGrupo: (grupo: Grupo) => Promise<void>
  agregarAlumno: (alumno: Omit<Alumno, "id">) => Promise<void>
  agregarHospital: (hospital: Omit<Hospital, "id">) => Promise<void>
  agregarEvaluador: (evaluador: Omit<Evaluador, "id">) => Promise<void>
  agregarExamen: (examen: Omit<Examen, "id">) => Promise<void>
  agregarGrupo: (grupo: Omit<Grupo, "id">) => Promise<void>
  eliminarAlumno: (id: number) => Promise<void>
  eliminarHospital: (id: number) => Promise<void>
  eliminarEvaluador: (id: number) => Promise<void>
  eliminarExamen: (id: number) => Promise<void>
  eliminarGrupo: (id: number) => Promise<void>
  asignarExamenAlumno: (examenId: number, alumnoId: number, evaluadorId: number) => Promise<void>
  asignarAlumnoGrupo: (grupoId: number, alumnoId: number) => Promise<void>
  refrescarDatos: () => Promise<void>
}

// Crear el contexto
const AppContext = createContext<AppContextType | undefined>(undefined)

// Hook personalizado para usar el contexto
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext debe ser usado dentro de un AppProvider")
  }
  return context
}

// Proveedor del contexto
export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Estado para nuestros datos
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [hospitales, setHospitales] = useState<Hospital[]>([])
  const [evaluadores, setEvaluadores] = useState<Evaluador[]>([])
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Función para refrescar todos los datos
  const refrescarDatos = async () => {
    setIsLoading(true)
    try {
      const [alumnosData, hospitalesData, evaluadoresData, examenesData, gruposData] = await Promise.all([
        alumnosService.getAll(),
        hospitalesService.getAll(),
        evaluadoresService.getAll(),
        examenesService.getAll(),
        gruposService.getAll(),
      ])

      setAlumnos(alumnosData)
      setHospitales(hospitalesData)
      setEvaluadores(evaluadoresData)
      setExamenes(examenesData)
      setGrupos(gruposData)
    } catch (error) {
      console.error("Error refrescando datos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Funciones para actualizar datos
  const actualizarAlumno = async (alumnoActualizado: Alumno) => {
    try {
      const resultado = await alumnosService.update(alumnoActualizado.id, alumnoActualizado)
      if (resultado) {
        setAlumnos(alumnos.map((alumno) => (alumno.id === alumnoActualizado.id ? resultado : alumno)))
      }
    } catch (error) {
      console.error("Error actualizando alumno:", error)
      throw error
    }
  }

  const actualizarHospital = async (hospitalActualizado: Hospital) => {
    try {
      const resultado = await hospitalesService.update(hospitalActualizado.id, hospitalActualizado)
      if (resultado) {
        setHospitales(hospitales.map((hospital) => (hospital.id === hospitalActualizado.id ? resultado : hospital)))
      }
    } catch (error) {
      console.error("Error actualizando hospital:", error)
      throw error
    }
  }

  const actualizarEvaluador = async (evaluadorActualizado: Evaluador) => {
    try {
      const resultado = await evaluadoresService.update(evaluadorActualizado.id, evaluadorActualizado)
      if (resultado) {
        setEvaluadores(
          evaluadores.map((evaluador) => (evaluador.id === evaluadorActualizado.id ? resultado : evaluador)),
        )
      }
    } catch (error) {
      console.error("Error actualizando evaluador:", error)
      throw error
    }
  }

  const actualizarExamen = async (examenActualizado: Examen) => {
    try {
      const resultado = await examenesService.update(examenActualizado.id, examenActualizado)
      if (resultado) {
        setExamenes(examenes.map((examen) => (examen.id === examenActualizado.id ? resultado : examen)))
      }
    } catch (error) {
      console.error("Error actualizando examen:", error)
      throw error
    }
  }

  const actualizarGrupo = async (grupoActualizado: Grupo) => {
    try {
      const resultado = await gruposService.update(grupoActualizado.id, grupoActualizado)
      if (resultado) {
        setGrupos(grupos.map((grupo) => (grupo.id === grupoActualizado.id ? resultado : grupo)))
      }
    } catch (error) {
      console.error("Error actualizando grupo:", error)
      throw error
    }
  }

  // Funciones para agregar datos
  const agregarAlumno = async (nuevoAlumno: Omit<Alumno, "id">) => {
    try {
      const resultado = await alumnosService.create(nuevoAlumno)
      if (resultado) {
        setAlumnos([...alumnos, resultado])
      }
    } catch (error) {
      console.error("Error agregando alumno:", error)
      throw error
    }
  }

  const agregarHospital = async (nuevoHospital: Omit<Hospital, "id">) => {
    try {
      const resultado = await hospitalesService.create(nuevoHospital)
      if (resultado) {
        setHospitales([...hospitales, resultado])
      }
    } catch (error) {
      console.error("Error agregando hospital:", error)
      throw error
    }
  }

  const agregarEvaluador = async (nuevoEvaluador: Omit<Evaluador, "id">) => {
    try {
      console.log("Iniciando agregarEvaluador en contexto:", JSON.stringify(nuevoEvaluador, null, 2))
      const resultado = await evaluadoresService.create(nuevoEvaluador)
      if (resultado) {
        setEvaluadores([...evaluadores, resultado])
        return resultado
      } else {
        throw new Error("No se pudo crear el evaluador - resultado nulo")
      }
    } catch (error) {
      console.error("Error agregando evaluador en contexto:", error)
      throw error
    }
  }

  const agregarExamen = async (nuevoExamen: Omit<Examen, "id">) => {
    try {
      const resultado = await examenesService.create(nuevoExamen)
      if (resultado) {
        setExamenes([...examenes, resultado])
      }
    } catch (error) {
      console.error("Error agregando examen:", error)
      throw error
    }
  }

  const agregarGrupo = async (nuevoGrupo: Omit<Grupo, "id">) => {
    try {
      const resultado = await gruposService.create(nuevoGrupo)
      if (resultado) {
        setGrupos([...grupos, resultado])
      }
    } catch (error) {
      console.error("Error agregando grupo:", error)
      throw error
    }
  }

  // Funciones para eliminar datos
  const eliminarAlumno = async (id: number) => {
    try {
      const resultado = await alumnosService.delete(id)
      if (resultado) {
        setAlumnos(alumnos.filter((alumno) => alumno.id !== id))
      }
    } catch (error) {
      console.error("Error eliminando alumno:", error)
      throw error
    }
  }

  const eliminarHospital = async (id: number) => {
    try {
      const resultado = await hospitalesService.delete(id)
      if (resultado) {
        setHospitales(hospitales.filter((hospital) => hospital.id !== id))
      }
    } catch (error) {
      console.error("Error eliminando hospital:", error)
      throw error
    }
  }

  const eliminarEvaluador = async (id: number) => {
    try {
      const resultado = await evaluadoresService.delete(id)
      if (resultado) {
        setEvaluadores(evaluadores.filter((evaluador) => evaluador.id !== id))
      }
    } catch (error) {
      console.error("Error eliminando evaluador:", error)
      throw error
    }
  }

  const eliminarExamen = async (id: number) => {
    try {
      const resultado = await examenesService.delete(id)
      if (resultado) {
        setExamenes(examenes.filter((examen) => examen.id !== id))
      }
    } catch (error) {
      console.error("Error eliminando examen:", error)
      throw error
    }
  }

  const eliminarGrupo = async (id: number) => {
    try {
      const resultado = await gruposService.delete(id)
      if (resultado) {
        setGrupos(grupos.filter((grupo) => grupo.id !== id))
      }
    } catch (error) {
      console.error("Error eliminando grupo:", error)
      throw error
    }
  }

  // Funciones para asignaciones
  const asignarExamenAlumno = async (examenId: number, alumnoId: number, evaluadorId: number) => {
    try {
      await import("@/lib/db-service").then(({ alumnosExamenesService }) => {
        alumnosExamenesService.asignarExamen(alumnoId, examenId, evaluadorId)
      })
      await refrescarDatos()
    } catch (error) {
      console.error("Error asignando examen a alumno:", error)
      throw error
    }
  }

  const asignarAlumnoGrupo = async (grupoId: number, alumnoId: number) => {
    try {
      await import("@/lib/db-service").then(({ gruposService }) => {
        gruposService.asignarAlumno(grupoId, alumnoId)
      })
      await refrescarDatos()
    } catch (error) {
      console.error("Error asignando alumno a grupo:", error)
      throw error
    }
  }

  // Objeto value con todas las funciones y datos
  const value = {
    alumnos,
    hospitales,
    evaluadores,
    examenes,
    grupos,
    isLoading,
    actualizarAlumno,
    actualizarHospital,
    actualizarEvaluador,
    actualizarExamen,
    actualizarGrupo,
    agregarAlumno,
    agregarHospital,
    agregarEvaluador,
    agregarExamen,
    agregarGrupo,
    eliminarAlumno,
    eliminarHospital,
    eliminarEvaluador,
    eliminarExamen,
    eliminarGrupo,
    asignarExamenAlumno,
    asignarAlumnoGrupo,
    refrescarDatos,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
