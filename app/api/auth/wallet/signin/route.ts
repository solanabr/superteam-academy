import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateWalletUser } from '@/lib/auth/server-store';
import { setSession } from '@/lib/auth/server-session';
import { clearWalletState, readWalletState } from '@/lib/auth/server-wallet-state';
import {
  parseChallengeMessage,
  validateWalletAddress,
  verifyWalletSignature
} from '@/lib/auth/server-wallet';

export const runtime = 'nodejs';

interface WalletSignInBody {
  walletAddress?: string;
  message?: string;
  signature?: string;
  name?: string;
  email?: string;
  username?: string;
  password?: string;
}

function safeRedirect(path: string | undefined): string {
  if (!path || !path.startsWith('/')) {
    return '/dashboard';
  }
  return path;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as WalletSignInBody;
  if (!body.walletAddress || !body.message || !body.signature) {
    return NextResponse.json({ error: 'missing wallet sign-in payload' }, { status: 400 });
  }

  const walletState = readWalletState(request);
  if (!walletState || walletState.intent !== 'signin') {
    return NextResponse.json({ error: 'wallet challenge missing or expired' }, { status: 400 });
  }

  let walletAddress: string;
  try {
    walletAddress = validateWalletAddress(body.walletAddress);
  } catch {
    return NextResponse.json({ error: 'invalid wallet address' }, { status: 400 });
  }
  const parsedMessage = parseChallengeMessage(body.message);
  const signatureValid = verifyWalletSignature({
    walletAddress,
    message: body.message,
    signatureBase58: body.signature
  });

  if (
    !signatureValid ||
    parsedMessage.walletAddress !== walletAddress ||
    parsedMessage.nonce !== walletState.nonce ||
    walletState.walletAddress !== walletAddress
  ) {
    return NextResponse.json({ error: 'wallet signature verification failed' }, { status: 401 });
  }

  let user: Awaited<ReturnType<typeof findOrCreateWalletUser>>;
  try {
    user = await findOrCreateWalletUser({
      walletAddress,
      name: body.name,
      email: body.email,
      username: body.username,
      password: body.password
    });
  } catch (error) {
    console.error('wallet_signin_failed', error);
    return NextResponse.json({ error: 'wallet_signin_failed' }, { status: 500 });
  }

  const response = NextResponse.json({
    ok: true,
    redirectUrl: safeRedirect(walletState.callbackUrl),
    user
  });
  setSession(response, user.id);
  clearWalletState(response);
  return response;
}
