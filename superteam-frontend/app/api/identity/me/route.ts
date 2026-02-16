import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/server/auth-adapter"
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter"

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ authenticated: false, snapshot: null }, { status: 200 })
  }

  const snapshot = await getIdentitySnapshotForUser(user)
  return NextResponse.json(
    {
      authenticated: true,
      snapshot,
    },
    { status: 200 },
  )
}
