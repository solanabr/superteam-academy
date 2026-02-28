import { describe, it, expect } from "vitest";
import { generateDailyQuests } from "@/lib/hooks/gamification-quests";
import type { Quest } from "@/lib/hooks/gamification-quests";

describe("gamification-quests", () => {
  // ── generateDailyQuests ─────────────────────────────────────────────────────

  describe("generateDailyQuests", () => {
    it("returns exactly 3 quests", () => {
      const quests = generateDailyQuests("2026-02-22");
      expect(quests).toHaveLength(3);
    });

    it("returns Quest objects with all required fields", () => {
      const quests = generateDailyQuests("2026-02-22");

      for (const quest of quests) {
        expect(quest).toHaveProperty("id");
        expect(quest).toHaveProperty("type");
        expect(quest).toHaveProperty("title");
        expect(quest).toHaveProperty("description");
        expect(quest).toHaveProperty("target");
        expect(quest).toHaveProperty("progress");
        expect(quest).toHaveProperty("xpReward");
        expect(quest).toHaveProperty("completed");
      }
    });

    it("initializes quests with progress 0 and completed false", () => {
      const quests = generateDailyQuests("2026-02-22");

      for (const quest of quests) {
        expect(quest.progress).toBe(0);
        expect(quest.completed).toBe(false);
      }
    });

    it("generates valid quest types", () => {
      const validTypes = ["lessons", "xp", "challenge", "streak"];
      const quests = generateDailyQuests("2026-02-22");

      for (const quest of quests) {
        expect(validTypes).toContain(quest.type);
      }
    });

    it("generates positive XP rewards", () => {
      const quests = generateDailyQuests("2026-02-22");

      for (const quest of quests) {
        expect(quest.xpReward).toBeGreaterThan(0);
      }
    });

    it("generates positive targets", () => {
      const quests = generateDailyQuests("2026-02-22");

      for (const quest of quests) {
        expect(quest.target).toBeGreaterThan(0);
      }
    });

    it("is deterministic — same date produces same quests", () => {
      const first = generateDailyQuests("2026-01-15");
      const second = generateDailyQuests("2026-01-15");

      expect(first).toEqual(second);
    });

    it("generates different quests for different dates", () => {
      const day1 = generateDailyQuests("2026-02-20");
      const day2 = generateDailyQuests("2026-02-21");
      const day3 = generateDailyQuests("2026-02-22");

      // At least one date should produce a different quest set
      const allSame =
        JSON.stringify(day1) === JSON.stringify(day2) &&
        JSON.stringify(day2) === JSON.stringify(day3);
      expect(allSame).toBe(false);
    });

    it("selects unique quest templates (no duplicates)", () => {
      // Test across many dates to verify uniqueness
      for (let d = 1; d <= 28; d++) {
        const date = `2026-02-${String(d).padStart(2, "0")}`;
        const quests = generateDailyQuests(date);
        const ids = quests.map((q: Quest) => q.id);
        expect(new Set(ids).size).toBe(3);
      }
    });

    it("uses known quest template IDs", () => {
      const knownIds = ["lesson-learner", "xp-hunter", "code-warrior", "streak-keeper"];
      // Check a range of dates
      for (let d = 1; d <= 28; d++) {
        const date = `2026-02-${String(d).padStart(2, "0")}`;
        const quests = generateDailyQuests(date);
        for (const quest of quests) {
          expect(knownIds).toContain(quest.id);
        }
      }
    });

    it("includes non-empty title and description", () => {
      const quests = generateDailyQuests("2026-02-22");

      for (const quest of quests) {
        expect(quest.title.length).toBeGreaterThan(0);
        expect(quest.description.length).toBeGreaterThan(0);
      }
    });
  });
});
