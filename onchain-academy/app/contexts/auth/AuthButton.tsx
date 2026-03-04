'use client';

/**
 * components/auth/AuthButton.tsx
 *
 * A single button that drives the entire auth flow.
 *
 * State machine (driven by AuthContext.authStage):
 *
 *   'unauthenticated'
 *     → renders "Sign in with Google"
 *     → clicking calls signInWithGoogle()
 *
 *   'google_only'  (signed in, wallet not yet connected/linked)
 *     → renders "Connect Wallet"
 *     → clicking opens the Solana wallet modal
 *     → THEN if wallet connected but not linked, renders "Link Wallet"
 *     → clicking calls linkWallet() (triggers signature modal)
 *
 *   'wallet_only'  (wallet connected, no Google session)
 *     → renders "Sign in with Google" (nudge toward full auth)
 *     → wallet-only users can still browse courses but dashboard is gated
 *
 *   'fully_linked'
 *     → renders "Go to Dashboard"
 *     → clicking navigates to /dashboard
 *
 *   'loading'
 *     → renders a spinner, no interaction
 *
 * Props:
 *   variant     — visual variant passed to shadcn Button
 *   size        — size passed to shadcn Button
 *   className   — extra Tailwind classes
 *   redirectTo  — where to go after full auth (default: /dashboard)
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Loader2, LogIn, Wallet, Link2, LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// Inline Google icon (no extra dependency)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface AuthButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  redirectTo?: string;
  showSignOut?: boolean;
}

export function AuthButton({
  variant = 'default',
  size = 'default',
  className = '',
  redirectTo = '/dashboard',
  showSignOut = false,
}: AuthButtonProps) {
  const router = useRouter();
  const { setVisible: openWalletModal } = useWalletModal();
  const { connected: walletConnected } = useWallet();

  const {
    authStage,
    isLoading,
    error,
    signInWithGoogle,
    linkWallet,
    signOut,
    clearError,
  } = useAuth();

  // ── Connect wallet step ───────────────────────────────────────────────────
  // When google_only: user needs to connect AND then link.
  // We open the wallet modal if not connected, otherwise call linkWallet().
  const handleGoogleOnlyClick = useCallback(async () => {
    if (!walletConnected) {
      openWalletModal(true);
    } else {
      // Wallet already connected, go straight to link (sign message)
      await linkWallet();
    }
  }, [walletConnected, openWalletModal, linkWallet]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading && authStage === 'loading') {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2">Loading…</span>
      </Button>
    );
  }

  // Fully linked — show CTA to dashboard
  if (authStage === 'fully_linked') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => router.push(redirectTo)}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="ml-2">Go to Dashboard</span>
        </Button>
        {showSignOut && (
          <Button variant="ghost" size={size} onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // google_only — need to connect + link wallet
  if (authStage === 'google_only') {
    const label = walletConnected ? 'Link Wallet' : 'Connect Wallet';
    const Icon  = walletConnected ? Link2 : Wallet;

    return (
      <div className="flex flex-col items-start gap-1">
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={handleGoogleOnlyClick}
          disabled={isLoading}
        >
          {isLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Icon className="h-4 w-4" />
          }
          <span className="ml-2">{isLoading ? 'Linking…' : label}</span>
        </Button>
        {walletConnected && (
          <p className="text-xs text-muted-foreground px-1">
            Approve the signature to link your wallet
          </p>
        )}
        {error && (
          <p
            className="text-xs text-destructive px-1 cursor-pointer"
            onClick={clearError}
          >
            {error} (click to dismiss)
          </p>
        )}
      </div>
    );
  }

  // wallet_only or unauthenticated — show Google sign-in
  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={signInWithGoogle}
        disabled={isLoading}
      >
        {isLoading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <GoogleIcon className="h-4 w-4" />
        }
        <span className="ml-2">
          {isLoading ? 'Redirecting…' : 'Sign in with Google'}
        </span>
      </Button>
      {error && (
        <p
          className="text-xs text-destructive px-1 cursor-pointer"
          onClick={clearError}
        >
          {error} (click to dismiss)
        </p>
      )}
    </div>
  );
}
