// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PublicProfilePage from "../page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ username: "gabi" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/lib/content/client-queries", () => ({
  getAllAchievements: async () => [],
  getAllLessonSkills: async () => [],
  getCoursesByIds: async () => [],
}));

vi.mock("@/lib/gamification", () => ({
  completedLessonsToRadar: () => [],
}));

// Render the heavy gamification children as inert stubs — this test only
// cares which tables the page reads.
vi.mock("@/components/gamification/profile-hero-panel", () => ({
  ProfileHeroPanel: () => <div data-testid="hero" />,
}));
vi.mock("@/components/gamification/skill-radar", () => ({
  SkillRadar: () => <div />,
}));
vi.mock("@/components/gamification/achievement-grid", () => ({
  AchievementGrid: () => <div />,
}));

const db = vi.hoisted(() => ({ tables: [] as string[] }));

const PROFILE_ROW = {
  id: "user-1",
  username: "gabi",
  bio: "hi",
  avatar_url: null,
  social_links: {},
  created_at: "2026-01-01T00:00:00.000Z",
};

function resultFor(table: string): { data: unknown; error: null } {
  if (table === "public_profiles") return { data: PROFILE_ROW, error: null };
  if (table === "public_user_xp")
    return { data: { total_xp: 0, level: 0 }, error: null };
  return { data: [], error: null };
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getSession: async () => ({ data: { session: null } }) },
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
  }),
}));

beforeEach(() => {
  db.tables = [];
});

describe("public profile page — cross-user reads (#493)", () => {
  it("resolves the profile by username via public_profiles, never the raw profiles table", async () => {
    render(<PublicProfilePage />);

    await waitFor(() => expect(screen.getByTestId("hero")).toBeInTheDocument());

    expect(db.tables).toContain("public_profiles");
    expect(db.tables).not.toContain("profiles");
  });
});
