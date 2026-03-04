/**
 * lib/auth-service.ts
 *
 * Unified authentication service covering:
 *   1. Google OAuth via Supabase (email-based identity)
 *   2. Solana wallet message signing (proof-of-ownership)
 *   3. Wallet ↔ profile linking (persisted in Supabase)
 *   4. Sign-out (clears Supabase session)
 *
 * ── Security model ───────────────────────────────────────────────────────────
 *
 *  Google sign-in
 *    Supabase handles the OAuth handshake. On success, a JWT is stored in
 *    cookies. The DB trigger `handle_new_auth_user` auto-creates the profile.
 *
 *  Wallet linking
 *    1. User is already authenticated via Google (verified Supabase JWT).
 *    2. User connects a Solana wallet and signs a deterministic message that
 *       includes their Supabase user ID. This binds the signature to the
 *       specific account — prevents replay attacks across accounts.
 *    3. The signature + wallet address are sent to /api/auth/link-wallet.
 *    4. The API route verifies:
 *         a. Supabase JWT is valid → extracts the true user ID.
 *         b. Ed25519 signature is valid → proves wallet ownership.
 *    5. On success, the API calls `link_wallet_to_profile(userId, address)`.
 *
 *  This design means:
 *    - XP/progress can't be stolen by faking a wallet address.
 *    - A wallet can only be linked to one account (DB UNIQUE constraint).
 *    - The browser never touches the service role key.
 */

import type { WalletContextState } from '@solana/wallet-adapter-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// ── Redirect URL ──────────────────────────────────────────────────────────────

/**
 * Derives the correct post-OAuth redirect URL for the current environment.
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL env var  (set this on Vercel to your production URL)
 *   2. NEXT_PUBLIC_VERCEL_URL        (auto-set by Vercel on preview branches)
 *   3. localhost:3000                (local dev fallback)
 */
export function getAuthRedirectURL(path = '/auth/callback'): string {
  let base: string;

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    base = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    base = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  } else {
    base = 'http://localhost:3000';
  }

  return `${base}${path}`;
}

// ── Wallet signing message ─────────────────────────────────────────────────────

/**
 * Generates the message the user must sign to prove wallet ownership.
 * Including the userId prevents the signature from being reused to link
 * the same wallet to a different account.
 */
export function buildWalletLinkMessage(userId: string): string {
  return [
    'Sign this message to link your Solana wallet to Superteam Academy.',
    '',
    `Account ID: ${userId}`,
    `Timestamp:  ${new Date().toISOString()}`,
    '',
    'This signature does not authorise any transactions.',
  ].join('\n');
}

// ── Auth service ──────────────────────────────────────────────────────────────

export class AuthService {
  private supabase = createSupabaseBrowserClient();

  // ── Google OAuth ─────────────────────────────────────────────────────────────

  /**
   * Initiates the Google OAuth flow. Redirects the browser to Google's
   * consent screen. On success, Google redirects back to /auth/callback
   * which exchanges the code for a session and then redirects to /dashboard.
   */
  async signInWithGoogle(): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectURL('/auth/callback'),
        queryParams: {
          // Force the account picker every time so users can switch accounts.
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    });

    if (error) {
      throw new Error(`Google sign-in failed: ${error.message}`);
    }
    // Browser redirects — no return value needed.
  }

  // ── Wallet linking ────────────────────────────────────────────────────────────

  /**
   * Links a connected Solana wallet to the authenticated user's profile.
   *
   * Steps:
   *   1. Verify the user is signed in via Google.
   *   2. Request a message signature from the wallet (proves ownership).
   *   3. POST to /api/auth/link-wallet (server verifies sig + links in DB).
   *
   * Throws if:
   *   - User is not authenticated
   *   - Wallet is not connected or doesn't support message signing
   *   - User rejects the signature request
   *   - Server-side verification fails
   */
  async linkWallet(walletCtx: WalletContextState): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in with Google before linking a wallet.');
    }

    if (!walletCtx.publicKey || !walletCtx.signMessage) {
      throw new Error('Wallet is not connected or does not support message signing.');
    }

    // Build and encode the message
    const message = buildWalletLinkMessage(user.id);
    const encodedMessage = new TextEncoder().encode(message);

    // Request signature — this pops the wallet's approval modal
    let signature: Uint8Array;
    try {
      signature = await walletCtx.signMessage(encodedMessage);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('User rejected')) {
        throw new Error('Signature request was cancelled.');
      }
      throw new Error(`Wallet signing failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Send to the API route for server-side verification + DB update
    const response = await fetch('/api/auth/link-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: walletCtx.publicKey.toBase58(),
        signature:     Array.from(signature),   // Uint8Array → JSON-serialisable
        message,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(body.error ?? `Link failed with status ${response.status}`);
    }
  }

  // ── Sign out ──────────────────────────────────────────────────────────────────

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw new Error(`Sign-out failed: ${error.message}`);
  }

  // ── Session helpers ───────────────────────────────────────────────────────────

  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  async getUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  /** Fetch the full user_profiles row for the currently authenticated user. */
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new Error(`Failed to load profile: ${error.message}`);
    return data;
  }

  /**
   * Subscribe to Supabase auth state changes.
   * Returns the unsubscribe function — call it in a cleanup effect.
   */
  onAuthStateChange(
    callback: Parameters<typeof this.supabase.auth.onAuthStateChange>[0]
  ) {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────

let _authService: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!_authService) _authService = new AuthService();
  return _authService;
}
