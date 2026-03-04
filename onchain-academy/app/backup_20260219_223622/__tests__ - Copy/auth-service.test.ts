/**
 * __tests__/lib/auth-service.test.ts
 *
 * Unit tests for lib/auth-service.ts
 *
 * What is tested:
 *   - getAuthRedirectURL()     pure env-var logic (all 3 priority branches)
 *   - buildWalletLinkMessage() deterministic structure + content
 *   - AuthService.signInWithGoogle()  Supabase call + error propagation
 *   - AuthService.linkWallet()        guard clauses, sign, fetch, error paths
 *   - AuthService.signOut()           Supabase call + error propagation
 *   - AuthService.getProfile()        happy path + error propagation
 *   - getAuthService()               singleton behaviour
 *
 * Strategy:
 *   External dependencies (Supabase client, fetch, TextEncoder) are fully mocked
 *   via vi.mock and vi.fn() so tests remain deterministic and never hit the network.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

// ── Module-level mock: replace the Supabase browser client factory ────────────
// We do this BEFORE importing auth-service so the mock is in place when
// the module executes its top-level `createSupabaseBrowserClient()` call.

const mockSignInWithOAuth = vi.fn();
const mockSignOut         = vi.fn();
const mockGetUser         = vi.fn();
const mockGetSession      = vi.fn();
const mockFrom            = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSubscriptionUnsubscribe = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithOAuth:    mockSignInWithOAuth,
      signOut:            mockSignOut,
      getUser:            mockGetUser,
      getSession:         mockGetSession,
      onAuthStateChange:  mockOnAuthStateChange,
    },
    from: mockFrom,
  }),
}));

// Import AFTER mocks are registered
import {
  getAuthRedirectURL,
  buildWalletLinkMessage,
  AuthService,
  getAuthService,
} from '@/lib/auth-service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generates a real Ed25519 keypair so we can produce valid signatures in tests.
 * nacl is already a project dependency (used in the API route).
 */
function makeKeypair() {
  const kp = nacl.sign.keyPair();
  return {
    secretKey:  kp.secretKey,
    publicKey:  kp.publicKey,
    address:    bs58.encode(Buffer.from(kp.publicKey)),
  };
}

function signMessage(secretKey: Uint8Array, message: string): Uint8Array {
  const encoded = new TextEncoder().encode(message);
  return nacl.sign.detached(encoded, secretKey);
}

// ─────────────────────────────────────────────────────────────────────────────
// getAuthRedirectURL
// ─────────────────────────────────────────────────────────────────────────────

