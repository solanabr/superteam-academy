/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
// The one-time XP sync is guarded by `wallet_xp_synced_at`, which is stamped
// only when a mint actually happens. An account that linked its wallet while
// its XP was 0 therefore still has a NULL stamp, and every later re-link of
// the SAME wallet would mint its whole accrued total on top of the XP the
// award queue has been minting per lesson all along. Re-linking the wallet an
// account already has must change nothing but the wallet_kind hint.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const {
  verifySIWSRequest,
  selectWalletOwner,
  selectOwnProfile,
  selectWalletKind,
  selectXp,
  updateWalletAddress,
  updateWalletKind,
  updateXpSyncedAt,
  mintXpToWallet,
  getUser,
} = vi.hoisted(() => ({
  verifySIWSRequest: vi.fn(),
  selectWalletOwner: vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
  selectOwnProfile: vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
  selectWalletKind: vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
  selectXp: vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
  updateWalletAddress: vi.fn().mockResolvedValue({ error: null }),
  updateWalletKind: vi.fn().mockResolvedValue({ error: null }),
  updateXpSyncedAt: vi.fn().mockResolvedValue({ error: null }),
  mintXpToWallet: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: { SUPABASE_SERVICE_ROLE_KEY: "svc" },
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));
vi.mock("@/lib/solana/verify-siws", () => ({ verifySIWSRequest }));
vi.mock("@/lib/solana/xp-mint", () => ({ mintXpToWallet }));

// Cookie-bound client — only the session read.
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser } }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

// Admin (service-role) client. `recordWalletKind` is deliberately NOT mocked:
// the wallet_kind write is the whole point of a same-wallet re-link, so the
// test asserts the column write itself, through the real first-writer-wins
// helper.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "user_xp") {
        return { select: () => ({ eq: () => ({ single: selectXp }) }) };
      }
      if (table !== "profiles") throw new Error(`unexpected table ${table}`);
      return {
        select: (fields: string) => ({
          eq: () => ({
            neq: () => ({ maybeSingle: selectWalletOwner }),
            single: () =>
              fields === "wallet_kind"
                ? selectWalletKind()
                : selectOwnProfile(),
          }),
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: () => {
            if ("wallet_address" in patch) return updateWalletAddress(patch);
            if ("wallet_kind" in patch) return updateWalletKind(patch);
            if ("wallet_xp_synced_at" in patch) return updateXpSyncedAt(patch);
            throw new Error("unexpected update patch");
          },
        }),
      };
    },
  }),
}));

import { POST } from "../route";

const WALLET = "So11111111111111111111111111111111111111112";
const OTHER_WALLET = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

function linkRequest(walletKind?: unknown): NextRequest {
  return new NextRequest("https://app.test/api/auth/link-wallet", {
    method: "POST",
    headers: { host: "app.test", "content-type": "application/json" },
    body: JSON.stringify({
      message: "app.test wants you to sign in...",
      signature: [1, 2, 3],
      publicKey: WALLET,
      ...(walletKind === undefined ? {} : { walletKind }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  verifySIWSRequest.mockResolvedValue({ success: true });
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  selectWalletOwner.mockResolvedValue({ data: null, error: null });
  selectOwnProfile.mockResolvedValue({
    data: { wallet_address: null, wallet_xp_synced_at: null },
    error: null,
  });
  selectWalletKind.mockResolvedValue({
    data: { wallet_kind: null },
    error: null,
  });
  selectXp.mockResolvedValue({ data: { total_xp: 1200 }, error: null });
  mintXpToWallet.mockResolvedValue({ success: true, signature: "sig_1" });
});

describe("POST /api/auth/link-wallet — first-time link", () => {
  it("links the wallet and mints the accrued XP once", async () => {
    const res = await POST(linkRequest("external"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      walletAddress: WALLET,
      xpSynced: 1200,
      syncSignature: "sig_1",
    });

    expect(updateWalletAddress).toHaveBeenCalledWith({
      wallet_address: WALLET,
    });
    expect(updateWalletKind).toHaveBeenCalledWith({ wallet_kind: "external" });
    expect(mintXpToWallet).toHaveBeenCalledWith(WALLET, 1200);
    expect(updateXpSyncedAt).toHaveBeenCalled();
  });

  it("refuses a wallet that belongs to another account", async () => {
    selectWalletOwner.mockResolvedValue({
      data: { id: "user-2" },
      error: null,
    });

    const res = await POST(linkRequest("embedded"));

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: "walletAlreadyLinked" });
    expect(updateWalletAddress).not.toHaveBeenCalled();
  });

  it("refuses a second, different wallet on an account that already has one", async () => {
    selectOwnProfile.mockResolvedValue({
      data: { wallet_address: OTHER_WALLET, wallet_xp_synced_at: null },
      error: null,
    });

    const res = await POST(linkRequest("embedded"));

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      error: "differentWalletLinked",
    });
    expect(updateWalletAddress).not.toHaveBeenCalled();
    expect(mintXpToWallet).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/link-wallet — same-wallet re-link", () => {
  beforeEach(() => {
    // Already linked to the very wallet signing now, and never stamped —
    // the shape a learner who linked at 0 XP is permanently in.
    selectOwnProfile.mockResolvedValue({
      data: { wallet_address: WALLET, wallet_xp_synced_at: null },
      error: null,
    });
  });

  it("does not re-mint the accrued XP", async () => {
    const res = await POST(linkRequest("embedded"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      walletAddress: WALLET,
      xpSynced: 0,
    });

    expect(mintXpToWallet).not.toHaveBeenCalled();
    expect(updateXpSyncedAt).not.toHaveBeenCalled();
    // The link is already what the update would write.
    expect(updateWalletAddress).not.toHaveBeenCalled();
  });

  it("still records a wallet_kind the account is missing", async () => {
    await POST(linkRequest("embedded"));

    expect(updateWalletKind).toHaveBeenCalledWith({ wallet_kind: "embedded" });
  });

  it("leaves a kind the account already has alone", async () => {
    selectWalletKind.mockResolvedValue({
      data: { wallet_kind: "external" },
      error: null,
    });

    const res = await POST(linkRequest("embedded"));

    expect(res.status).toBe(200);
    expect(updateWalletKind).not.toHaveBeenCalled();
  });
});
