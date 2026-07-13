/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { getUser, signOut, update, eq, isRateLimited } = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<unknown>>(),
  signOut: vi.fn(),
  // (table, payload) — the route now writes two tables, and WHICH table gets
  // which payload is the property under test.
  update: vi.fn<(table: string, payload: unknown) => void>(),
  eq: vi.fn<() => Promise<{ error: unknown }>>(),
  isRateLimited: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser, signOut } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      update: (payload: unknown) => {
        update(table, payload);
        return { eq };
      },
    }),
  }),
}));

vi.mock("@/lib/rate-limit", () => ({ isRateLimited }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../route";

type Payload = Record<string, unknown>;
const payloadFor = (table: string): Payload =>
  update.mock.calls.find((c) => c[0] === table)![1] as Payload;

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  eq.mockResolvedValue({ error: null });
  isRateLimited.mockResolvedValue(false);
});

describe("account deletion anonymises the profile", () => {
  it("nulls every external identifier, not just the display fields (#410)", async () => {
    const res = await POST();
    expect(res.status).toBe(200);

    const p = payloadFor("profiles");
    // These three are what actually re-identify a person. wallet_address also
    // carries a UNIQUE constraint, so retaining it pins the wallet to a
    // tombstoned row. Scrubbing bio/avatar while keeping these anonymises nothing.
    expect(p).toHaveProperty("wallet_address", null);
    expect(p).toHaveProperty("google_id", null);
    expect(p).toHaveProperty("github_id", null);
  });

  it("scrubs the wallet from enrollments too, not just profiles", async () => {
    await POST();
    // enrollments carries its own wallet_address copy. Scrubbing only `profiles`
    // would leave the wallet→user_id join intact one table over — the deletion
    // would be cosmetic.
    expect(payloadFor("enrollments")).toEqual({ wallet_address: null });
  });

  it("scrubs the display fields and tombstones the row", async () => {
    await POST();

    const p = payloadFor("profiles");
    expect(p.bio).toBeNull();
    expect(p.avatar_url).toBeNull();
    expect(p.social_links).toBeNull();
    expect(p.is_public).toBe(false);
    expect(p.deleted_at).toEqual(expect.any(String));
    expect(p.username).toMatch(/^deleted-user-[0-9a-f]{8}$/);
  });

  it("scopes both writes to the session-derived id, never client input", async () => {
    await POST();
    expect(eq).toHaveBeenCalledWith("id", "user-1");
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("reports a failed enrollment scrub instead of claiming success", async () => {
    // The profile write lands, the enrollment scrub fails. Returning 200 here
    // would tell the user their wallet is gone while it is still joinable.
    eq.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({
      error: { message: "boom" },
    });

    const res = await POST();

    expect(res.status).toBe(500);
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
