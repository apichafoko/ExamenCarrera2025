"use client"

import { Suspense } from "react"
import ExamenDetail from "./examen-detail"
import LoadingExamen from "./loading"
import { useRouter } from "next/navigation"

export default function ExamenDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const examenId = params.id

  return (
    <Suspense fallback={<LoadingExamen />}>
      <ExamenDetail id={examenId} />
    </Suspense>
  )
}
