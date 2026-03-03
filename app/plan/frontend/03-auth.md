# Auth & Account Linking Service (Frontend)

**Version:** 1.0  
**Scope:** Frontend authentication UI and hooks  
**Related Docs:** [backend/01-auth.md](../backend/01-auth.md), [backend/00-architecture.md](../backend/00-architecture.md), [SPEC.md](../../docs/SPEC.md)

## Overview

The Auth Service on the frontend handles authentication UI, wallet connection for auth, and account linking interface. This implements the **hybrid auth system** using:

- **NextAuth.js**: Session management (JWT strategy)
- **OAuth Providers**: Google, GitHub via NextAuth.js
- **Wallet Auth**: CredentialsProvider with custom signature verification
- **Supabase**: Stores user profiles and linked accounts
- **Backend signer**: Separate keypair for on-chain transaction signing

## Hybrid Auth Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND AUTH FLOW                                    │
│                                                                          │
│  WALLET AUTH:                                                            │
│  ┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐   │
│  │ Connect  │────▶│ GET /wallet/ │────▶│  Sign    │────▶│ POST /   │   │
│  │  Wallet  │     │ sign-message │     │ Message  │     │ verify   │   │
│  └──────────┘     └──────────────┘     └──────────┘     └──────────┘   │
│                                │                            │          │
│                                ▼                            ▼          │
│                         ┌──────────────┐            ┌──────────────┐   │
│                         │ Receive:     │            │ Receive:     │   │
│                         │ { message }  │            │ { user,      │   │
│                         │              │            │   session }  │   │
│                         └──────────────┘            └──────────────┘   │
│                                                                          │
│  OAUTH:                                                                  │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │  Click   │────▶│   Redirect   │────▶│   Backend    │                │
│  │  Button  │     │  to Google/  │     │   Callback   │                │
│  │          │     │   GitHub     │     │   Creates    │                │
│  └──────────┘     └──────────────┘     │   Session    │                │
│                                        └──────┬───────┘                │
│                                               │                        │
│                                               ▼                        │
│                                        ┌──────────────┐                │
│                                        │  Redirect    │                │
│                                        │  to /auth/   │                │
│                                        │  callback    │                │
│                                        └──────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Auth Provider (Root Context)

```typescript
// app/providers/AuthProvider.tsx
'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}

// Hook to access session
export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
        .from('profiles')
        .select('*, linked_accounts(provider, provider_id)')
        .eq('id', session.user.id)
        .single();
      
      setUser(profile);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshSession();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
}
```

### 2. Wallet Auth Hook

```typescript
// hooks/useWalletAuth.ts
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { useAuthContext } from '@/app/providers/AuthProvider';

interface WalletAuthError {
  code: string;
  message: string;
}

export function useWalletAuth() {
  const { publicKey, signMessage, connected } = useWallet();
  const { refreshSession } = useAuthContext();

  const authenticate = async (): Promise<{ success: boolean; error?: WalletAuthError }> => {
    if (!publicKey || !signMessage) {
      return { 
        success: false, 
        error: { code: 'WALLET_NOT_CONNECTED', message: 'Please connect your wallet first' }
      };
    }

    try {
      // Step 1: Get message from backend (contains nonce for replay protection)
      const messageRes = await fetch('/api/auth/wallet/sign-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      });

      if (!messageRes.ok) {
        const error = await messageRes.json();
        return { success: false, error: { code: 'MESSAGE_ERROR', message: error.error } };
      }

      const { message } = await messageRes.json();

      // Step 2: Sign the message
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);

      // Step 3: Verify with backend
      const verifyRes = await fetch('/api/auth/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          message,
          signature: bs58.encode(signature),
        }),
      });

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        return { 
          success: false, 
          error: { 
            code: error.code || 'VERIFICATION_FAILED', 
            message: error.error || 'Signature verification failed'
          }
        };
      }

      const data = await verifyRes.json();
      
      // Step 4: Set Supabase session
      if (data.session) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      await refreshSession();
      return { success: true };

    } catch (err) {
      return { 
        success: false, 
        error: { code: 'UNKNOWN_ERROR', message: err instanceof Error ? err.message : 'Unknown error' }
      };
    }
  };

  return { authenticate, connected, publicKey };
}
```

### 3. OAuth Auth Hook

```typescript
// hooks/useOAuth.ts
import { useAuthContext } from '@/app/providers/AuthProvider';

export function useOAuth() {
  const { refreshSession } = useAuthContext();

  const initiateGoogleAuth = async (mode: 'login' | 'link' = 'login') => {
    // Get OAuth URL from backend
    const res = await fetch('/api/auth/link/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to initiate Google auth');
    }

    const { url } = await res.json();
    window.location.href = url;
  };

  const initiateGitHubAuth = async (mode: 'login' | 'link' = 'login') => {
    const res = await fetch('/api/auth/link/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to initiate GitHub auth');
    }

    const { url } = await res.json();
    window.location.href = url;
  };

  // Handle OAuth callback
  const handleCallback = async (accessToken: string) => {
    const supabase = createClient();
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: '', // Will be provided by Supabase
    });
    await refreshSession();
  };

  return {
    initiateGoogleAuth,
    initiateGitHubAuth,
    handleCallback,
  };
}
```

