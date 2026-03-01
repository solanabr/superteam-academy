import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';

/**
 * Shared request validation for backend signer API routes.
 *
 * Extracts and validates the wallet address from JSON request body.
 * Returns either a ValidatedRequest or a NextResponse error.
 */

export interface ValidatedRequest {
  wallet: PublicKey;
  body: Record<string, unknown>;
}

export async function validateRequest(
  request: Request,
): Promise<ValidatedRequest | NextResponse> {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }

  const { wallet } = body;

  if (!wallet || typeof wallet !== 'string') {
    return NextResponse.json(
      { error: 'Missing wallet address' },
      { status: 400 },
    );
  }

  let walletPubkey: PublicKey;
  try {
    walletPubkey = new PublicKey(wallet);
  } catch {
    return NextResponse.json(
      { error: 'Invalid wallet address' },
      { status: 400 },
    );
  }

  return { wallet: walletPubkey, body };
}

export function isErrorResponse(
  result: ValidatedRequest | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
