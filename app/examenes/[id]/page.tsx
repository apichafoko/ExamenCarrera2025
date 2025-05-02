"use client"

import { Suspense, use } from "react"
import ExamenDetail from "./examen-detail"
import LoadingExamen from "./loading"
import { useRouter } from "next/navigation"

export default function ExamenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params) // Unwrap the params Promise
  const examenId = resolvedParams.id

  return (
    <Suspense fallback={<LoadingExamen />}>
      <ExamenDetail id={examenId} />
    </Suspense>
  )
}