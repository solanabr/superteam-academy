"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useLearningProgressService } from "@/services/LearningProgressService"

export function useXpBalance() {
  const service = useLearningProgressService()

  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setMounted(true)

    const enableQuery = () => setReady(true)

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(enableQuery)
    } else {
      setTimeout(enableQuery, 200)
    }
  }, [])

  return useQuery({
    queryKey: ["xp-balance"],
    queryFn: async () => {
      if (!service) throw new Error("Wallet not connected")
      const xp = await service.getUserXPBalance()
      return xp.toNumber()
    },
    enabled: mounted && ready && !!service,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}