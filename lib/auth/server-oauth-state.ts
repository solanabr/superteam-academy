import { NextRequest, NextResponse } from 'next/server';
import { OAuthProvider } from '@/lib/auth/server-types';
import {
  buildSignedStateCookie,
  randomNonce,
  readSignedStateCookie
} from '@/lib/auth/server-session';

const STATE_COOKIE_PREFIX = 'superteam_auth_oauth_state_';
const STATE_COOKIE_MAX_AGE_SECONDS = 60 * 10;

export interface OAuthStatePayload {
  nonce: string;
  mode: 'signin' | 'link';
  callbackUrl: string;
}

function cookieName(provider: OAuthProvider): string {
  return `${STATE_COOKIE_PREFIX}${provider}`;
}

export function setOAuthStateCookie(
  response: NextResponse,
  provider: OAuthProvider,
  payload: Omit<OAuthStatePayload, 'nonce'>
): string {
  const nonce = randomNonce(18);
  const signed = buildSignedStateCookie({
    ...payload,
    nonce
  });

  response.cookies.set({
    name: cookieName(provider),
    value: signed,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: STATE_COOKIE_MAX_AGE_SECONDS
  });

  return nonce;
}

export function readOAuthStateCookie(
  request: NextRequest,
  provider: OAuthProvider
): OAuthStatePayload | null {
  return readSignedStateCookie<OAuthStatePayload>(
    request.cookies.get(cookieName(provider))?.value
  );
}

export function clearOAuthStateCookie(
  response: NextResponse,
  provider: OAuthProvider
): void {
  response.cookies.set({
    name: cookieName(provider),
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0)
  });
}
