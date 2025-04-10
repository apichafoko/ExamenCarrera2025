import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function LoadingExamen() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <h1 className="text-3xl font-bold">Cargando examen...</h1>
      </div>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    </div>
  )
}
