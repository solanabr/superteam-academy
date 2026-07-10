import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
// The module imports server-only queries at load; stub them (unused by these tests).
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/sanity/queries", () => ({
  getAllAchievements: vi.fn(),
  getAllCourseLessonCounts: vi.fn(),
  getLearningPathsForAdmin: vi.fn(),
}));

import type { AwardKind, AwardT } from "@superteam-lms/content-schema";
import {
  PREDICATES,
  checkNewAchievements,
  type UserState,
} from "../achievements";

const base: UserState = {
  completedLessons: 0,
  completedLessonsByCourse: {},
  completedCourseIds: new Set(),
  completedPathIds: new Set(),
  currentStreak: 0,
  userNumber: 999,
  community: {
    totalThreads: 0,
    totalAnswers: 0,
    acceptedAnswers: 0,
    totalCommunityXp: 0,
  },
};
const state = (over: Partial<UserState>): UserState => ({ ...base, ...over });

// Compile-time proof that every AwardKind has a predicate (remove a key → fails).
const _coverage: Record<AwardKind, unknown> = PREDICATES;
void _coverage;

describe("PREDICATES", () => {
  it("lessons-completed honours the gte boundary", () => {
    const a: AwardT = { kind: "lessons-completed", gte: 5 };
    expect(PREDICATES[a.kind](a, state({ completedLessons: 4 }))).toBe(false);
    expect(PREDICATES[a.kind](a, state({ completedLessons: 5 }))).toBe(true);
  });

  it("lessons-completed-in-course reads the per-course map", () => {
    const a: AwardT = {
      kind: "lessons-completed-in-course",
      course: "course-x",
      gte: 2,
    };
    expect(
      PREDICATES[a.kind](
        a,
        state({ completedLessonsByCourse: { "course-x": 1 } })
      )
    ).toBe(false);
    expect(
      PREDICATES[a.kind](
        a,
        state({ completedLessonsByCourse: { "course-x": 2 } })
      )
    ).toBe(true);
  });

  it("course-completed fires only when the course is completed", () => {
    const a: AwardT = { kind: "course-completed", course: "course-x" };
    expect(PREDICATES[a.kind](a, base)).toBe(false);
    expect(
      PREDICATES[a.kind](
        a,
        state({ completedCourseIds: new Set(["course-x"]) })
      )
    ).toBe(true);
  });

  it("path-completed fires only when the path is completed", () => {
    const a: AwardT = { kind: "path-completed", path: "path-solana-core" };
    expect(PREDICATES[a.kind](a, base)).toBe(false);
    expect(
      PREDICATES[a.kind](
        a,
        state({ completedPathIds: new Set(["path-solana-core"]) })
      )
    ).toBe(true);
  });

  it("streak, user-number, community-stat boundaries", () => {
    const streak: AwardT = { kind: "streak", days: 7 };
    expect(PREDICATES[streak.kind](streak, state({ currentStreak: 6 }))).toBe(
      false
    );
    expect(PREDICATES[streak.kind](streak, state({ currentStreak: 7 }))).toBe(
      true
    );

    const early: AwardT = { kind: "user-number", lte: 100 };
    expect(PREDICATES[early.kind](early, state({ userNumber: 101 }))).toBe(
      false
    );
    expect(PREDICATES[early.kind](early, state({ userNumber: 100 }))).toBe(
      true
    );

    const stat: AwardT = {
      kind: "community-stat",
      stat: "acceptedAnswers",
      gte: 5,
    };
    expect(
      PREDICATES[stat.kind](
        stat,
        state({
          community: { ...base.community, acceptedAnswers: 4 },
        })
      )
    ).toBe(false);
    expect(
      PREDICATES[stat.kind](
        stat,
        state({
          community: { ...base.community, acceptedAnswers: 5 },
        })
      )
    ).toBe(true);
  });

  it("manual never fires from state", () => {
    const a: AwardT = { kind: "manual" };
    expect(PREDICATES[a.kind](a, state({ completedLessons: 9999 }))).toBe(
      false
    );
  });
});

describe("checkNewAchievements", () => {
  const deployed = [
    { id: "a-first", award: { kind: "lessons-completed", gte: 1 } as AwardT },
    {
      id: "a-course",
      award: { kind: "course-completed", course: "course-x" } as AwardT,
    },
    { id: "a-legacy", award: null },
  ];

  it("awards only the satisfied, not-already-unlocked achievements", () => {
    const s = state({
      completedLessons: 1,
      completedCourseIds: new Set(["course-x"]),
    });
    const out = checkNewAchievements(deployed, s, ["a-course"]);
    expect(out.map((d) => d.id)).toEqual(["a-first"]);
  });

  it("skips achievements with a null award (pre-sync/legacy)", () => {
    const s = state({ completedLessons: 100 });
    const out = checkNewAchievements(deployed, s, []);
    expect(out.map((d) => d.id)).not.toContain("a-legacy");
  });
});
