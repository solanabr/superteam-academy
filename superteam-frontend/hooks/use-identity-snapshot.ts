"use client"

import { useEffect, useState } from "react"
import type { IdentitySnapshot } from "@/lib/identity/types"
import { fetchIdentitySnapshot } from "@/lib/services/identity-read-service"

export function useIdentitySnapshot() {
  const [snapshot, setSnapshot] = useState<IdentitySnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    void (async () => {
      setIsLoading(true)
      const next = await fetchIdentitySnapshot()
      if (!mounted) return
      setSnapshot(next)
      setIsLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  return { snapshot, isLoading }
}
