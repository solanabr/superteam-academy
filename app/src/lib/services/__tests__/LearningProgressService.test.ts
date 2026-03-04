import { describe, it, expect, beforeEach } from "vitest";
import {
  getLevel,
  getLevelProgress,
  getCourseProgress,
  getStreakData,
  isStreakMilestone,
  XP_RANGES,
  getXpBalance,
  getLearnerProgress,
} from "../LearningProgressService";
import { useProgressStore } from "@/stores/progress-store";

// Reset progress store state between tests
function resetProgressStore(overrides: Partial<{
  xp: number;
  streakDays: number;
  lastActivityDate: string | null;
  completedLessons: Record<string, Set<number>>;
  streakMilestonesReached: number[];
}> = {}) {
  useProgressStore.setState({
    completedLessons: {},
    xp: 0,
    streakDays: 0,
    lastActivityDate: null,
    streakMilestonesReached: [],
    ...overrides,
  });
}

describe("LearningProgressService — getLevel", () => {
  it("returns 0 for 0 XP", () => {
    expect(getLevel(0)).toBe(0);
  });

  it("returns 0 for 99 XP (below level 1 threshold)", () => {
    expect(getLevel(99)).toBe(0);
  });

  it("returns 1 for exactly 100 XP", () => {
    expect(getLevel(100)).toBe(1);
  });

  it("returns 2 for exactly 400 XP", () => {
    expect(getLevel(400)).toBe(2);
  });

  it("returns 3 for exactly 900 XP", () => {
    expect(getLevel(900)).toBe(3);
  });

  it("returns 10 for 10000 XP", () => {
    expect(getLevel(10000)).toBe(10);
  });

  it("matches the floor(sqrt(xp/100)) formula", () => {
    for (const xp of [0, 50, 100, 399, 400, 899, 900, 9999, 10000]) {
      expect(getLevel(xp)).toBe(Math.floor(Math.sqrt(xp / 100)));
    }
  });
});

describe("LearningProgressService — getLevelProgress", () => {
  it("returns 0 for 0 XP (start of level 0)", () => {
    expect(getLevelProgress(0)).toBe(0);
  });

  it("returns 0 at exactly 100 XP (start of level 1)", () => {
    expect(getLevelProgress(100)).toBe(0);
  });

  it("returns 50 halfway through level 1 (250 XP)", () => {
    // (250-100)/(400-100) * 100 = 50
    expect(getLevelProgress(250)).toBe(50);
  });

  it("returns 0 at level 2 boundary (400 XP)", () => {
    expect(getLevelProgress(400)).toBe(0);
  });

  it("returns a value between 0 and 100 for mid-level XP", () => {
    const progress = getLevelProgress(600);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(100);
  });

  it("returns 100 at the exact next level threshold (level 1 end = level 2 start is 0, not 100)", () => {
    // At 400 XP → level 2, so getLevelProgress returns 0 (new level)
    expect(getLevelProgress(400)).toBe(0);
  });

  it("returns integer percentage (rounded)", () => {
    const progress = getLevelProgress(250);
    expect(Number.isInteger(progress)).toBe(true);
  });
});