describe('getAuthRedirectURL', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    // Restore env between tests
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllEnvs();
  });

  it('uses NEXT_PUBLIC_SITE_URL when set (priority 1)', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://superteam-academy.vercel.app');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'should-be-ignored.vercel.app');
    expect(getAuthRedirectURL('/auth/callback')).toBe(
      'https://superteam-academy.vercel.app/auth/callback'
    );
  });

  it('strips a trailing slash from NEXT_PUBLIC_SITE_URL before appending path', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://superteam-academy.vercel.app/');
    expect(getAuthRedirectURL('/auth/callback')).toBe(
      'https://superteam-academy.vercel.app/auth/callback'
    );
  });

  it('uses NEXT_PUBLIC_VERCEL_URL when SITE_URL is absent (priority 2)', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'preview-abc123.vercel.app');
    expect(getAuthRedirectURL('/auth/callback')).toBe(
      'https://preview-abc123.vercel.app/auth/callback'
    );
  });

  it('falls back to localhost:3000 when neither env var is set (priority 3)', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', '');
    expect(getAuthRedirectURL('/auth/callback')).toBe(
      'http://localhost:3000/auth/callback'
    );
  });

  it('uses the default path "/auth/callback" when no path argument is supplied', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', '');
    expect(getAuthRedirectURL()).toBe('http://localhost:3000/auth/callback');
  });

  it('accepts a custom path argument', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com');
    expect(getAuthRedirectURL('/custom/path')).toBe('https://example.com/custom/path');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildWalletLinkMessage
// ─────────────────────────────────────────────────────────────────────────────

describe('buildWalletLinkMessage', () => {
  it('contains the required introductory line', () => {
    const msg = buildWalletLinkMessage('user-uuid-123');
    expect(msg).toContain('Sign this message to link your Solana wallet to Superteam Academy.');
  });

  it('contains the provided user ID in the "Account ID" line', () => {
    const userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const msg = buildWalletLinkMessage(userId);
    expect(msg).toContain(`Account ID: ${userId}`);
  });

  it('contains a Timestamp line with a valid ISO 8601 date', () => {
    const msg = buildWalletLinkMessage('any-id');
    const timestampLine = msg.split('\n').find((l) => l.startsWith('Timestamp:'));
    expect(timestampLine).toBeDefined();
    const isoString = timestampLine!.replace('Timestamp:', '').trim();
    expect(new Date(isoString).toISOString()).toBe(isoString);
  });

  it('includes the safety disclaimer', () => {
    const msg = buildWalletLinkMessage('any-id');
    expect(msg).toContain('This signature does not authorise any transactions.');
  });

  it('is a multi-line string (each section separated by newlines)', () => {
    const msg = buildWalletLinkMessage('any-id');
    expect(msg.includes('\n')).toBe(true);
    expect(msg.split('\n').length).toBeGreaterThan(3);
  });

  it('two calls with the same userId embed the same userId each time', () => {
    const userId = 'stable-user-id';
    const msg1 = buildWalletLinkMessage(userId);
    const msg2 = buildWalletLinkMessage(userId);
    // Both contain the user ID — timestamps will differ by milliseconds
    expect(msg1).toContain(userId);
    expect(msg2).toContain(userId);
  });

  it('generates different messages for different userIds', () => {
    const msg1 = buildWalletLinkMessage('user-a');
    const msg2 = buildWalletLinkMessage('user-b');
    expect(msg1).not.toBe(msg2);
    expect(msg1).toContain('user-a');
    expect(msg2).toContain('user-b');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AuthService
// ─────────────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    vi.clearAllMocks();
  });

  // ── signInWithGoogle ────────────────────────────────────────────────────────

  describe('signInWithGoogle', () => {
    it('calls supabase.auth.signInWithOAuth with provider "google"', async () => {
      mockSignInWithOAuth.mockResolvedValueOnce({ error: null });

      await service.signInWithGoogle();

      expect(mockSignInWithOAuth).toHaveBeenCalledOnce();
      const call = mockSignInWithOAuth.mock.calls[0][0];
      expect(call.provider).toBe('google');
    });

    it('includes prompt: "select_account" in queryParams to force account picker', async () => {
      mockSignInWithOAuth.mockResolvedValueOnce({ error: null });
      await service.signInWithGoogle();
      const opts = mockSignInWithOAuth.mock.calls[0][0].options;
      expect(opts.queryParams.prompt).toBe('select_account');
    });

    it('includes redirectTo pointing to /auth/callback', async () => {
      mockSignInWithOAuth.mockResolvedValueOnce({ error: null });
      await service.signInWithGoogle();
      const opts = mockSignInWithOAuth.mock.calls[0][0].options;
      expect(opts.redirectTo).toContain('/auth/callback');
    });

    it('throws an error when Supabase returns an OAuth error', async () => {
      mockSignInWithOAuth.mockResolvedValueOnce({
        error: { message: 'OAuth provider error' },
      });
      await expect(service.signInWithGoogle()).rejects.toThrow('Google sign-in failed');
    });

    it('wraps the Supabase error message in the thrown Error', async () => {
      mockSignInWithOAuth.mockResolvedValueOnce({
        error: { message: 'provider_not_configured' },
      });
      await expect(service.signInWithGoogle()).rejects.toThrow('provider_not_configured');
    });

    it('resolves without a return value on success', async () => {
      mockSignInWithOAuth.mockResolvedValueOnce({ error: null });
      await expect(service.signInWithGoogle()).resolves.toBeUndefined();
    });
  });

  // ── linkWallet ──────────────────────────────────────────────────────────────

  describe('linkWallet', () => {
    const kp     = makeKeypair();
    const userId = 'test-user-uuid-1234';

    function buildWalletCtx(overrides?: Partial<{
      publicKey: PublicKey | null;
      signMessage: ((msg: Uint8Array) => Promise<Uint8Array>) | undefined;
    }>) {
      return {
        publicKey:    overrides?.publicKey  ?? new PublicKey(kp.publicKey),
        signMessage:  overrides?.signMessage ?? vi.fn().mockImplementation(
          async (msg: Uint8Array) => nacl.sign.detached(msg, kp.secretKey)
        ),
        // Other WalletContextState fields not used by linkWallet
        connected: true,
        connecting: false,
        disconnecting: false,
        disconnect: vi.fn(),
        connect: vi.fn(),
        select: vi.fn(),
        wallet: null,
        wallets: [],
        sendTransaction: vi.fn(),
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    beforeEach(() => {
      // Default: user IS authenticated
      mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
      // Default: fetch succeeds
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('throws when the user is not authenticated (getUser returns null user)', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(service.linkWallet(buildWalletCtx())).rejects.toThrow(
        'You must be signed in with Google before linking a wallet.'
      );
    });

    it('throws when the wallet has no publicKey (not connected)', async () => {
      await expect(
        service.linkWallet(buildWalletCtx({ publicKey: null }))
      ).rejects.toThrow('Wallet is not connected or does not support message signing.');
    });

    it('throws when the wallet does not support signMessage', async () => {
      await expect(
        service.linkWallet(buildWalletCtx({ signMessage: undefined }))
      ).rejects.toThrow('Wallet is not connected or does not support message signing.');
    });

    it('rethrows a user-rejection as a readable "cancelled" error', async () => {
      const walletCtx = buildWalletCtx({
        signMessage: vi.fn().mockRejectedValue(new Error('User rejected the request')),
      });
      await expect(service.linkWallet(walletCtx)).rejects.toThrow('Signature request was cancelled.');
    });

    it('wraps other signing errors with a descriptive message', async () => {
      const walletCtx = buildWalletCtx({
        signMessage: vi.fn().mockRejectedValue(new Error('Hardware error')),
      });
      await expect(service.linkWallet(walletCtx)).rejects.toThrow('Wallet signing failed: Hardware error');
    });

    it('POSTs to /api/auth/link-wallet with walletAddress, signature, and message', async () => {
      const walletCtx = buildWalletCtx();
      await service.linkWallet(walletCtx);

      expect(global.fetch).toHaveBeenCalledOnce();
      const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('/api/auth/link-wallet');
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body);
      expect(body.walletAddress).toBe(kp.address);
      expect(Array.isArray(body.signature)).toBe(true);
      expect(body.signature).toHaveLength(64);
      expect(body.message).toContain(userId);
    });

    it('resolves without error when the API returns 200 OK', async () => {
      await expect(service.linkWallet(buildWalletCtx())).resolves.toBeUndefined();
    });

    it('throws the API error message when the response is not OK', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'This wallet is already linked to a different account' }),
      });
      await expect(service.linkWallet(buildWalletCtx())).rejects.toThrow(
        'This wallet is already linked to a different account'
      );
    });

    it('falls back to status code message when API body has no error field', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });
      await expect(service.linkWallet(buildWalletCtx())).rejects.toThrow('503');
    });

    it('handles an API body that is not valid JSON gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new SyntaxError('bad json'); },
      });
      await expect(service.linkWallet(buildWalletCtx())).rejects.toThrow('Unknown error');
    });

    it('sends the signature as a number[] (JSON-serialisable), not a raw Uint8Array', async () => {
      await service.linkWallet(buildWalletCtx());
      const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      expect(body.signature.every((v: unknown) => typeof v === 'number')).toBe(true);
    });
  });

  // ── signOut ─────────────────────────────────────────────────────────────────

  describe('signOut', () => {
    it('calls supabase.auth.signOut()', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });
      await service.signOut();
      expect(mockSignOut).toHaveBeenCalledOnce();
    });

    it('resolves without error on success', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });
      await expect(service.signOut()).resolves.toBeUndefined();
    });

    it('throws when Supabase returns a sign-out error', async () => {
      mockSignOut.mockResolvedValueOnce({ error: { message: 'Session not found' } });
      await expect(service.signOut()).rejects.toThrow('Sign-out failed: Session not found');
    });
  });

  // ── getProfile ──────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    const mockProfileRow = {
      id:               'user-uuid',
      email:            'test@example.com',
      wallet_address:   null,
      total_xp:         150,
      level:            1,
      display_name:     'Test User',
      preferred_language: 'en',
      streak:           3,
      longest_streak:   5,
      last_activity_date: new Date().toISOString(),
      achievements:     [],
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    };

    it('returns the profile data from Supabase on success', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfileRow, error: null });
      const mockEq     = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const profile = await service.getProfile('user-uuid');
      expect(profile).toEqual(mockProfileRow);
    });

    it('queries the "user_profiles" table', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfileRow, error: null });
      const mockEq     = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      await service.getProfile('user-uuid');
      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
    });

    it('throws when Supabase returns an error', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row not found' },
      });
      const mockEq     = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      await expect(service.getProfile('bad-id')).rejects.toThrow('Failed to load profile: Row not found');
    });
  });

  // ── onAuthStateChange ────────────────────────────────────────────────────────

  describe('onAuthStateChange', () => {
    it('returns an unsubscribe function', () => {
      mockOnAuthStateChange.mockReturnValueOnce({
        data: { subscription: { unsubscribe: mockSubscriptionUnsubscribe } },
      });
      const unsubscribe = service.onAuthStateChange(vi.fn());
      expect(typeof unsubscribe).toBe('function');
    });

    it('calls subscription.unsubscribe() when the returned function is invoked', () => {
      mockOnAuthStateChange.mockReturnValueOnce({
        data: { subscription: { unsubscribe: mockSubscriptionUnsubscribe } },
      });
      const unsubscribe = service.onAuthStateChange(vi.fn());
      unsubscribe();
      expect(mockSubscriptionUnsubscribe).toHaveBeenCalledOnce();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getAuthService (singleton)
// ─────────────────────────────────────────────────────────────────────────────

describe('getAuthService', () => {
  it('returns an AuthService instance', () => {
    const svc = getAuthService();
    expect(svc).toBeInstanceOf(AuthService);
  });

  it('returns the same instance on repeated calls (singleton)', () => {
    const svc1 = getAuthService();
    const svc2 = getAuthService();
    expect(svc1).toBe(svc2);
  });
});
