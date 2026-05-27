import { describe, it, expect } from "vitest";
import {
  buildAchievementUserState,
  checkNewAchievements,
  computeFastestCourseCompletionHours,
  type AchievementDefinition,
} from "../achievements";

describe("computeFastestCourseCompletionHours", () => {
  it("returns null when no completed enrollments have both timestamps", () => {
    expect(
      computeFastestCourseCompletionHours([
        { course_id: "a", enrolled_at: null, completed_at: "2026-01-02T00:00:00.000Z" },
        { course_id: "b", enrolled_at: "2026-01-01T00:00:00.000Z", completed_at: null },
      ])
    ).toBeNull();
  });

  it("returns the minimum completion window in hours", () => {
    const hours = computeFastestCourseCompletionHours([
      {
        course_id: "slow",
        enrolled_at: "2026-01-01T00:00:00.000Z",
        completed_at: "2026-01-03T00:00:00.000Z",
      },
      {
        course_id: "fast",
        enrolled_at: "2026-01-01T00:00:00.000Z",
        completed_at: "2026-01-01T12:00:00.000Z",
      },
    ]);
    expect(hours).toBe(12);
  });
});

describe("buildAchievementUserState", () => {
  it("unlocks speed-runner when fastest completion is under 24 hours", () => {
    const state = buildAchievementUserState({
      progressRowCount: 10,
      completedCourseCount: 1,
      completedCourseIds: new Set(["course-anchor-framework"]),
      courseLessonCounts: new Map([["course-rust-for-solana", 1]]),
      currentStreak: 3,
      enrollmentRows: [
        {
          course_id: "course-anchor-framework",
          enrolled_at: "2026-01-01T00:00:00.000Z",
          completed_at: "2026-01-01T10:00:00.000Z",
        },
      ],
      userNumber: 50,
      solanaDevPathCourses: ["course-a", "course-b"],
    });

    const defs: AchievementDefinition[] = [
      {
        id: "achievement-speed-runner",
        name: "Speed Runner",
        description: "Finish a course in under 24 hours",
        icon: "bolt",
        glyph: "SR",
        solTier: true,
        category: "learning",
      },
    ];

    const unlocked = checkNewAchievements(defs, state, []);
    expect(unlocked.map((a) => a.id)).toContain("achievement-speed-runner");
  });
});