describe("LearningProgressService — getCourseProgress", () => {
  beforeEach(() => {
    resetProgressStore();
  });

  it("returns 0 completed lessons for unknown course", () => {
    const result = getCourseProgress("unknown-course", 10);
    expect(result.totalCompleted).toBe(0);
    expect(result.percentComplete).toBe(0);
    expect(result.completedLessons).toEqual([]);
  });

  it("returns correct courseId in result", () => {
    const result = getCourseProgress("my-course", 5);
    expect(result.courseId).toBe("my-course");
  });

  it("reflects lessons marked in the progress store", () => {
    useProgressStore.getState().markLessonComplete("course-a", 0, 10);
    useProgressStore.getState().markLessonComplete("course-a", 2, 10);
    const result = getCourseProgress("course-a", 5);
    expect(result.totalCompleted).toBe(2);
    expect(result.completedLessons).toEqual([0, 2]);
    expect(result.percentComplete).toBe(40);
  });

  it("returns completedLessons in sorted ascending order", () => {
    useProgressStore.getState().markLessonComplete("course-b", 5, 10);
    useProgressStore.getState().markLessonComplete("course-b", 1, 10);
    useProgressStore.getState().markLessonComplete("course-b", 3, 10);
    const result = getCourseProgress("course-b", 10);
    expect(result.completedLessons).toEqual([1, 3, 5]);
  });

  it("returns 100 percent when all lessons are completed", () => {
    useProgressStore.getState().markLessonComplete("course-c", 0, 10);
    useProgressStore.getState().markLessonComplete("course-c", 1, 10);
    const result = getCourseProgress("course-c", 2);
    expect(result.percentComplete).toBe(100);
  });

  it("returns 0 percent for 0 totalLessons (avoids division by zero)", () => {
    const result = getCourseProgress("empty-course", 0);
    expect(result.percentComplete).toBe(0);
  });
});

describe("LearningProgressService — getStreakData", () => {
  beforeEach(() => {
    resetProgressStore();
  });

  it("returns 0 streak with null lastActivityDate when store is fresh", () => {
    const result = getStreakData();
    expect(result.currentStreak).toBe(0);
    expect(result.lastActivityDate).toBeNull();
  });

  it("returns null milestoneReached when streak is below 7", () => {
    resetProgressStore({ streakDays: 5, lastActivityDate: "2024-01-01" });
    const result = getStreakData();
    expect(result.milestoneReached).toBeNull();
  });

  it("returns null milestoneReached when streak is exactly 6", () => {
    resetProgressStore({ streakDays: 6 });
    const result = getStreakData();
    expect(result.milestoneReached).toBeNull();
  });

  it("returns 7 as milestoneReached when streak is exactly 7", () => {
    resetProgressStore({ streakDays: 7 });
    const result = getStreakData();
    expect(result.milestoneReached).toBe(7);
  });

  it("returns 7 when streak is 8 (highest milestone reached is 7)", () => {
    // milestoneReached returns the highest milestone the streak has reached or passed
    resetProgressStore({ streakDays: 8 });
    const result = getStreakData();
    expect(result.milestoneReached).toBe(7);
  });

  it("returns 30 as milestoneReached when streak is exactly 30", () => {
    resetProgressStore({ streakDays: 30 });
    const result = getStreakData();
    expect(result.milestoneReached).toBe(30);
  });

  it("returns 100 as milestoneReached when streak is exactly 100", () => {
    resetProgressStore({ streakDays: 100 });
    const result = getStreakData();
    expect(result.milestoneReached).toBe(100);
  });

  it("returns lastActivityDate from store", () => {
    resetProgressStore({ streakDays: 5, lastActivityDate: "2024-06-15" });
    const result = getStreakData();
    expect(result.lastActivityDate).toBe("2024-06-15");
  });
});

describe("LearningProgressService — isStreakMilestone", () => {
  it("returns true for 7 (milestone)", () => {
    expect(isStreakMilestone(7)).toBe(true);
  });

  it("returns true for 30 (milestone)", () => {
    expect(isStreakMilestone(30)).toBe(true);
  });

  it("returns true for 100 (milestone)", () => {
    expect(isStreakMilestone(100)).toBe(true);
  });

  it("returns false for 6 (not a milestone)", () => {
    expect(isStreakMilestone(6)).toBe(false);
  });

  it("returns false for 8 (not a milestone)", () => {
    expect(isStreakMilestone(8)).toBe(false);
  });

  it("returns false for 0", () => {
    expect(isStreakMilestone(0)).toBe(false);
  });

  it("returns false for 29", () => {
    expect(isStreakMilestone(29)).toBe(false);
  });

  it("returns false for 31", () => {
    expect(isStreakMilestone(31)).toBe(false);
  });

  it("returns false for 99", () => {
    expect(isStreakMilestone(99)).toBe(false);
  });

  it("returns false for 101", () => {
    expect(isStreakMilestone(101)).toBe(false);
  });

  it("returns false for 1000", () => {
    expect(isStreakMilestone(1000)).toBe(false);
  });
});

