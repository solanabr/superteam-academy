import { NextRequest, NextResponse } from 'next/server';
import {
  buildAuthorizationUrl,
  ensureProviderConfigured,
  fetchOAuthProfile
} from '@/lib/auth/server-oauth';
import {
  clearOAuthStateCookie,
  readOAuthStateCookie,
  setOAuthStateCookie
} from '@/lib/auth/server-oauth-state';
import { getSessionFromRequest, setSession } from '@/lib/auth/server-session';
import { upsertOAuthUser } from '@/lib/auth/server-store';
import { OAuthProvider } from '@/lib/auth/server-types';

function safeCallback(value: string | null): string {
  if (!value) {
    return '/dashboard';
  }

  if (!value.startsWith('/')) {
    return '/dashboard';
  }

  return value;
}

export async function startOAuth(
  request: NextRequest,
  provider: OAuthProvider
): Promise<NextResponse> {
  try {
    ensureProviderConfigured(provider);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OAUTH_MISCONFIGURED';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const mode = request.nextUrl.searchParams.get('mode') === 'link' ? 'link' : 'signin';
  const callbackUrl = safeCallback(request.nextUrl.searchParams.get('callbackUrl'));
  const response = NextResponse.redirect(new URL('/', request.url));
  const state = setOAuthStateCookie(response, provider, {
    mode,
    callbackUrl
  });

  const authUrl = buildAuthorizationUrl(provider, state, request.nextUrl.origin);
  response.headers.set('location', authUrl);
  return response;
}

export async function oauthCallback(
  request: NextRequest,
  provider: OAuthProvider
): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/register?error=oauth_missing_code', request.url));
  }

  const cookieState = readOAuthStateCookie(request, provider);
  if (!cookieState || cookieState.nonce !== state) {
    return NextResponse.redirect(new URL('/register?error=oauth_state_invalid', request.url));
  }

  try {
    const profile = await fetchOAuthProfile(provider, code, request.nextUrl.origin);
    const currentSession = await getSessionFromRequest(request);
    const user = await upsertOAuthUser(profile, {
      linkToUserId:
        cookieState.mode === 'link' ? currentSession?.user.id : undefined
    });

    const response = NextResponse.redirect(new URL(cookieState.callbackUrl, request.url));
    setSession(response, user.id);
    clearOAuthStateCookie(response, provider);
    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : 'oauth_callback_failed';
    const response = NextResponse.redirect(
      new URL(`/register?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
    clearOAuthStateCookie(response, provider);
    return response;
  }
}
