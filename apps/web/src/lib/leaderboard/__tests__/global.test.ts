import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase/cookieless", () => ({
  createCookielessClient: () => ({ rpc }),
}));

// unstable_cache is identity here so the test drives loadLeaderboard directly —
// the property under test is that an RPC error REJECTS (nothing cacheable)
// instead of resolving to [] (which unstable_cache would happily store, #1107 F1).
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

import { getCachedLeaderboard } from "../global";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCachedLeaderboard (#1107 F1)", () => {
  it("rejects on RPC error — a failure must never become a cacheable []", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "rpc down" } });

    await expect(getCachedLeaderboard("alltime")).rejects.toThrow(
      /alltime.*rpc down/
    );
  });

  it("maps rows on success", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          user_id: "u1",
          username: "ada",
          avatar_url: null,
          total_xp: 100,
          level: 1,
          rank: 1,
        },
      ],
      error: null,
    });

    await expect(getCachedLeaderboard("weekly")).resolves.toEqual([
      {
        userId: "u1",
        username: "ada",
        avatarUrl: "",
        totalXp: 100,
        level: 1,
        rank: 1,
      },
    ]);
  });
});
