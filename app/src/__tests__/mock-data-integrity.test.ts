import { describe, it, expect } from "vitest";
import { MOCK_COURSES } from "@/lib/mock-courses";
import { MOCK_ACHIEVEMENTS, getCourseBySlug, getCoursesByTrack, getCoursesByDifficulty } from "@/lib/mock-data";

// ── Frontend mock arrays are intentionally empty post-migration ─────────────
// Courses and achievements now live in prisma/seed-data/ and are served via API.

describe("mock-data integrity", () => {
  describe("frontend mock arrays (post-migration)", () => {
    it("MOCK_COURSES is empty — data moved to prisma/seed-data/course-*.ts", () => {
      expect(MOCK_COURSES).toHaveLength(0);
    });

    it("MOCK_ACHIEVEMENTS is empty — data moved to prisma/seed-data/achievements.ts", () => {
      expect(MOCK_ACHIEVEMENTS).toHaveLength(0);
    });

    it("getCourseBySlug returns undefined when catalog is empty", () => {
      expect(getCourseBySlug("intro-to-solana")).toBeUndefined();
    });

    it("getCoursesByTrack returns empty when catalog is empty", () => {
      expect(getCoursesByTrack(0)).toHaveLength(0);
    });

    it("getCoursesByDifficulty returns empty when catalog is empty", () => {
      expect(getCoursesByDifficulty("beginner")).toHaveLength(0);
    });
  });

  // ── Seed achievements integrity ───────────────────────────────────────────

  describe("seed achievements", () => {
    it("loads 20 achievements from seed", async () => {
      const { getAchievements } = await import("../../prisma/seed-data/achievements");
      expect(getAchievements()).toHaveLength(20);
    });

    it("achievements have unique IDs", async () => {
      const { getAchievements } = await import("../../prisma/seed-data/achievements");
      const ids = getAchievements().map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("all achievements have required fields", async () => {
      const { getAchievements } = await import("../../prisma/seed-data/achievements");
      for (const a of getAchievements()) {
        expect(a.name.length).toBeGreaterThan(0);
        expect(a.description.length).toBeGreaterThan(0);
        expect(a.icon.length).toBeGreaterThan(0);
        expect(a.xpReward).toBeGreaterThan(0);
      }
    });

    it("covers all 5 achievement categories", async () => {
      const { getAchievements } = await import("../../prisma/seed-data/achievements");
      const categories = new Set(getAchievements().map((a) => a.category));
      expect(categories.has("progress")).toBe(true);
      expect(categories.has("streaks")).toBe(true);
      expect(categories.has("skills")).toBe(true);
      expect(categories.has("community")).toBe(true);
      expect(categories.has("special")).toBe(true);
    });
  });
});