### 4. Account Linking Hook

```typescript
// hooks/useAccountLinking.ts
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { useAuthContext } from '@/app/providers/AuthProvider';

export function useAccountLinking() {
  const { publicKey, signMessage, connected } = useWallet();
  const { user, refreshSession } = useAuthContext();

  const linkWallet = async (): Promise<{ success: boolean; error?: string }> => {
    if (!connected || !publicKey || !signMessage) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Check if already linked
    if (user?.linked_accounts?.some(a => a.provider === 'wallet')) {
      return { success: false, error: 'Wallet already linked to this account' };
    }

    try {
      // Get message from backend
      const messageRes = await fetch('/api/auth/wallet/sign-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      });

      if (!messageRes.ok) {
        const error = await messageRes.json();
        return { success: false, error: error.error };
      }

      const { message } = await messageRes.json();

      // Sign message
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);

      // Link wallet
      const linkRes = await fetch('/api/auth/link/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          message,
          signature: bs58.encode(signature),
        }),
      });

      if (!linkRes.ok) {
        const error = await linkRes.json();
        return { success: false, error: error.error };
      }

      await refreshSession();
      return { success: true };

    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to link wallet'
      };
    }
  };

  const unlinkProvider = async (provider: string): Promise<{ success: boolean; error?: string }> => {
    // Prevent unlinking if it's the only provider
    const linkedCount = user?.linked_accounts?.length ?? 0;
    if (linkedCount <= 1) {
      return { success: false, error: 'Cannot unlink your only authentication method' };
    }

    const res = await fetch(`/api/auth/unlink/${provider}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, error: error.error };
    }

    await refreshSession();
    return { success: true };
  };

  const hasLinkedProvider = (provider: string): boolean => {
    return user?.linked_accounts?.some(a => a.provider === provider) ?? false;
  };

  return {
    linkWallet,
    unlinkProvider,
    hasLinkedProvider,
    canUnlink: (user?.linked_accounts?.length ?? 0) > 1,
  };
}
```

### 5. Login Page

```typescript
// app/(auth)/login/page.tsx
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useOAuth } from '@/hooks/useOAuth';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const { connected, publicKey } = useWallet();
  const { authenticate, isLoading: isAuthenticating } = useWalletAuth();
  const { initiateGoogleAuth, initiateGitHubAuth } = useOAuth();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (connected && publicKey && !isAuthenticated && !isAuthLoading) {
      handleWalletAuth();
    }
  }, [connected, publicKey]);

  const handleWalletAuth = async () => {
    setError(null);
    const result = await authenticate();
    
    if (!result.success && result.error) {
      setError(result.error.message);
    }
  };

  if (isAuthLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to Superteam Academy</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to start learning Solana development
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Wallet Auth */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Connect Wallet</label>
            <WalletMultiButton className="w-full" />
            {connected && isAuthenticating && (
              <p className="text-sm text-muted-foreground">Authenticating...</p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => initiateGoogleAuth('login')}
              className="w-full"
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Google
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => initiateGitHubAuth('login')}
              className="w-full"
            >
              <GitHubIcon className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          By signing in, you agree to our{' '}
          <a href="/terms" className="underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

// Icon components
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
```

### 6. Account Linking Component

```typescript
// components/auth/AccountLinking.tsx
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAccountLinking } from '@/hooks/useAccountLinking';
import { useOAuth } from '@/hooks/useOAuth';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

export function AccountLinking() {
  const { connected, publicKey } = useWallet();
  const { user } = useAuthContext();
  const { linkWallet, unlinkProvider, hasLinkedProvider, canUnlink } = useAccountLinking();
  const { initiateGoogleAuth, initiateGitHubAuth } = useOAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkWallet = async () => {
    setError(null);
    setIsLinking(true);
    const result = await linkWallet();
    setIsLinking(false);
    
    if (!result.success) {
      setError(result.error || 'Failed to link wallet');
    }
  };

  const handleUnlink = async (provider: string) => {
    setError(null);
    const result = await unlinkProvider(provider);
    
    if (!result.success) {
      setError(result.error || 'Failed to unlink account');
    }
  };

  const walletLinked = hasLinkedProvider('wallet');
  const googleLinked = hasLinkedProvider('google');
  const githubLinked = hasLinkedProvider('github');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Link multiple accounts to sign in with any method. At least one account must remain linked.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Wallet */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <WalletIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Solana Wallet</p>
              {walletLinked && user?.wallet_address && (
                <p className="text-sm text-muted-foreground">
                  {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                </p>
              )}
            </div>
          </div>
          
          {walletLinked ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleUnlink('wallet')}
              disabled={!canUnlink}
            >
              Unlink
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <WalletMultiButton />
              {connected && publicKey && (
                <Button 
                  size="sm" 
                  onClick={handleLinkWallet}
                  disabled={isLinking}
                >
                  {isLinking ? 'Linking...' : 'Link Wallet'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Google */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <GoogleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium">Google</p>
              {googleLinked && user?.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
          
          {googleLinked ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleUnlink('google')}
              disabled={!canUnlink}
            >
              Unlink
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => initiateGoogleAuth('link')}
            >
              Connect
            </Button>
          )}
        </div>

        {/* GitHub */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <GitHubIcon className="w-5 h-5 text-gray-800" />
            </div>
            <div>
              <p className="font-medium">GitHub</p>
            </div>
          </div>
          
          {githubLinked ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleUnlink('github')}
              disabled={!canUnlink}
            >
              Unlink
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => initiateGitHubAuth('link')}
            >
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Simple icon components
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
```

### 7. Protected Route Component

```typescript
// components/auth/ProtectedRoute.tsx
'use client';

import { useAuthContext } from '@/app/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireWallet?: boolean;
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requireWallet = false,
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  const hasLinkedWallet = user?.linked_accounts?.some(
    a => a.provider === 'wallet'
  ) ?? false;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
    } else if (requireWallet && !hasLinkedWallet) {
      // Redirect to settings to link wallet
      router.push('/settings?tab=accounts&action=link-wallet');
    }
  }, [isLoading, isAuthenticated, requireWallet, hasLinkedWallet, router, pathname]);

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireWallet && !hasLinkedWallet) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <WalletRequiredPrompt />
      </div>
    );
  }

  return <>{children}</>;
}

