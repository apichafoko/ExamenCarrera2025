"use client"

import { useState, useCallback } from "react"

export function useForceUpdate() {
  const [, setTick] = useState(0)

  const forceUpdate = useCallback(() => {
    setTick((tick) => tick + 1)
  }, [])

  return forceUpdate
}
