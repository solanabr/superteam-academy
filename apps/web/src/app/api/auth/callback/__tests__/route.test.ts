/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const {
  exchangeCodeForSession,
  signOut,
  selectSingle,
  updateEq,
  isAccountDeleted,
  retryPendingOnchainActions,
} = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  selectSingle: vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
  updateEq: vi.fn().mockResolvedValue({ error: null }),
  isAccountDeleted: vi.fn<(userId: string) => Promise<boolean>>(),
  retryPendingOnchainActions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { exchangeCodeForSession, signOut },
    from: () => ({
      select: () => ({ eq: () => ({ single: selectSingle }) }),
      update: () => ({ eq: updateEq }),
    }),
  }),
}));

// #461 — the route delegates the tombstone check to the shared helper; mocked
// directly here so this test doesn't have to re-mock the admin Supabase client.
vi.mock("@/lib/auth/account-status", () => ({
  isAccountDeleted,
  DELETED_ACCOUNT_REASON: "account_deleted",
}));

vi.mock("@/lib/solana/onchain-queue", () => ({ retryPendingOnchainActions }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { GET } from "../route";

function callbackRequest(
  query = "code=abc123&next=%2Fen%2Fdashboard"
): NextRequest {
  return new NextRequest(`https://app.test/api/auth/callback?${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  exchangeCodeForSession.mockResolvedValue({
    data: {
      session: {
        user: { id: "user-1", user_metadata: {} },
      },
    },
    error: null,
  });
  selectSingle.mockResolvedValue({
    data: { username: "builder1", avatar_url: null },
    error: null,
  });
  isAccountDeleted.mockResolvedValue(false);
});

describe("GET /api/auth/callback — #461 refuse login for deleted accounts", () => {
  it("lets a normal (non-deleted) profile sign in exactly as before", async () => {
    const res = await GET(callbackRequest());

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://app.test/en/dashboard");
    expect(signOut).not.toHaveBeenCalled();
    expect(retryPendingOnchainActions).toHaveBeenCalledWith("user-1");
  });

  it("refuses a tombstoned profile: signs out, never reaches the intended redirect", async () => {
    isAccountDeleted.mockResolvedValue(true);

    const res = await GET(callbackRequest());

    expect(res.status).toBe(307);
    const location = res.headers.get("location")!;
    expect(location).toContain("https://app.test/en");
    expect(location).toContain("error=auth");
    expect(location).toContain("reason=account_deleted");
    // Never redirected to the caller-supplied `next` destination.
    expect(location).not.toContain("/dashboard");

    expect(signOut).toHaveBeenCalledTimes(1);
    // Refused before any profile read/write or onchain-queue retry.
    expect(selectSingle).not.toHaveBeenCalled();
    expect(updateEq).not.toHaveBeenCalled();
    expect(retryPendingOnchainActions).not.toHaveBeenCalled();
  });

  it("checks deletion status for the authenticated user id", async () => {
    await GET(callbackRequest());
    expect(isAccountDeleted).toHaveBeenCalledWith("user-1");
  });
});
