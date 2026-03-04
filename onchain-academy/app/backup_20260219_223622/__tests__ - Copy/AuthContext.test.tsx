/**
 * __tests__/contexts/AuthContext.test.tsx
 *
 * Unit tests for contexts/AuthContext.tsx
 *
 * What is tested:
 *   - authStage state machine transitions  (all 5 states)
 *   - useAuth() guard — throws outside provider
 *   - signInWithGoogle() — delegates to AuthService, sets error on failure
 *   - linkWallet() — delegates to AuthService, refreshes profile, sets error
 *   - signOut() — clears user + profile, sets error on failure
 *   - clearError() — resets error state to null
 *   - isLinked — derived from profile.wallet_address
 *   - wallet — mirrors wallet adapter publicKey
 *   - isLoading — true during bootstrap, false after
 *
 * Mocking strategy
 * ─────────────────
 * • @solana/wallet-adapter-react (useWallet)  — vi.mock()
 * • @/lib/supabase/client                     — vi.mock()
 * • @/lib/auth-service                        — vi.mock()
 *
 * We render the AuthProvider with React Testing Library and use
 * `renderHook` + `act` to trigger state transitions deterministically.
 *
 * Run: npm test -- AuthContext
 */

import React from 'react';
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { PublicKey } from '@solana/web3.js';

// ── Module mocks (must be before any imports that depend on them) ─────────────

const mockSignInWithOAuth   = vi.fn();
const mockAuthSignOut       = vi.fn();
const mockGetUser           = vi.fn();
const mockAuthStateChange   = vi.fn();
const mockProfileFetch      = vi.fn();
const mockLinkWallet        = vi.fn();
const mockAuthServiceSignIn = vi.fn();
const mockAuthServiceSignOut = vi.fn();
const mockAuthServiceLink   = vi.fn();
const mockGetProfile        = vi.fn();
const subscriptionUnsubscribe = vi.fn();

// Mock the Supabase browser client
vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      getUser:           mockGetUser,
      onAuthStateChange: mockAuthStateChange,
    },
  }),
}));

// Mock the auth service singleton
vi.mock('@/lib/auth-service', () => ({
  getAuthService: () => ({
    signInWithGoogle: mockAuthServiceSignIn,
    signOut:          mockAuthServiceSignOut,
    linkWallet:       mockAuthServiceLink,
    getProfile:       mockGetProfile,
    onAuthStateChange: (cb: () => void) => {
      // Store the callback so tests can trigger it
      mockAuthStateChange.mockImplementation(() => {
        const unsub = subscriptionUnsubscribe;
        return () => unsub();
      });
      return () => subscriptionUnsubscribe();
    },
  }),
}));

// Default: wallet not connected
const mockUseWallet = vi.fn(() => ({
  publicKey:    null,
  connected:    false,
  connecting:   false,
  signMessage:  undefined,
  disconnect:   vi.fn(),
}));

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockUseWallet(),
}));

// Import AFTER mocks
import { AuthProvider, useAuth, type AuthStage } from '@/contexts/AuthContext';

// ─── Test wrapper ─────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const MOCK_USER = {
  id:    'user-uuid-1234',
  email: 'test@example.com',
};

const MOCK_PROFILE_LINKED = {
  id:             'user-uuid-1234',
  wallet_address: 'So11111111111111111111111111111111111111112',
  total_xp:       150,
  display_name:   'Test User',
};

