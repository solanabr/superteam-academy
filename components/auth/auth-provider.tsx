'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  saveRegistrationRecord,
  clearRegistrationRecord,
  getRegistrationRecord,
  AuthProvider as RegistrationProvider
} from '@/lib/auth/registration-storage';
import { AuthProvider as ServerAuthProvider, AuthSessionUser } from '@/lib/auth/server-types';

type OAuthProvider = 'google' | 'github';
type OAuthMode = 'signin' | 'link';

interface WalletAuthPayload {
  walletAddress: string;
  message: string;
  signature: string;
  name?: string;
  email?: string;
  username?: string;
  password?: string;
}

interface AuthContextValue {
  loading: boolean;
  authenticated: boolean;
  user: AuthSessionUser | null;
  refreshSession: () => Promise<void>;
  startOAuthFlow: (provider: OAuthProvider, mode: OAuthMode, callbackUrl?: string) => void;
  requestWalletChallenge: (
    walletAddress: string,
    intent: 'signin' | 'link',
    callbackUrl?: string
  ) => Promise<string>;
  walletSignIn: (payload: WalletAuthPayload) => Promise<{ ok: boolean; redirectUrl?: string; error?: string }>;
  credentialsSignIn: (payload: {
    email: string;
    password: string;
    callbackUrl?: string;
  }) => Promise<{ ok: boolean; redirectUrl?: string; error?: string }>;
  linkWallet: (payload: {
    walletAddress: string;
    message: string;
    signature: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

interface SessionApiResponse {
  authenticated: boolean;
  user: AuthSessionUser | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toRegistrationProviders(
  providers: ServerAuthProvider[] | undefined
): RegistrationProvider[] {
  if (!providers) {
    return [];
  }

  return providers.filter(
    (provider): provider is RegistrationProvider =>
      provider === 'wallet' || provider === 'google' || provider === 'github' || provider === 'credentials'
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<AuthSessionUser | null>(null);

  async function refreshSession(): Promise<void> {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      const payload = (await response.json()) as SessionApiResponse;
      setUser(payload.authenticated ? payload.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      try {
        clearRegistrationRecord();
      } catch {
        // Ignore local persistence errors to keep auth state functional.
      }
      return;
    }

    try {
      const existingRecord = getRegistrationRecord();
      const preserveExisting = existingRecord?.id === user.id;

      saveRegistrationRecord({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        providers: toRegistrationProviders(user.providers),
        walletAddress: user.walletAddress,
        bio: preserveExisting ? existingRecord?.bio : undefined,
        darkModeDefault: preserveExisting ? existingRecord?.darkModeDefault : undefined,
        emailNotifications: preserveExisting ? existingRecord?.emailNotifications : undefined,
        publicProfile: preserveExisting ? existingRecord?.publicProfile : undefined,
        createdAt: preserveExisting
          ? existingRecord?.createdAt ?? new Date().toISOString()
          : new Date().toISOString()
      });
    } catch {
      // Ignore local persistence errors to keep auth state functional.
    }
  }, [loading, user]);

  useEffect(() => {
    function onVisibility(): void {
      if (document.visibilityState === 'visible') {
        void refreshSession();
      }
    }

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  function startOAuthFlow(provider: OAuthProvider, mode: OAuthMode, callbackUrl = '/dashboard'): void {
    const params = new URLSearchParams({
      mode,
      callbackUrl
    });
    window.location.href = `/api/auth/${provider}/start?${params.toString()}`;
  }

  async function requestWalletChallenge(
    walletAddress: string,
    intent: 'signin' | 'link',
    callbackUrl = '/dashboard'
  ): Promise<string> {
    const response = await fetch('/api/auth/wallet/challenge', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        walletAddress,
        intent,
        callbackUrl
      })
    });

    const payload = (await response.json()) as { message?: string; error?: string };
    if (!response.ok || !payload.message) {
      throw new Error(payload.error ?? 'wallet_challenge_failed');
    }

    return payload.message;
  }

  async function walletSignIn(payload: WalletAuthPayload): Promise<{ ok: boolean; redirectUrl?: string; error?: string }> {
    const response = await fetch('/api/auth/wallet/signin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as {
      ok?: boolean;
      redirectUrl?: string;
      error?: string;
    };

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        error: data.error ?? 'wallet_signin_failed'
      };
    }

    await refreshSession();

    return {
      ok: true,
      redirectUrl: data.redirectUrl
    };
  }

  async function credentialsSignIn(payload: {
    email: string;
    password: string;
    callbackUrl?: string;
  }): Promise<{ ok: boolean; redirectUrl?: string; error?: string }> {
    const response = await fetch('/api/auth/credentials/signin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        callbackUrl: payload.callbackUrl ?? '/dashboard'
      })
    });

    const data = (await response.json()) as {
      ok?: boolean;
      redirectUrl?: string;
      error?: string;
    };

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        error: data.error ?? 'credentials_signin_failed'
      };
    }

    await refreshSession();
    return {
      ok: true,
      redirectUrl: data.redirectUrl
    };
  }

  async function linkWallet(payload: {
    walletAddress: string;
    message: string;
    signature: string;
  }): Promise<{ ok: boolean; error?: string }> {
    const response = await fetch('/api/auth/wallet/link', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
    };

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        error: data.error ?? 'wallet_link_failed'
      };
    }

    await refreshSession();
    return { ok: true };
  }

  async function logout(): Promise<void> {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    await refreshSession();
  }

  const value: AuthContextValue = {
    loading,
    authenticated: Boolean(user),
    user,
    refreshSession,
    startOAuthFlow,
    requestWalletChallenge,
    walletSignIn,
    credentialsSignIn,
    linkWallet,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
