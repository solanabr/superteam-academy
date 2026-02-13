import { NextRequest, NextResponse } from 'next/server';
import {
  buildSignedStateCookie,
  readSignedStateCookie
} from '@/lib/auth/server-session';

const WALLET_STATE_COOKIE = 'superteam_auth_wallet_state';
const WALLET_STATE_TTL = 60 * 10;

export interface WalletStatePayload {
  nonce: string;
  walletAddress: string;
  intent: 'signin' | 'link';
  callbackUrl?: string;
}

export function setWalletState(
  response: NextResponse,
  payload: WalletStatePayload
): void {
  response.cookies.set({
    name: WALLET_STATE_COOKIE,
    value: buildSignedStateCookie({ ...payload }),
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: WALLET_STATE_TTL
  });
}

export function readWalletState(request: NextRequest): WalletStatePayload | null {
  return readSignedStateCookie<WalletStatePayload>(
    request.cookies.get(WALLET_STATE_COOKIE)?.value
  );
}

export function clearWalletState(response: NextResponse): void {
  response.cookies.set({
    name: WALLET_STATE_COOKIE,
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0)
  });
}
