/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  AdminAuthError: class AdminAuthError extends Error {},
  state: { authThrows: false },
  setPlatformFrozen:
    vi.fn<(frozen: boolean, reason?: string) => Promise<void>>(),
  getPlatformFreezeState: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: h.AdminAuthError,
  adminUnauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  requireAdminAuth: vi.fn(() => {
    if (h.state.authThrows) throw new h.AdminAuthError();
  }),
}));

vi.mock("@/lib/platform/freeze", () => ({
  setPlatformFrozen: (...args: [boolean, string?]) =>
    h.setPlatformFrozen(...args),
  getPlatformFreezeState: () => h.getPlatformFreezeState(),
}));

const post = async (body: unknown): Promise<Response> => {
  const { POST } = await import("../route");
  return POST(
    new Request("https://app.test/api/admin/freeze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest
  );
};

const get = async (): Promise<Response> => {
  const { GET } = await import("../route");
  return GET(
    new Request("https://app.test/api/admin/freeze") as unknown as NextRequest
  );
};

beforeEach(() => {
  h.state.authThrows = false;
  h.setPlatformFrozen.mockReset();
  h.setPlatformFrozen.mockResolvedValue(undefined);
  h.getPlatformFreezeState.mockReset();
  h.getPlatformFreezeState.mockResolvedValue({
    frozen: false,
    reason: null,
    updatedAt: null,
  });
});

describe("POST /api/admin/freeze — admin-gated", () => {
  it("401s without an admin session and never writes the flag", async () => {
    h.state.authThrows = true;

    const res = await post({ frozen: true });

    expect(res.status).toBe(401);
    expect(h.setPlatformFrozen).not.toHaveBeenCalled();
  });

  it("sets the freeze when authed", async () => {
    const res = await post({ frozen: true, reason: "v-next reset" });

    expect(res.status).toBe(200);
    expect(h.setPlatformFrozen).toHaveBeenCalledWith(true, "v-next reset");
    const body = (await res.json()) as { frozen: boolean };
    expect(body.frozen).toBe(true);
  });

  it("clears the freeze when authed", async () => {
    const res = await post({ frozen: false });

    expect(res.status).toBe(200);
    expect(h.setPlatformFrozen).toHaveBeenCalledWith(false, undefined);
  });

  it("400s when `frozen` is missing / not a boolean, without writing", async () => {
    const res = await post({ reason: "oops" });

    expect(res.status).toBe(400);
    expect(h.setPlatformFrozen).not.toHaveBeenCalled();
  });
});

describe("GET /api/admin/freeze — admin-gated", () => {
  it("401s without an admin session", async () => {
    h.state.authThrows = true;

    const res = await get();

    expect(res.status).toBe(401);
    expect(h.getPlatformFreezeState).not.toHaveBeenCalled();
  });

  it("returns the current freeze state when authed", async () => {
    h.getPlatformFreezeState.mockResolvedValue({
      frozen: true,
      reason: "maintenance",
      updatedAt: "2026-07-15T00:00:00Z",
    });

    const res = await get();

    expect(res.status).toBe(200);
    const body = (await res.json()) as { frozen: boolean; reason: string };
    expect(body.frozen).toBe(true);
    expect(body.reason).toBe("maintenance");
  });
});
