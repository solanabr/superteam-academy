import { NextRequest, NextResponse } from 'next/server';
import { randomNonce } from '@/lib/auth/server-session';
import { setWalletState } from '@/lib/auth/server-wallet-state';
import {
  buildWalletChallengeMessage,
  validateWalletAddress
} from '@/lib/auth/server-wallet';

export const runtime = 'nodejs';

interface ChallengeBody {
  walletAddress?: string;
  intent?: 'signin' | 'link';
  callbackUrl?: string;
}

function safeCallback(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  if (!value.startsWith('/')) {
    return '/dashboard';
  }

  return value;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as ChallengeBody;
  if (!body.walletAddress) {
    return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
  }

  try {
    const walletAddress = validateWalletAddress(body.walletAddress);
    const intent = body.intent === 'link' ? 'link' : 'signin';
    const nonce = randomNonce(16);
    const callbackUrl = safeCallback(body.callbackUrl);
    const message = buildWalletChallengeMessage({
      walletAddress,
      nonce,
      intent,
      callbackUrl
    });

    const response = NextResponse.json({
      message,
      walletAddress,
      nonce
    });
    setWalletState(response, {
      walletAddress,
      nonce,
      intent,
      callbackUrl
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'invalid wallet address' }, { status: 400 });
  }
}
