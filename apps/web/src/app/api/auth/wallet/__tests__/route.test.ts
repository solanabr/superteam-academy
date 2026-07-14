/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const {
  verifySIWSRequest,
  getUserById,
  createUser,
  generateLink,
  verifyOtp,
  signOut,
  selectExistingProfile,
  selectLinkedWallet,
  selectUsername,
  updateWalletAddress,
  updateUsername,
  isAccountDeleted,
  retryPendingOnchainActions,
  generateWalletName,
} = vi.hoisted(() => ({
  verifySIWSRequest: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  generateLink: vi.fn(),
  verifyOtp: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  selectExistingProfile:
    vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
  selectLinkedWallet: vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
  selectUsername: vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
  updateWalletAddress: vi.fn().mockResolvedValue({ error: null }),
  updateUsername: vi.fn().mockResolvedValue({ error: null }),
  isAccountDeleted: vi.fn<(userId: string) => Promise<boolean>>(),
  retryPendingOnchainActions: vi.fn().mockResolvedValue(undefined),
  generateWalletName: vi.fn().mockReturnValue("StakedFalcon"),
}));

vi.mock("@/lib/solana/verify-siws", () => ({ verifySIWSRequest }));

// Admin (service-role) client — used for user management + all `profiles`
// reads/writes. Branches on the `select`ed fields / `update`d patch since the
// route makes several distinct `.from("profiles")` calls.
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table !== "profiles") throw new Error(`unexpected table ${table}`);
      return {
        select: (fields: string) => ({
          eq: () => {
            if (fields === "id") return { maybeSingle: selectExistingProfile };
            if (fields === "wallet_address")
              return { single: selectLinkedWallet };
            if (fields === "username") return { single: selectUsername };
            throw new Error(`unexpected select fields "${fields}"`);
          },
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: () => {
            if ("wallet_address" in patch) return updateWalletAddress(patch);
            if ("username" in patch) return updateUsername(patch);
            throw new Error("unexpected update patch");
          },
        }),
      };
    },
    auth: {
      admin: { getUserById, createUser, generateLink },
    },
  }),
}));

// Anon (cookie-bound) client — used only for verifyOtp() (session creation)
// and, for #489, signOut() when the resolved account turns out to be deleted.
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { verifyOtp, signOut },
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    set: () => {},
  }),
}));

vi.mock("@/lib/utils/generate-wallet-name", () => ({ generateWalletName }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));
vi.mock("@/lib/solana/onchain-queue", () => ({ retryPendingOnchainActions }));

// #489 — the route delegates the tombstone check to the shared helper (added
// in #488/#461); mocked directly so this test doesn't have to re-mock the
// admin Supabase client just to exercise `profiles.deleted_at`.
vi.mock("@/lib/auth/account-status", () => ({ isAccountDeleted }));

import { POST } from "../route";

function walletRequest(): NextRequest {
  return new NextRequest("https://app.test/api/auth/wallet", {
    method: "POST",
    headers: { host: "app.test", "content-type": "application/json" },
    body: JSON.stringify({
      message: "app.test wants you to sign in...",
      signature: [1, 2, 3],
      publicKey: "WalletPubkey11111111111111111111111111111",
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  verifySIWSRequest.mockResolvedValue({ success: true });
  // No existing profile keyed by wallet_address — true for a genuinely new
  // wallet AND for a deleted account re-authenticating (#410 nulls
  // wallet_address on deletion, so this lookup can never find the tombstoned
  // row by wallet address).
  selectExistingProfile.mockResolvedValue({ data: null, error: null });
  createUser.mockResolvedValue({ error: null });
  generateLink.mockResolvedValue({
    data: { properties: { hashed_token: "tok_123" } },
    error: null,
  });
  verifyOtp.mockResolvedValue({
    data: { session: { user: { id: "user-1" } } },
    error: null,
  });
  isAccountDeleted.mockResolvedValue(false);
  selectLinkedWallet.mockResolvedValue({
    data: { wallet_address: null },
    error: null,
  });
  selectUsername.mockResolvedValue({
    data: { username: "user_abc123" },
    error: null,
  });
});

describe("POST /api/auth/wallet — #489 refuse wallet_address write for deleted accounts", () => {
  it("lets a normal (non-deleted) wallet login proceed exactly as before", async () => {
    const res = await POST(walletRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });

    expect(updateWalletAddress).toHaveBeenCalledWith({
      wallet_address: "WalletPubkey11111111111111111111111111111",
    });
    expect(signOut).not.toHaveBeenCalled();
    expect(retryPendingOnchainActions).toHaveBeenCalledWith("user-1");
  });

  it("refuses a tombstoned account: no wallet_address write, signs out, 403 + accountDeleted", async () => {
    isAccountDeleted.mockResolvedValue(true);

    const res = await POST(walletRequest());

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "accountDeleted" });

    // The write this bug was about must never happen for a deleted account.
    expect(updateWalletAddress).not.toHaveBeenCalled();
    // Refused before any other profile read/write past the deletion check.
    expect(selectLinkedWallet).not.toHaveBeenCalled();
    expect(selectUsername).not.toHaveBeenCalled();
    expect(updateUsername).not.toHaveBeenCalled();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(retryPendingOnchainActions).not.toHaveBeenCalled();
  });

  it("checks deletion status for the resolved (post-verifyOtp) user id", async () => {
    await POST(walletRequest());
    expect(isAccountDeleted).toHaveBeenCalledWith("user-1");
  });
});
