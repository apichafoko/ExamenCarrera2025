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
