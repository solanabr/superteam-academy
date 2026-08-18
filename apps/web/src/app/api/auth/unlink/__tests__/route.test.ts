/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
// The unlink recovery guard (owner decision 2026-08-17): a wallet-first
// account's synthetic email is undeliverable, so the email bridge can never
// recover it — its LAST OAuth identity is the only path back in if wallet
// access is lost (embedded wallets sign through the OAuth-backed Dynamic
// session). The route must refuse exactly that unlink, and nothing else new.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getUser, profileSingle, unlinkIdentity, profileUpdate } = vi.hoisted(
  () => ({
    getUser: vi.fn(),
    profileSingle: vi.fn(),
    unlinkIdentity: vi.fn(),
    profileUpdate: vi.fn(),
  })
);

vi.mock("@/lib/env.server", () => ({
  serverEnv: { SUPABASE_SERVICE_ROLE_KEY: "svc" },
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser, unlinkIdentity },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: profileSingle }) }),
      update: (values: Record<string, unknown>) => ({
        eq: () => profileUpdate(values),
      }),
    }),
  }),
}));

import { POST } from "../route";

const SYNTHETIC = "Wa11etPubkey@wallet.superteam-lms.local";

function identity(provider: string) {
  return { provider, identity_data: {} };
}

function sessionUser(email: string, providers: string[]) {
  return {
    data: {
      user: {
        id: "user-1",
        email,
        identities: providers.map(identity),
      },
    },
    error: null,
  };
}

function unlinkRequest(provider: string): NextRequest {
  return new NextRequest("https://app.test/api/auth/unlink", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ provider }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  profileSingle.mockResolvedValue({
    data: { wallet_address: "Wa11etPubkey" },
    error: null,
  });
  unlinkIdentity.mockResolvedValue({ error: null });
  profileUpdate.mockResolvedValue({ error: null });
});

describe("POST /api/auth/unlink — recovery guard", () => {
  it("refuses dropping the LAST OAuth identity from a synthetic-email account", async () => {
    getUser.mockResolvedValue(sessionUser(SYNTHETIC, ["google"]));

    const res = await POST(unlinkRequest("google"));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "cannotUnlinkOnlyRecovery",
    });
    expect(unlinkIdentity).not.toHaveBeenCalled();
  });

  it("refuses on a MIXED-CASE synthetic-email domain too (#921)", async () => {
    getUser.mockResolvedValue(
      sessionUser("Wa11etPubkey@Wallet.Superteam-LMS.LOCAL", ["google"])
    );

    const res = await POST(unlinkRequest("google"));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "cannotUnlinkOnlyRecovery",
    });
    expect(unlinkIdentity).not.toHaveBeenCalled();
  });

  it("lets a synthetic-email account with TWO OAuth identities drop one", async () => {
    getUser.mockResolvedValue(sessionUser(SYNTHETIC, ["google", "github"]));

    const res = await POST(unlinkRequest("google"));

    expect(res.status).toBe(200);
    expect(unlinkIdentity).toHaveBeenCalled();
  });

  it("lets a real-email account drop its only OAuth identity (bridge recovers by email)", async () => {
    getUser.mockResolvedValue(sessionUser("human@example.com", ["google"]));

    const res = await POST(unlinkRequest("google"));

    expect(res.status).toBe(200);
    expect(unlinkIdentity).toHaveBeenCalled();
  });

  it("still refuses when only one method exists at all", async () => {
    profileSingle.mockResolvedValue({
      data: { wallet_address: null },
      error: null,
    });
    getUser.mockResolvedValue(sessionUser("human@example.com", ["google"]));

    const res = await POST(unlinkRequest("google"));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "cannotUnlinkLast" });
  });

  it("keeps the wallet permanent regardless", async () => {
    getUser.mockResolvedValue(sessionUser(SYNTHETIC, ["google"]));

    const res = await POST(unlinkRequest("wallet"));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "walletLinkPermanent",
    });
  });

  it("does not mask a wrong-provider 400 behind the guard", async () => {
    // Synthetic email, only GitHub linked, caller asks to unlink Google:
    // the guard must not fire (google is not the sole identity being
    // removed — it isn't linked at all); the provider branch 400s instead.
    getUser.mockResolvedValue(sessionUser(SYNTHETIC, ["github"]));

    const res = await POST(unlinkRequest("google"));

    expect(res.status).toBe(400);
  });
});
