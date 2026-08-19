/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  from: vi.fn(),
  createClientThrows: { value: false },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => {
    if (h.createClientThrows.value) throw new Error("env missing");
    return { auth: { getUser: h.getUser } };
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: h.from }),
}));

import {
  requireAdmin,
  requireAdminAuth,
  AdminAuthError,
} from "@/lib/admin/auth";

function allowlistReturns(result: {
  data: { user_id: string } | null;
  error: { message: string } | null;
}): void {
  h.from.mockReturnValue({
    select: () => ({
      eq: () => ({ maybeSingle: h.maybeSingle }),
    }),
  });
  h.maybeSingle.mockResolvedValue(result);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.createClientThrows.value = false;
  h.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  allowlistReturns({ data: { user_id: "user-1" }, error: null });
});

describe("requireAdmin — fail-closed allowlist check", () => {
  it("returns the userId for a session whose user has an admin_users row", async () => {
    await expect(requireAdmin()).resolves.toEqual({ userId: "user-1" });
    expect(h.from).toHaveBeenCalledWith("admin_users");
  });

  it("returns null with no session", async () => {
    h.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireAdmin()).resolves.toBeNull();
    // Never hits the DB without a verified user.
    expect(h.from).not.toHaveBeenCalled();
  });

  it("returns null when getUser reports an error, even if a user object rides along", async () => {
    h.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: { message: "token expired" },
    });
    await expect(requireAdmin()).resolves.toBeNull();
  });

  it("returns null for a session with no admin_users row", async () => {
    allowlistReturns({ data: null, error: null });
    await expect(requireAdmin()).resolves.toBeNull();
  });

  it("returns null on a DB error (fail closed, not open)", async () => {
    allowlistReturns({ data: null, error: { message: "db down" } });
    await expect(requireAdmin()).resolves.toBeNull();
  });

  it("returns null when the DB read throws", async () => {
    h.maybeSingle.mockRejectedValue(new Error("network"));
    await expect(requireAdmin()).resolves.toBeNull();
  });

  it("returns null when the Supabase client cannot even be constructed (env missing)", async () => {
    h.createClientThrows.value = true;
    await expect(requireAdmin()).resolves.toBeNull();
  });
});

describe("requireAdminAuth — route-facing wrapper", () => {
  const sameOriginPost = new Request("https://app.test/api/admin/x", {
    method: "POST",
    headers: { "sec-fetch-site": "same-origin" },
  });

  it("returns the acting admin's userId for an allowlisted session", async () => {
    await expect(requireAdminAuth(sameOriginPost)).resolves.toEqual({
      userId: "user-1",
    });
  });

  it("throws AdminAuthError for a non-admin session", async () => {
    allowlistReturns({ data: null, error: null });
    await expect(requireAdminAuth(sameOriginPost)).rejects.toBeInstanceOf(
      AdminAuthError
    );
  });

  it("throws AdminAuthError for a cross-site state-changing request BEFORE touching the DB", async () => {
    const crossSite = new Request("https://app.test/api/admin/x", {
      method: "POST",
      headers: { "sec-fetch-site": "cross-site" },
    });
    await expect(requireAdminAuth(crossSite)).rejects.toBeInstanceOf(
      AdminAuthError
    );
    expect(h.from).not.toHaveBeenCalled();
  });
});
