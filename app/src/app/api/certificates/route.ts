import { NextRequest, NextResponse } from 'next/server'

/**
 * Certificate issuance endpoint.
 * In production: verify course completion, mint compressed NFT, return mint address.
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { wallet, courseSlug } = body

  if (!wallet || !courseSlug) {
    return NextResponse.json({ error: 'wallet and courseSlug required' }, { status: 400 })
  }

  // TODO: In production:
  // 1. Verify wallet signature
  // 2. Check all lessons completed via Prisma
  // 3. Mint compressed NFT via certificates.ts
  // 4. Store certificate record in DB

  // Mock response for demo
  return NextResponse.json({
    success: true,
    certificate: {
      courseSlug,
      wallet,
      mintAddress: 'DEMO_MINT_ADDRESS',
      txSignature: 'DEMO_TX_SIGNATURE',
      issuedAt: new Date().toISOString(),
      explorerUrl: `https://explorer.solana.com/address/DEMO_MINT_ADDRESS?cluster=devnet`,
    },
  })
}