function LoadingSpinner() {
  return (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  );
}

function WalletRequiredPrompt() {
  const router = useRouter();
  
  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold">Wallet Required</h2>
      <p className="text-muted-foreground">
        This page requires a linked Solana wallet for on-chain operations.
      </p>
      <Button onClick={() => router.push('/settings?tab=accounts')}>
        Link Wallet
      </Button>
    </div>
  );
}
```

### 8. OAuth Callback Page

```typescript
// app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOAuth } from '@/hooks/useOAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleCallback } = useOAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const accessToken = searchParams.get('access_token');
  const errorParam = searchParams.get('error');
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setIsProcessing(false);
      return;
    }

    if (!accessToken) {
      setError('No access token provided');
      setIsProcessing(false);
      return;
    }

    // Handle the OAuth callback
    handleCallback(accessToken)
      .then(() => {
        router.push(returnUrl);
      })
      .catch((err) => {
        setError(err.message || 'Authentication failed');
        setIsProcessing(false);
      });
  }, [accessToken, errorParam, returnUrl, router, handleCallback]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Completing Sign In</CardTitle>
            <CardDescription>Please wait while we complete your authentication...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>We encountered an issue signing you in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/login')} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
```

### 9. Root Layout Integration

```typescript
// app/layout.tsx
import { AuthProvider } from '@/app/providers/AuthProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
```

## Error Handling

### Error Codes Mapping

| Frontend Error | Backend Error | Action |
|---------------|---------------|--------|
| `WALLET_NOT_CONNECTED` | - | Prompt user to connect wallet |
| `MESSAGE_ERROR` | Server error | Retry or show generic error |
| `INVALID_SIGNATURE` | Verification failed | Prompt to retry signing |
| `WALLET_ALREADY_LINKED` | Wallet already linked | Show error, cannot link |
| `SESSION_EXPIRED` | - | Redirect to login |
| `CANNOT_UNLINK_LAST` | Cannot unlink only method | Prevent action, show message |

## Routes Requiring Wallet

Per [SPEC.md](../../docs/SPEC.md), these routes require wallet for on-chain operations:

| Route | Instruction | Why Wallet Required |
|-------|-------------|-------------------|
| `/courses/[slug]` | `enroll` | Learner signs enrollment TX |
| `/courses/[slug]/lessons/[id]` | `complete_lesson` | Triggers backend signing |
| `/dashboard` | - | Display XP from Token-2022 ATA |
| `/profile` | - | Show credentials (Metaplex Core NFTs) |

## Backend API Reference

See [backend/01-auth.md](../backend/01-auth.md) for:
- Complete API endpoint specifications
- Database schema (`linked_accounts` table)
- Wallet signature verification implementation
- OAuth callback handlers
- Session management with Supabase

## Integration with On-Chain Program

The frontend auth is **Layer 1** (user identity). **Layer 2** (backend signer) handles:
- `complete_lesson` - After frontend validates
- `finalize_course` - After all lessons complete
- `issue_credential` - After course finalized
- `award_achievement` - For achievements

User wallet signs:
- `enroll` - Creating Enrollment PDA
- `close_enrollment` - Reclaiming rent

See [backend/00-architecture.md](../backend/00-architecture.md) for the two-layer auth system details.

## Testing Checklist

- [ ] Wallet auth flow (connect → sign → verify → session)
- [ ] Google OAuth flow
- [ ] GitHub OAuth flow
- [ ] Link wallet to existing OAuth account
- [ ] Link OAuth to existing wallet account
- [ ] Unlink provider (with "last provider" protection)
- [ ] Protected routes redirect when unauthenticated
- [ ] Wallet-required routes redirect when no wallet linked
- [ ] Session persists across page reloads
- [ ] Session expires correctly
