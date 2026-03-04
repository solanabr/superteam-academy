import { describe, it, expect, beforeEach } from "vitest";
import { useProgressStore } from "../progress-store";

// Helper: get a fresh store state for each test
function getStore() {
  return useProgressStore.getState();
}

function resetStore() {
  useProgressStore.setState({
    completedLessons: {},
    xp: 0,
    streakDays: 0,
    lastActivityDate: null,
  });
}

describe("progress-store", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("markLessonComplete", () => {
    it("adds the lessonIndex to completedLessons for the given courseId", () => {
      getStore().markLessonComplete("course-1", 0, 10);
      expect(getStore().completedLessons["course-1"].has(0)).toBe(true);
    });

    it("accumulates multiple lessons for the same course", () => {
      getStore().markLessonComplete("course-1", 0, 10);
      getStore().markLessonComplete("course-1", 1, 10);
      getStore().markLessonComplete("course-1", 3, 10);
      const set = getStore().completedLessons["course-1"];
      expect(set.has(0)).toBe(true);
      expect(set.has(1)).toBe(true);
      expect(set.has(3)).toBe(true);
      expect(set.size).toBe(3);
    });

    it("tracks lessons across different courses independently", () => {
      getStore().markLessonComplete("course-1", 0, 10);
      getStore().markLessonComplete("course-2", 5, 10);
      expect(getStore().completedLessons["course-1"].has(0)).toBe(true);
      expect(getStore().completedLessons["course-2"].has(5)).toBe(true);
      expect(getStore().completedLessons["course-1"].has(5)).toBe(false);
    });

    it("is idempotent — marking the same lesson twice does not duplicate", () => {
      getStore().markLessonComplete("course-1", 0, 10);
      getStore().markLessonComplete("course-1", 0, 10);
      expect(getStore().completedLessons["course-1"].size).toBe(1);
    });
  });

  describe("isLessonComplete", () => {
    it("returns true for a completed lesson", () => {
      getStore().markLessonComplete("course-1", 2, 10);
      expect(getStore().isLessonComplete("course-1", 2)).toBe(true);
    });

    it("returns false for an incomplete lesson", () => {
      expect(getStore().isLessonComplete("course-1", 99)).toBe(false);
    });

    it("returns false for a different lessonIndex in the same course", () => {
      getStore().markLessonComplete("course-1", 0, 10);
      expect(getStore().isLessonComplete("course-1", 1)).toBe(false);
    });

    it("returns false for a different course with the same lessonIndex", () => {
      getStore().markLessonComplete("course-1", 0, 10);
      expect(getStore().isLessonComplete("course-2", 0)).toBe(false);
    });
  });

  describe("revertLessonComplete", () => {
    it("removes the lessonIndex from completedLessons", () => {
      getStore().markLessonComplete("course-1", 0, 10);
      getStore().revertLessonComplete("course-1", 0, 10);
      expect(getStore().completedLessons["course-1"].has(0)).toBe(false);
    });

    it("does not remove other lessons in the same course", () => {
      getStore().markLessonComplete("course-1", 0, 10);
      getStore().markLessonComplete("course-1", 1, 10);
      getStore().revertLessonComplete("course-1", 0, 10);
      expect(getStore().completedLessons["course-1"].has(1)).toBe(true);
      expect(getStore().completedLessons["course-1"].has(0)).toBe(false);
    });

    it("is safe to call when lesson was never completed", () => {
      // Should not throw
      expect(() => getStore().revertLessonComplete("course-1", 99, 10)).not.toThrow();
    });
  });

  describe("addXp (via markLessonComplete)", () => {
    it("accumulates XP across multiple lessons", () => {
      getStore().markLessonComplete("course-1", 0, 25); // +25 lesson + 25 first-of-day bonus = 50
      getStore().markLessonComplete("course-1", 1, 50); // +50 lesson (no bonus, same day) = 100
      expect(getStore().xp).toBe(100);
    });

    it("does not go below 0 when reverting XP", () => {
      getStore().markLessonComplete("course-1", 0, 10); // +10 lesson + 25 first-of-day bonus = 35
      getStore().revertLessonComplete("course-1", 0, 10); // -10 → 25 (bonus XP not reverted)
      expect(getStore().xp).toBe(25);
    });

    it("clamps XP to 0 if revert would make it negative", () => {
      // Manually set xp below what revert tries to subtract
      useProgressStore.setState({ xp: 5 });
      getStore().revertLessonComplete("course-1", 0, 50);
      expect(getStore().xp).toBe(0);
    });

    it("setXp directly overwrites XP", () => {
      getStore().markLessonComplete("course-1", 0, 10);
      getStore().setXp(500);
      expect(getStore().xp).toBe(500);
    });
  });

  describe("getLevelFromXp (via getLevel in utils)", () => {
    // The progress store stores raw xp; level computation lives in getLevel (utils).
    // These tests verify the xp values that correspond to known levels are stored correctly.
    it("starts at 0 XP", () => {
      expect(getStore().xp).toBe(0);
    });

    it("reaches 100 XP after earning 100 XP (level 1 threshold)", () => {
      getStore().markLessonComplete("course-1", 0, 100); // +100 lesson + 25 first-of-day bonus = 125
      expect(getStore().xp).toBe(125);
    });

    it("reaches 400 XP after earning 400 XP (level 2 threshold)", () => {
      getStore().markLessonComplete("course-1", 0, 400); // +400 lesson + 25 first-of-day bonus = 425
      expect(getStore().xp).toBe(425);
    });

    it("accumulates XP from multiple marks to reach level 2 threshold", () => {
      getStore().markLessonComplete("course-1", 0, 200); // +200 lesson + 25 first-of-day bonus = 225
      getStore().markLessonComplete("course-1", 1, 200); // +200 lesson (no bonus, same day) = 425
      expect(getStore().xp).toBe(425);
    });
  });

  describe("getCourseProgress", () => {
    it("returns 0 when no lessons are completed", () => {
      expect(getStore().getCourseProgress("course-1", 10)).toBe(0);
    });

    it("returns 100 when all lessons are completed", () => {
      getStore().markLessonComplete("course-1", 0, 10);
      getStore().markLessonComplete("course-1", 1, 10);
      expect(getStore().getCourseProgress("course-1", 2)).toBe(100);
    });

    it("returns 50 when half the lessons are completed", () => {
      getStore().markLessonComplete("course-1", 0, 10);
      expect(getStore().getCourseProgress("course-1", 2)).toBe(50);
    });

    it("returns 0 for zero totalLessons to avoid division by zero", () => {
      expect(getStore().getCourseProgress("course-1", 0)).toBe(0);
    });
  });
});
