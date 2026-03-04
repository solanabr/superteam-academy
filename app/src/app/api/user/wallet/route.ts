import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/drizzle/db"
import { UserTable, VerificationTokenTable, WalletAddressTable } from "@/drizzle/schema"
import { and, eq, ne } from "drizzle-orm"
import { z } from "zod"
import { PublicKey } from "@solana/web3.js"
import { verifyAsync } from "@noble/ed25519"
import bs58 from "bs58"

const bodySchema = z.object({
  walletAddress: z
    .string()
    .min(32, "Invalid address")
    .max(44, "Invalid address")
    .nullable(),
  nonce: z.string().optional(),
  signature: z.string().optional(),
})

const LINK_MESSAGE = (nonce: string) =>
  `Link wallet to Superteam Brazil Academy\n\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any fees.`

// Save (or clear) wallet address for the authenticated user
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
  }

  // Clearing a linked wallet is allowed for authenticated users.
  if (parsed.data.walletAddress == null) {
    await db.transaction(async (tx) => {
      await tx
        .update(UserTable)
        .set({ walletAddress: null })
        .where(eq(UserTable.id, session.user.id))

      await tx
        .update(WalletAddressTable)
        .set({ isPrimary: false })
        .where(eq(WalletAddressTable.userId, session.user.id))
    })

    return NextResponse.json({ success: true })
  }

  const walletAddress = parsed.data.walletAddress
  const nonce = parsed.data.nonce
  const signature = parsed.data.signature
  if (!nonce || !signature) {
    return NextResponse.json(
      { error: "Nonce and signature are required" },
      { status: 400 }
    )
  }

  try {
    new PublicKey(walletAddress)
  } catch {
    return NextResponse.json({ error: "Invalid public key" }, { status: 400 })
  }

  const nonceIdentifier = `wallet-link-nonce:${walletAddress}`
  const nonceRecord = await db.query.VerificationTokenTable.findFirst({
    where: eq(VerificationTokenTable.identifier, nonceIdentifier),
  })

  if (!nonceRecord || nonceRecord.token !== nonce || new Date(nonceRecord.expires) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired nonce" }, { status: 400 })
  }

  try {
    const signatureBytes = bs58.decode(signature)
    const isValid = await verifyAsync(
      signatureBytes,
      new TextEncoder().encode(LINK_MESSAGE(nonce)),
      new PublicKey(walletAddress).toBytes()
    )
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  await db
    .delete(VerificationTokenTable)
    .where(eq(VerificationTokenTable.identifier, nonceIdentifier))

  const existingOwner = await db.query.UserTable.findFirst({
    where: and(
      eq(UserTable.walletAddress, walletAddress),
      ne(UserTable.id, session.user.id)
    ),
    columns: { id: true },
  })

  const existingWallet = await db.query.WalletAddressTable.findFirst({
    where: eq(WalletAddressTable.address, walletAddress),
    columns: { userId: true },
  })

  if (existingOwner || (existingWallet && existingWallet.userId !== session.user.id)) {
    return NextResponse.json(
      { error: "Wallet address is already linked to another account" },
      { status: 409 }
    )
  }

  await db.transaction(async (tx) => {
    await tx
      .update(UserTable)
      .set({ walletAddress })
      .where(eq(UserTable.id, session.user.id))

    await tx
      .update(WalletAddressTable)
      .set({ isPrimary: false })
      .where(eq(WalletAddressTable.userId, session.user.id))

    const ownWallet = await tx.query.WalletAddressTable.findFirst({
      where: and(
        eq(WalletAddressTable.userId, session.user.id),
        eq(WalletAddressTable.address, walletAddress)
      ),
      columns: { id: true },
    })

    if (ownWallet) {
      await tx
        .update(WalletAddressTable)
        .set({ isPrimary: true, verifiedAt: new Date() })
        .where(eq(WalletAddressTable.id, ownWallet.id))
    } else {
      await tx.insert(WalletAddressTable).values({
        userId: session.user.id,
        address: walletAddress,
        isPrimary: true,
        verifiedAt: new Date(),
      })
    }
  })

  return NextResponse.json({ success: true })
}
