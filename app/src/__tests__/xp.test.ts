import { describe, it, expect } from "vitest";
import {
  calculateLevel,
  calculateXpForLevel,
  calculateBonusXp,
  formatXp,
} from "@/lib/solana/xp";

describe("XP helpers", () => {
  describe("calculateLevel", () => {
    it("level 0 for 0 XP", () => {
      expect(calculateLevel(0)).toBe(0);
    });

    it("level 0 for 99 XP", () => {
      expect(calculateLevel(99)).toBe(0);
    });

    it("level 1 for 100 XP", () => {
      expect(calculateLevel(100)).toBe(1);
    });

    it("level 3 for 900 XP", () => {
      expect(calculateLevel(900)).toBe(3);
    });

    it("level 10 for 10000 XP", () => {
      expect(calculateLevel(10000)).toBe(10);
    });
  });

  describe("calculateXpForLevel", () => {
    it("0 XP for level 0", () => {
      expect(calculateXpForLevel(0)).toBe(0);
    });

    it("100 XP for level 1", () => {
      expect(calculateXpForLevel(1)).toBe(100);
    });

    it("inverse of calculateLevel", () => {
      for (let level = 0; level <= 20; level++) {
        const xp = calculateXpForLevel(level);
        expect(calculateLevel(xp)).toBe(level);
      }
    });
  });

  describe("calculateBonusXp", () => {
    it("50% of total lesson XP", () => {
      expect(calculateBonusXp(10, 100)).toBe(500);
    });

    it("rounds down", () => {
      expect(calculateBonusXp(3, 100)).toBe(150);
    });
  });

  describe("formatXp", () => {
    it("formats with commas", () => {
      expect(formatXp(1000)).toBe("1,000");
      expect(formatXp(1000000)).toBe("1,000,000");
    });

    it("no commas for small numbers", () => {
      expect(formatXp(42)).toBe("42");
    });
  });
});
