/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { getUser, signOut, update, eq, isRateLimited } = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<unknown>>(),
  signOut: vi.fn(),
  update: vi.fn(),
  eq: vi.fn<() => Promise<{ error: null }>>(),
  isRateLimited: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser, signOut } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      update: (payload: unknown) => {
        update(payload);
        return { eq };
      },
    }),
  }),
}));

vi.mock("@/lib/rate-limit", () => ({ isRateLimited }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../route";

type ProfileUpdate = Record<string, unknown>;
const payload = (): ProfileUpdate => update.mock.calls[0]![0] as ProfileUpdate;

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  eq.mockResolvedValue({ error: null });
  isRateLimited.mockResolvedValue(false);
});

describe("account deletion anonymises the profile", () => {
  it("nulls wallet_address (#410)", async () => {
    const res = await POST();

    expect(res.status).toBe(200);
    // wallet_address has a UNIQUE constraint. Retaining it on a tombstoned row
    // would strand the wallet forever — unlinkable by its owner (the row is
    // soft-deleted) and unclaimable by anyone else (the constraint still holds).
    // It is also the strongest identifier on the row, so keeping it would defeat
    // the anonymisation the rest of this payload performs.
    expect(payload()).toHaveProperty("wallet_address", null);
  });

  it("scrubs every identifying column and tombstones the row", async () => {
    await POST();

    const p = payload();
    expect(p.bio).toBeNull();
    expect(p.avatar_url).toBeNull();
    expect(p.social_links).toBeNull();
    expect(p.is_public).toBe(false);
    expect(p.deleted_at).toEqual(expect.any(String));
    expect(p.username).toMatch(/^deleted-user-[0-9a-f]{8}$/);
  });

  it("scopes the write to the session-derived id, never client input", async () => {
    await POST();
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("does not write when unauthenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST();

    expect(res.status).toBe(401);
    expect(update).not.toHaveBeenCalled();
  });

  it("does not write when rate limited", async () => {
    isRateLimited.mockResolvedValue(true);

    const res = await POST();

    expect(res.status).toBe(429);
    expect(update).not.toHaveBeenCalled();
  });
});
