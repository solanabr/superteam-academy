import { NextRequest, NextResponse } from 'next/server'
import { generateNonce, createSIWSMessage } from '@/lib/siws'

/**
 * GET /api/auth/wallet
 *
 * Returns a fresh nonce + SIWS message for the wallet to sign.
 * The client sends `walletAddress` as a query param.
 */
export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get('walletAddress')

  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 })
  }

  const nonce = generateNonce()
  const issuedAt = new Date().toISOString()
  const message = createSIWSMessage(walletAddress, nonce, issuedAt)

  return NextResponse.json({ message, nonce, issuedAt })
}
