import { OAuthProfile, OAuthProvider } from '@/lib/auth/server-types';

interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

function appUrl(requestOrigin?: string): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    requestOrigin ||
    'http://localhost:3000';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function providerConfig(provider: OAuthProvider): OAuthProviderConfig {
  if (provider === 'google') {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
      scopes: ['openid', 'email', 'profile']
    };
  }

  return {
    clientId: process.env.GITHUB_CLIENT_ID ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email']
  };
}

export function oauthCallbackPath(provider: OAuthProvider): string {
  return `/api/auth/${provider}/callback`;
}

export function oauthRedirectUri(provider: OAuthProvider, requestOrigin?: string): string {
  return `${appUrl(requestOrigin)}${oauthCallbackPath(provider)}`;
}

export function providerStartPath(provider: OAuthProvider): string {
  return `/api/auth/${provider}/start`;
}

export function ensureProviderConfigured(provider: OAuthProvider): void {
  const config = providerConfig(provider);
  if (!config.clientId || !config.clientSecret) {
    throw new Error(`MISSING_${provider.toUpperCase()}_OAUTH_ENV`);
  }
}

export function buildAuthorizationUrl(
  provider: OAuthProvider,
  state: string,
  requestOrigin?: string
): string {
  const config = providerConfig(provider);
  const redirectUri = oauthRedirectUri(provider, requestOrigin);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state
  });

  if (provider === 'google') {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }

  return `${config.authorizationUrl}?${params.toString()}`;
}

async function exchangeCode(
  provider: OAuthProvider,
  code: string,
  requestOrigin?: string
): Promise<string> {
  const config = providerConfig(provider);
  const redirectUri = oauthRedirectUri(provider, requestOrigin);

  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers:
      provider === 'github'
        ? {
            accept: 'application/json',
            'content-type': 'application/x-www-form-urlencoded'
          }
        : {
            'content-type': 'application/x-www-form-urlencoded'
          },
    body
  });

  if (!response.ok) {
    throw new Error(`TOKEN_EXCHANGE_FAILED_${provider.toUpperCase()}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
  };

  if (!payload.access_token) {
    throw new Error(`TOKEN_EXCHANGE_MISSING_ACCESS_TOKEN_${provider.toUpperCase()}`);
  }

  return payload.access_token;
}

async function fetchGithubEmail(accessToken: string): Promise<string | null> {
  const response = await fetch('https://api.github.com/user/emails', {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'user-agent': 'superteam-academy-auth'
    }
  });
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Array<{
    email?: string;
    primary?: boolean;
    verified?: boolean;
  }>;

  const preferred =
    payload.find((item) => item.primary && item.verified && item.email) ??
    payload.find((item) => item.verified && item.email) ??
    payload.find((item) => item.email);

  return preferred?.email ?? null;
}

export async function fetchOAuthProfile(
  provider: OAuthProvider,
  code: string,
  requestOrigin?: string
): Promise<OAuthProfile> {
  const accessToken = await exchangeCode(provider, code, requestOrigin);

  const config = providerConfig(provider);
  const response = await fetch(config.userInfoUrl, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
      'user-agent': 'superteam-academy-auth'
    }
  });

  if (!response.ok) {
    throw new Error(`PROFILE_FETCH_FAILED_${provider.toUpperCase()}`);
  }

  if (provider === 'google') {
    const payload = (await response.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!payload.sub || !payload.email) {
      throw new Error('GOOGLE_PROFILE_INCOMPLETE');
    }

    return {
      provider,
      providerAccountId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      image: payload.picture
    };
  }

  const payload = (await response.json()) as {
    id?: number;
    login?: string;
    name?: string;
    avatar_url?: string;
    email?: string | null;
  };

  const githubEmail = payload.email ?? (await fetchGithubEmail(accessToken));
  if (!payload.id || !githubEmail) {
    throw new Error('GITHUB_PROFILE_INCOMPLETE');
  }

  return {
    provider,
    providerAccountId: String(payload.id),
    email: githubEmail,
    name: payload.name ?? payload.login ?? githubEmail,
    image: payload.avatar_url
  };
}
