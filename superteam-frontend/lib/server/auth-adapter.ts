import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getWalletSessionCookieName, verifyAccessToken } from "@/lib/server/wallet-auth"

export type AuthenticatedUser = {
  id: string
  walletAddress: string
  username: string
}

function buildUsername(walletAddress: string): string {
  return `user_${walletAddress.slice(0, 6).toLowerCase()}`
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(getWalletSessionCookieName())?.value
  const payload = await verifyAccessToken(token)
  if (!payload) return null

  return {
    id: payload.sub,
    walletAddress: payload.walletAddress,
    username: buildUsername(payload.walletAddress),
  }
}

export async function requireAuthenticatedUser(redirectTo = "/"): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(redirectTo)
  }
  return user
}