const MOCK_PROFILE_UNLINKED = {
  ...MOCK_PROFILE_LINKED,
  wallet_address: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// useAuth outside provider
// ─────────────────────────────────────────────────────────────────────────────

describe('useAuth', () => {
  it('throws when called outside of AuthProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useAuth();
      } catch (e) {
        return { error: e };
      }
    });
    expect((result.current as { error: Error }).error).toBeInstanceOf(Error);
    expect((result.current as { error: Error }).error.message).toContain('AuthProvider');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// authStage state machine
// ─────────────────────────────────────────────────────────────────────────────

describe('authStage state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: auth state change subscription
    mockAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: subscriptionUnsubscribe } },
    });
  });

  it('starts in "loading" state during bootstrap', async () => {
    // getUser never resolves — stays loading
    mockGetUser.mockReturnValue(new Promise(() => {}));
    mockUseWallet.mockReturnValue({ publicKey: null, connected: false, signMessage: undefined, disconnect: vi.fn() });

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.authStage).toBe('loading');
  });

  it('transitions to "unauthenticated" when no user and no wallet after bootstrap', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    mockUseWallet.mockReturnValue({ publicKey: null, connected: false, signMessage: undefined, disconnect: vi.fn() });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authStage).toBe('unauthenticated'));
  });

  it('transitions to "google_only" when user is authenticated but wallet is not linked', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: MOCK_USER }, error: null });
    mockGetProfile.mockResolvedValueOnce(MOCK_PROFILE_UNLINKED);
    mockUseWallet.mockReturnValue({ publicKey: null, connected: false, signMessage: undefined, disconnect: vi.fn() });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authStage).toBe('google_only'));
  });

  it('transitions to "fully_linked" when user is authenticated AND wallet_address is set', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: MOCK_USER }, error: null });
    mockGetProfile.mockResolvedValueOnce(MOCK_PROFILE_LINKED);
    mockUseWallet.mockReturnValue({ publicKey: null, connected: false, signMessage: undefined, disconnect: vi.fn() });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authStage).toBe('fully_linked'));
  });

  it('transitions to "wallet_only" when wallet is connected but no Google session', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const pk = new PublicKey('So11111111111111111111111111111111111111112');
    mockUseWallet.mockReturnValue({ publicKey: pk, connected: true, signMessage: vi.fn(), disconnect: vi.fn() });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authStage).toBe('wallet_only'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isLinked
// ─────────────────────────────────────────────────────────────────────────────

describe('isLinked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: subscriptionUnsubscribe } },
    });
    mockUseWallet.mockReturnValue({ publicKey: null, connected: false, signMessage: undefined, disconnect: vi.fn() });
  });

  it('is false when profile.wallet_address is null', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: MOCK_USER }, error: null });
    mockGetProfile.mockResolvedValueOnce(MOCK_PROFILE_UNLINKED);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLinked).toBe(false);
  });

  it('is true when profile.wallet_address is populated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: MOCK_USER }, error: null });
    mockGetProfile.mockResolvedValueOnce(MOCK_PROFILE_LINKED);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLinked).toBe(true);
  });

  it('is false before the profile has loaded', async () => {
    mockGetUser.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLinked).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// signInWithGoogle action
// ─────────────────────────────────────────────────────────────────────────────

describe('signInWithGoogle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: subscriptionUnsubscribe } },
    });
    mockUseWallet.mockReturnValue({ publicKey: null, connected: false, signMessage: undefined, disconnect: vi.fn() });
  });

  it('delegates to authService.signInWithGoogle()', async () => {
    mockAuthServiceSignIn.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authStage).toBe('unauthenticated'));

    await act(() => result.current.signInWithGoogle());
    expect(mockAuthServiceSignIn).toHaveBeenCalledOnce();
  });

  it('sets error state when signInWithGoogle throws', async () => {
    mockAuthServiceSignIn.mockRejectedValueOnce(new Error('OAuth error'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authStage).toBe('unauthenticated'));

    await act(() => result.current.signInWithGoogle());
    expect(result.current.error).toBe('OAuth error');
  });

  it('clears any existing error before attempting sign-in', async () => {
    // First call fails, setting error
    mockAuthServiceSignIn.mockRejectedValueOnce(new Error('First error'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authStage).toBe('unauthenticated'));
    await act(() => result.current.signInWithGoogle());
    expect(result.current.error).toBe('First error');

    // Second call succeeds — error should be cleared before the call
    mockAuthServiceSignIn.mockResolvedValueOnce(undefined);
    await act(() => result.current.signInWithGoogle());
    expect(result.current.error).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// signOut action
// ─────────────────────────────────────────────────────────────────────────────

describe('signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null });
    mockGetProfile.mockResolvedValue(MOCK_PROFILE_UNLINKED);
    mockAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: subscriptionUnsubscribe } },
    });
    mockUseWallet.mockReturnValue({ publicKey: null, connected: false, signMessage: undefined, disconnect: vi.fn() });
  });

  it('delegates to authService.signOut()', async () => {
    mockAuthServiceSignOut.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authStage).toBe('google_only'));

    await act(() => result.current.signOut());
    expect(mockAuthServiceSignOut).toHaveBeenCalledOnce();
  });

  it('clears the user and profile after successful sign-out', async () => {
    mockAuthServiceSignOut.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toBeDefined());

    await act(() => result.current.signOut());
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('sets error state when signOut throws', async () => {
    mockAuthServiceSignOut.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authStage).toBe('google_only'));

    await act(() => result.current.signOut());
    expect(result.current.error).toBe('Network error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// linkWallet action
// ─────────────────────────────────────────────────────────────────────────────

describe('linkWallet', () => {
  const pk = new PublicKey('So11111111111111111111111111111111111111112');

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null });
    mockGetProfile.mockResolvedValue(MOCK_PROFILE_UNLINKED);
    mockAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: subscriptionUnsubscribe } },
    });
    mockUseWallet.mockReturnValue({
      publicKey: pk, connected: true, signMessage: vi.fn(), disconnect: vi.fn(),
    });
  });

  it('delegates to authService.linkWallet() with the wallet context', async () => {
    mockAuthServiceLink.mockResolvedValueOnce(undefined);
    mockGetProfile.mockResolvedValue(MOCK_PROFILE_LINKED); // after linking

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.linkWallet());
    expect(mockAuthServiceLink).toHaveBeenCalledOnce();
  });

  it('refreshes the profile after a successful link', async () => {
    mockAuthServiceLink.mockResolvedValueOnce(undefined);
    // First call (bootstrap): unlinked; second call (post-link refresh): linked
    mockGetProfile
      .mockResolvedValueOnce(MOCK_PROFILE_UNLINKED)
      .mockResolvedValueOnce(MOCK_PROFILE_LINKED);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLinked).toBe(false);

    await act(() => result.current.linkWallet());
    await waitFor(() => expect(result.current.isLinked).toBe(true));
  });

  it('sets error state when linkWallet throws', async () => {
    mockAuthServiceLink.mockRejectedValueOnce(new Error('Signature cancelled'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.linkWallet());
    expect(result.current.error).toBe('Signature cancelled');
  });

  it('sets isLoading to false after a failed linkWallet call', async () => {
    mockAuthServiceLink.mockRejectedValueOnce(new Error('Failed'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.linkWallet());
    expect(result.current.isLoading).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// clearError action
// ─────────────────────────────────────────────────────────────────────────────

describe('clearError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: subscriptionUnsubscribe } },
    });
    mockUseWallet.mockReturnValue({ publicKey: null, connected: false, signMessage: undefined, disconnect: vi.fn() });
    mockAuthServiceSignIn.mockRejectedValue(new Error('Some error'));
  });

  it('sets error to null when called after an error has been set', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authStage).toBe('unauthenticated'));

    // Cause an error
    await act(() => result.current.signInWithGoogle());
    expect(result.current.error).not.toBeNull();

    // Clear it
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// wallet mirroring
// ─────────────────────────────────────────────────────────────────────────────

describe('wallet property', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: subscriptionUnsubscribe } },
    });
  });

  it('is null when the wallet adapter has no publicKey', async () => {
    mockUseWallet.mockReturnValue({ publicKey: null, connected: false, signMessage: undefined, disconnect: vi.fn() });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.wallet).toBeNull();
  });

  it('equals the wallet adapter publicKey when the wallet is connected', async () => {
    const pk = new PublicKey('So11111111111111111111111111111111111111112');
    mockUseWallet.mockReturnValue({ publicKey: pk, connected: true, signMessage: vi.fn(), disconnect: vi.fn() });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.wallet?.toBase58()).toBe(pk.toBase58());
  });
});
