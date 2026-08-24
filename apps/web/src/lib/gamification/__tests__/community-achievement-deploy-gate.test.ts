import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/content/queries", () => ({
  getDeployedAchievements: vi.fn(),
  getAllCourseLessonCounts: vi.fn().mockResolvedValue([]),
  getLearningPathsForAdmin: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/content/deployments", () => ({
  getActiveDeployments: vi.fn().mockResolvedValue(new Map()),
  isSynced: vi.fn().mockReturnValue(true),
}));

import { getDeployedAchievements } from "@/lib/content/queries";
import type { DeployedAchievement } from "@/lib/content/queries";
import { checkCommunityAchievements } from "../achievements";

const firstWord: DeployedAchievement = {
  id: "achievement-first-word",
  name: "First Word",
  description: "",
  icon: "message-circle",
  glyph: "Fw",
  solTier: false,
  category: "community",
  xpReward: 30,
  award: { kind: "community-stat", stat: "totalThreads", gte: 1 },
};

/** Chainable admin stub: any query resolves to the row provided per table. */
function adminStub(rows: Record<string, unknown>) {
  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
  const from = (table: string) => {
    const result = { data: rows[table] ?? null, error: null };
    const builder: Record<string, unknown> = {};
    for (const m of ["select", "eq", "lte", "single"]) {
      builder[m] = () => builder;
    }
    (builder as { then: unknown }).then = (
      resolve: (v: typeof result) => unknown
    ) => Promise.resolve(resolve(result));
    return builder;
  };
  return { admin: { from, rpc }, rpc };
}

const qualifyingRows = {
  user_xp: { current_streak: 0 },
  user_progress: [],
  enrollments: [],
  community_stats: {
    total_threads: 1,
    total_answers: 0,
    accepted_answers: 0,
    total_community_xp: 0,
  },
  profiles: { created_at: "2026-08-01T00:00:00Z" },
  user_achievements: [],
};

beforeEach(() => {
  vi.mocked(getDeployedAchievements).mockReset();
});

describe("checkCommunityAchievements — deployed-only gate", () => {
  // An un-deployed doc unlocking here would write a user_achievements row with
  // no tx/asset and permanently block the real on-chain award (review on the
  // ladder-activation PR). The community path must see DEPLOYED docs only.
  it("does not unlock a qualifying achievement that has no on-chain deploy", async () => {
    vi.mocked(getDeployedAchievements).mockResolvedValue([]);
    const { admin, rpc } = adminStub(qualifyingRows);

    await checkCommunityAchievements(
      admin as unknown as Parameters<typeof checkCommunityAchievements>[0],
      "user-1"
    );

    expect(getDeployedAchievements).toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("unlocks the same achievement once it is deployed", async () => {
    vi.mocked(getDeployedAchievements).mockResolvedValue([firstWord]);
    const { admin, rpc } = adminStub(qualifyingRows);

    await checkCommunityAchievements(
      admin as unknown as Parameters<typeof checkCommunityAchievements>[0],
      "user-1"
    );

    expect(rpc).toHaveBeenCalledWith("unlock_achievement", {
      p_user_id: "user-1",
      p_achievement_id: "achievement-first-word",
    });
  });
});