describe("LearningProgressService — XP_RANGES", () => {
  it("has lesson range with min=10 and max=50", () => {
    expect(XP_RANGES.lesson.min).toBe(10);
    expect(XP_RANGES.lesson.max).toBe(50);
  });

  it("has challenge range with min=25 and max=100", () => {
    expect(XP_RANGES.challenge.min).toBe(25);
    expect(XP_RANGES.challenge.max).toBe(100);
  });

  it("has course range with min=500 and max=2000", () => {
    expect(XP_RANGES.course.min).toBe(500);
    expect(XP_RANGES.course.max).toBe(2000);
  });

  it("lesson min is less than lesson max", () => {
    expect(XP_RANGES.lesson.min).toBeLessThan(XP_RANGES.lesson.max);
  });

  it("challenge min is less than challenge max", () => {
    expect(XP_RANGES.challenge.min).toBeLessThan(XP_RANGES.challenge.max);
  });

  it("course min is less than course max", () => {
    expect(XP_RANGES.course.min).toBeLessThan(XP_RANGES.course.max);
  });

  it("challenge max is greater than lesson max (challenges award more XP)", () => {
    expect(XP_RANGES.challenge.max).toBeGreaterThan(XP_RANGES.lesson.max);
  });

  it("course min is greater than challenge max (course completion is highest reward)", () => {
    expect(XP_RANGES.course.min).toBeGreaterThan(XP_RANGES.challenge.max);
  });
});

describe("LearningProgressService — getXpBalance", () => {
  beforeEach(() => {
    resetProgressStore();
  });

  it("returns 0 on fresh store", () => {
    expect(getXpBalance()).toBe(0);
  });

  it("reflects XP set via setXp", () => {
    useProgressStore.getState().setXp(500);
    expect(getXpBalance()).toBe(500);
  });

  it("reflects XP earned via markLessonComplete", () => {
    // +75 lesson + 25 first-of-day bonus (lastActivityDate is null) = 100
    useProgressStore.getState().markLessonComplete("c1", 0, 75);
    expect(getXpBalance()).toBe(100);
  });
});

describe("LearningProgressService — getLearnerProgress", () => {
  beforeEach(() => {
    resetProgressStore();
  });

  it("returns level 0 and 0 XP for fresh store", () => {
    const result = getLearnerProgress();
    expect(result.xp).toBe(0);
    expect(result.level).toBe(0);
  });

  it("returns correct level when XP is set", () => {
    useProgressStore.getState().setXp(400);
    const result = getLearnerProgress();
    expect(result.level).toBe(2);
  });

  it("returns levelProgress between 0 and 100", () => {
    useProgressStore.getState().setXp(250);
    const result = getLearnerProgress();
    expect(result.levelProgress).toBeGreaterThanOrEqual(0);
    expect(result.levelProgress).toBeLessThanOrEqual(100);
  });

  it("includes streakData with currentStreak", () => {
    const result = getLearnerProgress();
    expect(typeof result.streakData.currentStreak).toBe("number");
  });

  it("includes empty courses array when no lessons completed", () => {
    const result = getLearnerProgress();
    expect(result.courses).toEqual([]);
  });

  it("includes course entry after a lesson is completed", () => {
    useProgressStore.getState().markLessonComplete("course-x", 0, 30);
    const result = getLearnerProgress();
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].courseId).toBe("course-x");
    expect(result.courses[0].totalCompleted).toBe(1);
  });

  it("level is consistent with getLevel(xp)", () => {
    useProgressStore.getState().setXp(900);
    const result = getLearnerProgress();
    expect(result.level).toBe(getLevel(900));
  });
});
