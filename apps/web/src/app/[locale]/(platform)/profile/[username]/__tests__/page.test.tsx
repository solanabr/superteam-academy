import { describe, it, expect, vi, beforeEach } from "vitest";

// The profile pages fetch server-side now (#533): the render is an RSC and the
// data shaping lives in `@/lib/profile/profile-data`. This test pins the #493
// invariant at the fetch layer — the public path resolves a profile only
// through the `public_profiles` view, never the base `profiles` table.

vi.mock("server-only", () => ({}));

vi.mock("@/lib/content/queries", () => ({
  getAllAchievements: async () => [],
  getAllLessonSkills: async () => [],
  getCoursesByIds: async () => [],
}));

vi.mock("@/lib/gamification", () => ({
  completedLessonsToRadar: () => [],
}));

vi.mock("@/lib/gamification/xp", () => ({
  calculateLevel: () => 0,
}));

vi.mock("@/lib/services", () => ({
  getProgressService: () => ({
    getXP: async () => 0,
    getStreak: async () => ({ currentStreak: 0, longestStreak: 0 }),
  }),
}));

const { fetchPublicProfile, fetchOwnProfile } =
  await import("@/lib/profile/profile-data");

const db = { tables: [] as string[] };

const PROFILE_ROW = {
  id: "user-1",
  username: "gabi",
  bio: "hi",
  avatar_url: null,
  social_links: {},
  created_at: "2026-01-01T00:00:00.000Z",
  is_public: true,
};

function resultFor(table: string): { data: unknown; error: null } {
  if (table === "public_profiles") return { data: PROFILE_ROW, error: null };
  if (table === "profiles") return { data: PROFILE_ROW, error: null };
  if (table === "public_user_xp")
    return { data: { total_xp: 0, level: 0 }, error: null };
  return { data: [], error: null };
}

// Minimal query-builder stub: records which table was hit, resolves both the
// `.single()` reads and the awaited list queries (`.select().eq()` chains).
function makeSupabase() {
  return {
    from: (table: string) => {
      db.tables.push(table);
      const result = resultFor(table);
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        single: async () => result,
        then: (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
          Promise.resolve(result).then(onF, onR),
      };
      return builder;
    },
  } as never;
}

beforeEach(() => {
  db.tables = [];
});

describe("public profile fetch — cross-user reads (#493)", () => {
  it("resolves the profile by username via public_profiles, never the raw profiles table", async () => {
    const result = await fetchPublicProfile(makeSupabase(), "gabi", null);

    expect(result?.user.username).toBe("gabi");
    expect(db.tables).toContain("public_profiles");
    expect(db.tables).not.toContain("profiles");
  });

  it("returns null (page renders not-found) when the view has no row", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: "no row" } }),
          }),
        }),
      }),
    } as never;

    const result = await fetchPublicProfile(supabase, "ghost", null);
    expect(result).toBeNull();
  });
});

describe("own profile fetch", () => {
  it("reads the base profiles row (own-row RLS), not the public view", async () => {
    const result = await fetchOwnProfile(makeSupabase(), "user-1");

    expect(result?.user.username).toBe("gabi");
    expect(db.tables).toContain("profiles");
    expect(db.tables).not.toContain("public_profiles");
  });
});
