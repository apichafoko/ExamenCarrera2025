import { evaluadorService, type Respuesta, type ResultadoEstacion } from "./evaluador-service"
import { executeQuery } from "./db"
import { jest, describe, beforeEach, it, expect } from "@jest/globals"

// Mock de executeQuery para pruebas
jest.mock("./db", () => ({
  executeQuery: jest.fn(),
}))

describe("Evaluador Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getExamenesAsignados", () => {
    it("debe obtener exámenes asignados a un evaluador", async () => {
      const mockExamenes = [
        { id: 1, alumno_id: 101, examen_id: 201, evaluador_id: 301, estado: "Pendiente" },
        { id: 2, alumno_id: 102, examen_id: 202, evaluador_id: 301, estado: "En Progreso" },
      ]
      ;(executeQuery as jest.Mock).mockResolvedValue(mockExamenes)

      const result = await evaluadorService.getExamenesAsignados(301)

      expect(executeQuery).toHaveBeenCalledWith(expect.stringContaining("FROM alumnos_examenes"), [301])
      expect(result).toEqual(mockExamenes)
    })

    it("debe filtrar por estado si se proporciona", async () => {
      const mockExamenes = [{ id: 1, alumno_id: 101, examen_id: 201, evaluador_id: 301, estado: "Pendiente" }]
      ;(executeQuery as jest.Mock).mockResolvedValue(mockExamenes)

      const result = await evaluadorService.getExamenesAsignados(301, "Pendiente")

      expect(executeQuery).toHaveBeenCalledWith(expect.stringContaining("AND ae.estado = $2"), [301, "Pendiente"])
      expect(result).toEqual(mockExamenes)
    })
  })

  describe("iniciarExamen", () => {
    it("debe actualizar el estado y la fecha de inicio", async () => {
      const mockExamen = {
        id: 1,
        alumno_id: 101,
        examen_id: 201,
        evaluador_id: 301,
        estado: "En Progreso",
      }
      ;(executeQuery as jest.Mock).mockResolvedValue([mockExamen])

      const result = await evaluadorService.iniciarExamen(1)

      expect(executeQuery).toHaveBeenCalledWith(expect.stringContaining("UPDATE alumnos_examenes"), [1])
      expect(result).toEqual(mockExamen)
    })

    it("debe devolver null si no se encuentra el examen", async () => {
      ;(executeQuery as jest.Mock).mockResolvedValue([])

      const result = await evaluadorService.iniciarExamen(999)

      expect(result).toBeNull()
    })
  })

  describe("guardarRespuesta", () => {
    it("debe crear una nueva respuesta si no existe", async () => {
      const mockRespuesta: Respuesta = {
        alumno_examen_id: 1,
        pregunta_id: 101,
        respuesta: "Respuesta de prueba",
        puntaje: 5,
      }

      const mockPuntajeResult = [{ puntaje: 5 }]
      const mockCheckResult: any[] = []
      const mockInsertResult = [{ ...mockRespuesta, id: 1 }]
      ;(executeQuery as jest.Mock)
        .mockResolvedValueOnce(mockPuntajeResult)
        .mockResolvedValueOnce(mockCheckResult)
        .mockResolvedValueOnce(mockInsertResult)

      const result = await evaluadorService.guardarRespuesta(mockRespuesta)

      expect(executeQuery).toHaveBeenCalledTimes(3)
      expect(result).toEqual(mockInsertResult[0])
    })

    it("debe actualizar una respuesta existente", async () => {
      const mockRespuesta: Respuesta = {
        alumno_examen_id: 1,
        pregunta_id: 101,
        respuesta: "Respuesta actualizada",
        puntaje: 5,
      }

      const mockPuntajeResult = [{ puntaje: 5 }]
      const mockCheckResult = [{ id: 1 }]
      const mockUpdateResult = [{ ...mockRespuesta, id: 1 }]
      ;(executeQuery as jest.Mock)
        .mockResolvedValueOnce(mockPuntajeResult)
        .mockResolvedValueOnce(mockCheckResult)
        .mockResolvedValueOnce(mockUpdateResult)

      const result = await evaluadorService.guardarRespuesta(mockRespuesta)

      expect(executeQuery).toHaveBeenCalledTimes(3)
      expect(result).toEqual(mockUpdateResult[0])
    })
  })

  describe("guardarResultadoEstacion", () => {
    it("debe calcular la calificación si no se proporciona", async () => {
      const mockResultado: ResultadoEstacion = {
        alumno_examen_id: 1,
        estacion_id: 101,
        calificacion: 0,
        observaciones: "Observación de prueba",
      }

      const mockPromedioResult = [{ promedio: 8.5 }]
      const mockCheckResult: any[] = []
      const mockInsertResult = [{ ...mockResultado, id: 1, calificacion: 8.5 }]
      ;(executeQuery as jest.Mock)
        .mockResolvedValueOnce(mockPromedioResult)
        .mockResolvedValueOnce(mockCheckResult)
        .mockResolvedValueOnce(mockInsertResult)

      const result = await evaluadorService.guardarResultadoEstacion({
        ...mockResultado,
        calificacion: undefined as any,
      })

      expect(executeQuery).toHaveBeenCalledTimes(3)
      expect(result?.calificacion).toEqual(8.5)
    })
  })

  describe("getAlumnoExamenById", () => {
    it("debe obtener un examen con todas sus estaciones y preguntas", async () => {
      const mockExamen = {
        id: 1,
        alumno_id: 101,
        examen_id: 201,
        evaluador_id: 301,
        estado: "En Progreso",
      }

      const mockEstaciones = [{ id: 1, examen_id: 201, titulo: "Estación 1", orden: 1 }]

      const mockPreguntas = [{ id: 1, estacion_id: 1, texto: "Pregunta 1", tipo: "texto_libre", orden: 1 }]

      const mockOpciones: any[] = []
      const mockRespuestas = [{ id: 1, alumno_examen_id: 1, pregunta_id: 1, respuesta: "Respuesta 1", puntaje: 5 }]

      const mockResultados: any[] = []
      ;(executeQuery as jest.Mock)
        .mockResolvedValueOnce([mockExamen])
        .mockResolvedValueOnce(mockEstaciones)
        .mockResolvedValueOnce(mockPreguntas)
        .mockResolvedValueOnce(mockOpciones)
        .mockResolvedValueOnce(mockRespuestas)
        .mockResolvedValueOnce(mockResultados)

      const result = await evaluadorService.getAlumnoExamenById(1)

      expect(executeQuery).toHaveBeenCalledTimes(6)
      expect(result).toHaveProperty("estaciones")
      expect(result?.estaciones[0]).toHaveProperty("preguntas")
      expect(result?.estaciones[0].preguntas[0]).toHaveProperty("respuesta", "Respuesta 1")
    })
  })
})
