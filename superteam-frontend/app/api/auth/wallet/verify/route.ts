import bs58 from "bs58"
import nacl from "tweetnacl"
import { PublicKey } from "@solana/web3.js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import {
  createAccessTokenForWallet,
  extractAddressFromMessage,
  extractNonceFromMessage,
  getWalletNonceCookieName,
  getWalletSessionCookieName,
  verifyNonceChallengeToken,
} from "@/lib/server/wallet-auth"

type VerifyRequestBody = {
  address?: string
  message?: string
  signature?: string
}

function buildUsername(walletAddress: string): string {
  return `user_${walletAddress.slice(0, 6).toLowerCase()}`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyRequestBody
    const address = body.address?.trim()
    const message = body.message
    const signature = body.signature

    if (!address || !message || !signature) {
      return NextResponse.json(
        { error: "Address, message, and signature are required." },
        { status: 400 },
      )
    }

    let publicKey: PublicKey
    try {
      publicKey = new PublicKey(address)
    } catch {
      return NextResponse.json({ error: "Invalid Solana address." }, { status: 400 })
    }

    const nonce = extractNonceFromMessage(message)
    if (!nonce) {
      return NextResponse.json({ error: "Nonce not found in message." }, { status: 400 })
    }

    const messageAddress = extractAddressFromMessage(message)
    if (!messageAddress || messageAddress !== address) {
      return NextResponse.json({ error: "Message address does not match request address." }, { status: 401 })
    }

    const cookieStore = await cookies()
    const nonceChallengeToken = cookieStore.get(getWalletNonceCookieName())?.value
    const nonceValid = verifyNonceChallengeToken(nonceChallengeToken, address, nonce)
    if (!nonceValid) {
      return NextResponse.json(
        { error: "Nonce is invalid, expired, or belongs to another wallet." },
        { status: 401 },
      )
    }

    let signatureBytes: Uint8Array
    try {
      signatureBytes = bs58.decode(signature)
    } catch {
      return NextResponse.json({ error: "Invalid signature encoding." }, { status: 400 })
    }

    const messageBytes = new TextEncoder().encode(message)
    const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes())
    if (!verified) {
      return NextResponse.json({ error: "Signature verification failed." }, { status: 401 })
    }

    const user = {
      id: `wallet:${address}`,
      walletAddress: address,
      username: buildUsername(address),
    }
    const token = await createAccessTokenForWallet(user.id, user.walletAddress)
    cookieStore.delete(getWalletNonceCookieName())
    cookieStore.set(getWalletSessionCookieName(), token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          username: user.username,
        },
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 })
  }
}
