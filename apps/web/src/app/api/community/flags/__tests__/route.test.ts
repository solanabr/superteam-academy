import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

/**
 * #1139. Two things the flag route owes the reporter: "other" is refused
 * without an explanation (an empty `other` card is all a moderator used to
 * get), and a duplicate report / self-report is answered with a code the modal
 * can translate rather than an indistinguishable 500.
 */

const state = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
  insertError: null as { code?: string; message?: string } | null,
  inserted: [] as Record<string, unknown>[],
  rateLimited: false,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: null }),
    },
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        state.inserted.push(row);
        return { error: state.insertError };
      },
    }),
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: async () => ({ count: 0 }) }),
    }),
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: async () => state.rateLimited,
}));

vi.mock("@/lib/community/moderation-notify", () => ({
  notifyModeration: vi.fn(),
}));

import { POST } from "../route";

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/community/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

beforeEach(() => {
  state.user = { id: "u1" };
  state.insertError = null;
  state.inserted = [];
  state.rateLimited = false;
});

describe('POST /api/community/flags — "other" needs details', () => {
  it("400s when reason is other and details are missing", async () => {
    const res = await post({ threadId: "t1", reason: "other" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "detailsRequired" });
    expect(state.inserted).toHaveLength(0);
  });

  it("400s when the details are whitespace or too short to act on", async () => {
    for (const details of ["          ", "  spam  "]) {
      const res = await post({ threadId: "t1", reason: "other", details });
      expect(res.status).toBe(400);
    }
    expect(state.inserted).toHaveLength(0);
  });

  it("accepts other with a real explanation", async () => {
    const res = await post({
      threadId: "t1",
      reason: "other",
      details: "  impersonating a Superteam admin  ",
    });
    expect(res.status).toBe(201);
    expect(state.inserted[0]?.details).toBe("impersonating a Superteam admin");
  });
});

describe("POST /api/community/flags — details trimming", () => {
  it("stores whitespace-only details as null", async () => {
    const res = await post({ threadId: "t1", reason: "spam", details: "   " });
    expect(res.status).toBe(201);
    expect(state.inserted[0]?.details).toBeNull();
  });

  it("stores omitted details as null", async () => {
    await post({ threadId: "t1", reason: "spam" });
    expect(state.inserted[0]?.details).toBeNull();
  });

  it("caps details at 1000 characters", async () => {
    await post({ threadId: "t1", reason: "spam", details: "x".repeat(1500) });
    expect(String(state.inserted[0]?.details)).toHaveLength(1000);
  });
});

describe("POST /api/community/flags — insert failures are classified", () => {
  it("409s alreadyReported on the duplicate-flag unique violation", async () => {
    state.insertError = {
      code: "23505",
      message:
        'duplicate key value violates unique constraint "idx_flags_unique_thread"',
    };
    const res = await post({ threadId: "t1", reason: "spam" });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "alreadyReported" });
  });

  it("403s ownContent on the prevent_self_flag trigger", async () => {
    state.insertError = {
      code: "P0001",
      message: "Cannot flag your own content",
    };
    const res = await post({ answerId: "a1", reason: "spam" });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "ownContent" });
  });

  it("keeps every other insert failure a generic 500", async () => {
    state.insertError = {
      code: "42P01",
      message: 'relation "flags" does not exist',
    };
    const res = await post({ threadId: "t1", reason: "spam" });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to submit flag" });
  });
});

describe("POST /api/community/flags — pre-existing guards still hold", () => {
  it("401s when signed out", async () => {
    state.user = null;
    expect((await post({ threadId: "t1", reason: "spam" })).status).toBe(401);
  });

  it("429s when rate limited", async () => {
    state.rateLimited = true;
    expect((await post({ threadId: "t1", reason: "spam" })).status).toBe(429);
  });

  it("400s an unknown reason", async () => {
    expect((await post({ threadId: "t1", reason: "vibes" })).status).toBe(400);
  });
});
