import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, setSession } from '@/lib/auth/server-session';
import { linkWalletToUser } from '@/lib/auth/server-store';
import { clearWalletState, readWalletState } from '@/lib/auth/server-wallet-state';
import {
  parseChallengeMessage,
  validateWalletAddress,
  verifyWalletSignature
} from '@/lib/auth/server-wallet';

export const runtime = 'nodejs';

interface WalletLinkBody {
  walletAddress?: string;
  message?: string;
  signature?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const body = (await request.json()) as WalletLinkBody;
  if (!body.walletAddress || !body.message || !body.signature) {
    return NextResponse.json({ error: 'missing wallet link payload' }, { status: 400 });
  }

  const walletState = readWalletState(request);
  if (!walletState || walletState.intent !== 'link') {
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

  try {
    const user = await linkWalletToUser(session.user.id, walletAddress);
    const response = NextResponse.json({ ok: true, user });
    setSession(response, user.id);
    clearWalletState(response);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : 'wallet_link_failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
