import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/drizzle/db"
import { VerificationTokenTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { PublicKey } from "@solana/web3.js"

const bodySchema = z.object({
  walletAddress: z.string().min(32).max(44),
  purpose: z.enum(["signin", "link"]).optional(),
})

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
  }

  // Validate it's actually a valid Solana public key
  try {
    new PublicKey(parsed.data.walletAddress)
  } catch {
    return NextResponse.json({ error: "Invalid public key" }, { status: 400 })
  }

  const walletAddress = parsed.data.walletAddress
  const purpose = parsed.data.purpose ?? "signin"
  const nonce = crypto.randomUUID()
  const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  const identifier =
    purpose === "link"
      ? `wallet-link-nonce:${walletAddress}`
      : `wallet-nonce:${walletAddress}`

  // Replace any existing nonce for this wallet
  await db
    .delete(VerificationTokenTable)
    .where(eq(VerificationTokenTable.identifier, identifier))

  await db.insert(VerificationTokenTable).values({ identifier, token: nonce, expires })

  return NextResponse.json({ nonce, purpose })
}
