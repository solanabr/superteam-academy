import type { IdentitySnapshot } from "@/lib/identity/types"

type IdentityApiResponse = {
  authenticated: boolean
  snapshot: IdentitySnapshot | null
}

export async function fetchIdentitySnapshot(): Promise<IdentitySnapshot | null> {
  const response = await fetch("/api/identity/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })
  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as IdentityApiResponse
  if (!payload.authenticated || !payload.snapshot) {
    return null
  }
  return payload.snapshot
}
