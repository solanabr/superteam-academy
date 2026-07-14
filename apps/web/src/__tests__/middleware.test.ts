/* eslint-disable import/order -- vi.mock calls must precede importing the module under test. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { getUser, signOut, isAccountDeleted } = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  isAccountDeleted: vi.fn<(userId: string) => Promise<boolean>>(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser, signOut },
  }),
}));

// Pass-through stand-in — the deleted-account backstop under test runs BEFORE
// next-intl, so its own locale-prefixing logic is irrelevant here.
vi.mock("next-intl/middleware", () => ({
  default:
    () =>
    (request: NextRequest): NextResponse =>
      NextResponse.next({ request }),
}));

// #461 — mocked directly so this test doesn't have to re-mock the admin
// Supabase client; see lib/auth/__tests__/account-status.test.ts for that.
vi.mock("@/lib/auth/account-status", () => ({
  isAccountDeleted,
  DELETED_ACCOUNT_REASON: "account_deleted",
}));

import { middleware } from "../middleware";

function pageRequest(path: string): NextRequest {
  return new NextRequest(`https://app.test${path}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: null } });
  isAccountDeleted.mockResolvedValue(false);
});

describe("middleware — #461 deleted-account backstop", () => {
  it("never queries deletion status for anonymous requests (no DB round-trip)", async () => {
    await middleware(pageRequest("/en/courses"));
    expect(isAccountDeleted).not.toHaveBeenCalled();
  });

  it("passes a normal (non-deleted) authenticated user through exactly as before", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const res = await middleware(pageRequest("/en/dashboard"));

    expect(isAccountDeleted).toHaveBeenCalledWith("user-1");
    expect(signOut).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBeNull();
  });

  it("refuses a deleted user on a NON-protected route too: signs out and redirects to landing", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-2" } } });
    isAccountDeleted.mockResolvedValue(true);

    // /en/courses is public — proves the backstop isn't limited to
    // isProtectedRoute() paths (needed for the SIWS/wallet path, which can
    // land on any page after middleware.ts already holds the session cookie).
    const res = await middleware(pageRequest("/en/courses"));

    expect(isAccountDeleted).toHaveBeenCalledWith("user-2");
    expect(signOut).toHaveBeenCalledTimes(1);

    const location = res.headers.get("location");
    expect(location).not.toBeNull();
    const url = new URL(location!);
    expect(url.pathname).toBe("/en");
    expect(url.searchParams.get("error")).toBe("auth");
    expect(url.searchParams.get("reason")).toBe("account_deleted");
  });

  it("refuses a deleted user on a protected route with the same redirect (not the plain unauthenticated-redirect)", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-3" } } });
    isAccountDeleted.mockResolvedValue(true);

    const res = await middleware(pageRequest("/en/dashboard"));

    const url = new URL(res.headers.get("location")!);
    expect(url.searchParams.get("reason")).toBe("account_deleted");
  });
});
