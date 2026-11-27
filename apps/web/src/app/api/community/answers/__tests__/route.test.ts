import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

/**
 * The route checks the thread before inserting, but a lock or removal can land
 * between that check and the insert. The database refuses the insert with its own
 * code, and the learner should get the same 403 as the pre-check, not a 500. Any
 * other insert failure stays a 500, so a broken grant isn't reported as a closed
 * thread.
 */

const state = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
  thread: { id: "t1", is_locked: false } as {
    id: string;
    is_locked: boolean;
  } | null,
  insertError: null as { code?: string; message?: string } | null,
  inserted: [] as Record<string, unknown>[],
  xpAwarded: 0,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: null }),
    },
    from: (table: string) =>
      table === "threads"
        ? {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: state.thread }),
              }),
            }),
          }
        : {
            insert: (row: Record<string, unknown>) => {
              state.inserted.push(row);
              return {
                select: () => ({
                  single: async () =>
                    state.insertError
                      ? { data: null, error: state.insertError }
                      : { data: { id: "a1" }, error: null },
                }),
              };
            },
          },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: async () => {
      state.xpAwarded += 1;
      return { error: null };
    },
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: async () => false,
}));

vi.mock("@/lib/gamification/achievements", () => ({
  checkCommunityAchievements: async () => {},
}));

import { POST } from "../route";

function post() {
  return POST(
    new NextRequest("http://localhost/api/community/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: "t1", body: "An answer" }),
    })
  );
}

beforeEach(() => {
  state.user = { id: "u1" };
  state.thread = { id: "t1", is_locked: false };
  state.insertError = null;
  state.inserted = [];
  state.xpAwarded = 0;
});

describe("POST /api/community/answers", () => {
  it("sends only the columns the database grants", async () => {
    const res = await post();
    expect(res.status).toBe(201);
    expect(Object.keys(state.inserted[0]!).sort()).toEqual([
      "author_id",
      "body",
      "thread_id",
    ]);
    expect(state.xpAwarded).toBe(1);
  });

  it("403s without inserting when the pre-check sees a locked thread", async () => {
    state.thread = { id: "t1", is_locked: true };
    const res = await post();
    expect(res.status).toBe(403);
    expect(state.inserted).toEqual([]);
  });

  it.each(["Thread is locked", "Thread is removed"])(
    "403s when the database refuses the insert: %s",
    async (message) => {
      state.insertError = { code: "AC001", message };
      const res = await post();
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: message });
      expect(state.xpAwarded).toBe(0);
    }
  );

  it.each(["42501", "23503", "23514"])(
    "stays a 500 on any other insert error: %s",
    async (code) => {
      state.insertError = { code, message: "database detail" };
      const res = await post();
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Failed to create answer" });
      expect(state.xpAwarded).toBe(0);
    }
  );
});
