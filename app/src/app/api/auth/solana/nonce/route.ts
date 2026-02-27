import { NextResponse } from 'next/server';
import { generateNonce, generateSignInMessage } from '@/lib/solana-auth';

/**
 * GET /api/auth/solana/nonce
 * Generate a nonce and message for Solana wallet sign-in
 */
export async function GET() {
  const nonce = generateNonce();
  const message = generateSignInMessage(nonce);

  // Store nonce in a short-lived way (in production, use Redis or similar)
  // For now, the nonce is embedded in the message and verified client-side

  return NextResponse.json({
    nonce,
    message,
  });
}
