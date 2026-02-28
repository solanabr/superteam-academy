import { describe, it, expect } from "vitest";
import { MOCK_COURSES } from "@/lib/mock-courses";
import { MOCK_ACHIEVEMENTS, getCourseBySlug, getCoursesByTrack, getCoursesByDifficulty } from "@/lib/mock-data";
import type { Course, Achievement } from "@/types";

describe("mock-data integrity", () => {
  // ── Course data ─────────────────────────────────────────────────────────────

  describe("MOCK_COURSES", () => {
    it("contains 6 courses", () => {
      expect(MOCK_COURSES).toHaveLength(6);
    });

    it("has unique IDs", () => {
      const ids = MOCK_COURSES.map((c: Course) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("has unique slugs", () => {
      const slugs = MOCK_COURSES.map((c: Course) => c.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it("all slugs are URL-safe", () => {
      for (const course of MOCK_COURSES) {
        expect(course.slug).toMatch(/^[a-z0-9-]+$/);
      }
    });

    it("all courses have required metadata", () => {
      for (const course of MOCK_COURSES) {
        expect(course.title.length).toBeGreaterThan(0);
        expect(course.description.length).toBeGreaterThan(0);
        expect(course.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
        expect(course.duration.length).toBeGreaterThan(0);
        expect(course.lessonCount).toBeGreaterThan(0);
        expect(course.xpTotal).toBeGreaterThan(0);
        expect(course.creator.length).toBeGreaterThan(0);
        expect(typeof course.isActive).toBe("boolean");
      }
    });

    it("courses cover all difficulty levels", () => {
      const difficulties = new Set(MOCK_COURSES.map((c: Course) => c.difficulty));
      expect(difficulties.has("beginner")).toBe(true);
      expect(difficulties.has("intermediate")).toBe(true);
      expect(difficulties.has("advanced")).toBe(true);
    });

    it("has valid tags array", () => {
      for (const course of MOCK_COURSES) {
        expect(Array.isArray(course.tags)).toBe(true);
        expect(course.tags.length).toBeGreaterThan(0);
        for (const tag of course.tags) {
          expect(typeof tag).toBe("string");
        }
      }
    });

    it("has valid enrollment and completion counts", () => {
      for (const course of MOCK_COURSES) {
        expect(course.totalEnrollments).toBeGreaterThanOrEqual(0);
        expect(course.totalCompletions).toBeGreaterThanOrEqual(0);
        expect(course.totalCompletions).toBeLessThanOrEqual(course.totalEnrollments);
      }
    });

    it("has valid ISO date strings", () => {
      for (const course of MOCK_COURSES) {
        expect(new Date(course.createdAt).getTime()).not.toBeNaN();
        expect(new Date(course.updatedAt).getTime()).not.toBeNaN();
        expect(new Date(course.updatedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(course.createdAt).getTime()
        );
      }
    });

    it("first two courses have modules with lessons", () => {
      const course1 = MOCK_COURSES[0];
      const course2 = MOCK_COURSES[1];

      expect(course1.modules.length).toBeGreaterThan(0);
      expect(course2.modules.length).toBeGreaterThan(0);

      for (const mod of course1.modules) {
        expect(mod.lessons.length).toBeGreaterThan(0);
        for (const lesson of mod.lessons) {
          expect(lesson.title.length).toBeGreaterThan(0);
          expect(lesson.xpReward).toBeGreaterThan(0);
          expect(lesson.type).toMatch(/^(content|challenge)$/);
        }
      }
    });

    it("challenge lessons have valid challenge data", () => {
      for (const course of MOCK_COURSES) {
        for (const mod of course.modules) {
          for (const lesson of mod.lessons) {
            if (lesson.type === "challenge") {
              expect(lesson.challenge).toBeDefined();
              expect(lesson.challenge!.prompt.length).toBeGreaterThan(0);
              expect(lesson.challenge!.starterCode.length).toBeGreaterThan(0);
              expect(lesson.challenge!.language).toMatch(/^(typescript|rust|json)$/);
              expect(lesson.challenge!.testCases.length).toBeGreaterThan(0);
              expect(lesson.challenge!.solution!.length).toBeGreaterThan(0);
            }
          }
        }
      }
    });

    it("prerequisites reference valid course slugs", () => {
      const slugs = new Set(MOCK_COURSES.map((c: Course) => c.slug));
      for (const course of MOCK_COURSES) {
        if (!course.prerequisites) continue;
        for (const prereq of course.prerequisites) {
          expect(slugs.has(prereq)).toBe(true);
        }
      }
    });
  });

  // ── Achievement data ────────────────────────────────────────────────────────

  describe("MOCK_ACHIEVEMENTS", () => {
    it("contains 20 achievements", () => {
      expect(MOCK_ACHIEVEMENTS).toHaveLength(20);
    });

    it("has unique IDs", () => {
      const ids = MOCK_ACHIEVEMENTS.map((a: Achievement) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("all achievements have required fields", () => {
      for (const achievement of MOCK_ACHIEVEMENTS) {
        expect(achievement.name.length).toBeGreaterThan(0);
        expect(achievement.description.length).toBeGreaterThan(0);
        expect(achievement.icon.length).toBeGreaterThan(0);
        expect(achievement.xpReward).toBeGreaterThan(0);
        expect(typeof achievement.claimed).toBe("boolean");
      }
    });

    it("covers all 5 achievement categories", () => {
      const categories = new Set(MOCK_ACHIEVEMENTS.map((a: Achievement) => a.category));
      expect(categories.has("progress")).toBe(true);
      expect(categories.has("streaks")).toBe(true);
      expect(categories.has("skills")).toBe(true);
      expect(categories.has("community")).toBe(true);
      expect(categories.has("special")).toBe(true);
    });
  });

  // ── Helper functions ────────────────────────────────────────────────────────

  describe("getCourseBySlug", () => {
    it("finds course by slug", () => {
      const course = getCourseBySlug("intro-to-solana");
      expect(course).toBeDefined();
      expect(course!.title).toBe("Introduction to Solana");
    });

    it("returns undefined for unknown slug", () => {
      expect(getCourseBySlug("nonexistent")).toBeUndefined();
    });
  });

  describe("getCoursesByTrack", () => {
    it("filters courses by track ID", () => {
      const courses = getCoursesByTrack(0);
      expect(courses.length).toBeGreaterThan(0);
      for (const c of courses) {
        expect(c.trackId).toBe(0);
      }
    });

    it("returns empty for unused track ID", () => {
      expect(getCoursesByTrack(999)).toHaveLength(0);
    });
  });

  describe("getCoursesByDifficulty", () => {
    it("filters courses by difficulty", () => {
      const beginners = getCoursesByDifficulty("beginner");
      expect(beginners.length).toBeGreaterThan(0);
      for (const c of beginners) {
        expect(c.difficulty).toBe("beginner");
      }
    });

    it("returns intermediate courses", () => {
      const intermediate = getCoursesByDifficulty("intermediate");
      expect(intermediate.length).toBeGreaterThan(0);
    });

    it("returns advanced courses", () => {
      const advanced = getCoursesByDifficulty("advanced");
      expect(advanced.length).toBeGreaterThan(0);
    });
  });
});
