'use client';

/**
 * contexts/AuthContext.tsx
 *
 * Single source of truth for all auth state in the app.
 *
 * Tracks:
 *   user       — Supabase auth.User (null if not signed in via Google)
 *   profile    — user_profiles row from DB (null until loaded)
 *   wallet     — Solana PublicKey (null if wallet not connected)
 *   isLinked   — whether profile.wallet_address is populated
 *   authStage  — computed state machine value, drives AuthButton rendering
 *
 * Auth stages:
 *   'unauthenticated'  No Google session, no wallet
 *   'google_only'      Google session, wallet not connected or not linked
 *   'wallet_only'      Wallet connected, no Google session (legacy/web3-native)
 *   'fully_linked'     Google session + wallet_address set in profile
 *
 * Usage:
 *   // Wrap the tree in app/layout.tsx:
 *   <AuthProvider><App /></AuthProvider>
 *
 *   // In any client component:
 *   const { user, profile, authStage, linkWallet, signOut } = useAuth();
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import type { User } from '@supabase/supabase-js';
import type { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getAuthService } from '@/lib/auth-service';
import type { DbUserProfile } from '@/lib/supabaseClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuthStage =
  | 'loading'
  | 'unauthenticated'
  | 'google_only'
  | 'wallet_only'
  | 'fully_linked';

export interface AuthContextValue {
  // State
  user:       User | null;
  profile:    DbUserProfile | null;
  wallet:     PublicKey | null;
  isLinked:   boolean;
  authStage:  AuthStage;
  isLoading:  boolean;
  error:      string | null;

  // Actions
  signInWithGoogle: () => Promise<void>;
  linkWallet:       () => Promise<void>;
  signOut:          () => Promise<void>;
  clearError:       () => void;
  refreshProfile:   () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase   = useMemo(() => createSupabaseBrowserClient(), []);
  const authSvc    = useMemo(() => getAuthService(), []);
  const walletCtx  = useWallet();

  const [user,      setUser]      = useState<User | null>(null);
  const [profile,   setProfile]   = useState<DbUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true until initial session check
  const [error,     setError]     = useState<string | null>(null);

  // ── Derived state ─────────────────────────────────────────────────────────

  const wallet   = walletCtx.publicKey ?? null;
  const isLinked = Boolean(profile?.wallet_address);

  const authStage = useMemo<AuthStage>((): AuthStage => {
    if (isLoading)   return 'loading';
    if (!user && !wallet) return 'unauthenticated';
    if (user && isLinked)  return 'fully_linked';
    if (user)              return 'google_only';
    return 'wallet_only';
  }, [isLoading, user, wallet, isLinked]);

  // ── Profile loader ────────────────────────────────────────────────────────

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await authSvc.getProfile(userId);
      setProfile(p);
    } catch (e) {
      console.error('[AuthContext] Failed to load profile:', e);
      setProfile(null);
    }
  }, [authSvc]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  // ── Initial session bootstrap ─────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        // getUser() validates the JWT on the server — never trust getSession() alone
        const { data: { user: u } } = await supabase.auth.getUser();

        if (!mounted) return;
        setUser(u);
        if (u) await loadProfile(u.id);
      } catch (e) {
        console.error('[AuthContext] Bootstrap error:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrap();
    return () => { mounted = false; };
  }, [supabase, loadProfile]);

  // ── Listen for auth state changes ─────────────────────────────────────────
  // (Google redirect callback, signOut, token refresh)

  useEffect(() => {
    const unsubscribe = authSvc.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);

      if (event === 'SIGNED_IN' && u) {
        await loadProfile(u.id);
        setIsLoading(false);
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsLoading(false);
      }

      if (event === 'TOKEN_REFRESHED' && u && !profile) {
        await loadProfile(u.id);
      }
    });

    return unsubscribe;
  }, [authSvc, loadProfile, profile]);

  // ── Re-check wallet link when wallet connects/disconnects ─────────────────
  // If a user connects a wallet that was already linked in the DB, update state.

  useEffect(() => {
    if (!user || !walletCtx.publicKey) return;

    if (
      profile &&
      !profile.wallet_address &&
      walletCtx.connected
    ) {
      // Profile exists but wallet not linked yet — no auto-link, user must confirm.
      // This is intentional: linking requires a signed message.
    }
  }, [user, walletCtx.publicKey, walletCtx.connected, profile]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await authSvc.signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed');
    }
  }, [authSvc]);

  const linkWallet = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      await authSvc.linkWallet(walletCtx);
      // Reload profile to reflect wallet_address in DB
      if (user) await loadProfile(user.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wallet linking failed');
    } finally {
      setIsLoading(false);
    }
  }, [authSvc, walletCtx, user, loadProfile]);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await authSvc.signOut();
      setUser(null);
      setProfile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-out failed');
    }
  }, [authSvc]);

  const clearError = useCallback(() => setError(null), []);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    wallet,
    isLinked,
    authStage,
    isLoading,
    error,
    signInWithGoogle,
    linkWallet,
    signOut,
    clearError,
    refreshProfile,
  }), [
    user, profile, wallet, isLinked, authStage,
    isLoading, error,
    signInWithGoogle, linkWallet, signOut, clearError, refreshProfile,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be used inside <AuthProvider>');
  }
  return ctx;
}
