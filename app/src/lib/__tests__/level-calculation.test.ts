import { describe, it, expect } from "vitest";
import { getLevel, getLevelProgress } from "../utils";

// Level formula: floor(sqrt(xp / 100))
// XP thresholds: level N starts at N*N*100
// level 0: 0 XP,  level 1: 100,  level 2: 400,  level 3: 900,  level 4: 1600
// level 5: 2500,  level 6: 3600, level 7: 4900,  level 8: 6400, level 9: 8100
// level 10: 10000

describe("getLevel — comprehensive boundary and formula tests", () => {
  describe("level 0 range (0–99 XP)", () => {
    it("returns 0 for 0 XP", () => {
      expect(getLevel(0)).toBe(0);
    });

    it("returns 0 for 1 XP", () => {
      expect(getLevel(1)).toBe(0);
    });

    it("returns 0 for 50 XP (midpoint of level 0)", () => {
      expect(getLevel(50)).toBe(0);
    });

    it("returns 0 for 99 XP (one below level 1 threshold)", () => {
      expect(getLevel(99)).toBe(0);
    });
  });

  describe("level 1 range (100–399 XP)", () => {
    it("returns 1 for exactly 100 XP (level 1 threshold)", () => {
      expect(getLevel(100)).toBe(1);
    });

    it("returns 1 for 101 XP", () => {
      expect(getLevel(101)).toBe(1);
    });

    it("returns 1 for 250 XP (midpoint of level 1)", () => {
      expect(getLevel(250)).toBe(1);
    });

    it("returns 1 for 399 XP (one below level 2 threshold)", () => {
      expect(getLevel(399)).toBe(1);
    });
  });

  describe("level 2 range (400–899 XP)", () => {
    it("returns 2 for exactly 400 XP (level 2 threshold)", () => {
      expect(getLevel(400)).toBe(2);
    });

    it("returns 2 for 650 XP (midpoint of level 2)", () => {
      expect(getLevel(650)).toBe(2);
    });

    it("returns 2 for 899 XP (one below level 3 threshold)", () => {
      expect(getLevel(899)).toBe(2);
    });
  });

  describe("level 3 range (900–1599 XP)", () => {
    it("returns 3 for exactly 900 XP (level 3 threshold)", () => {
      expect(getLevel(900)).toBe(3);
    });

    it("returns 3 for 1200 XP", () => {
      expect(getLevel(1200)).toBe(3);
    });

    it("returns 3 for 1599 XP", () => {
      expect(getLevel(1599)).toBe(3);
    });
  });

  describe("higher levels", () => {
    it("returns 4 at 1600 XP", () => {
      expect(getLevel(1600)).toBe(4);
    });

    it("returns 5 at 2500 XP", () => {
      expect(getLevel(2500)).toBe(5);
    });

    it("returns 6 at 3600 XP", () => {
      expect(getLevel(3600)).toBe(6);
    });

    it("returns 7 at 4900 XP", () => {
      expect(getLevel(4900)).toBe(7);
    });

    it("returns 8 at 6400 XP", () => {
      expect(getLevel(6400)).toBe(8);
    });

    it("returns 9 at 8100 XP", () => {
      expect(getLevel(8100)).toBe(9);
    });

    it("returns 10 at exactly 10000 XP", () => {
      expect(getLevel(10000)).toBe(10);
    });

    it("returns 20 at 40000 XP", () => {
      expect(getLevel(40000)).toBe(20);
    });
  });

  describe("formula verification", () => {
    const testXpValues = [0, 1, 50, 99, 100, 200, 399, 400, 500, 899, 900, 1599, 1600, 2499, 2500, 9999, 10000];
    for (const xp of testXpValues) {
      it(`matches floor(sqrt(${xp}/100)) = ${Math.floor(Math.sqrt(xp / 100))}`, () => {
        expect(getLevel(xp)).toBe(Math.floor(Math.sqrt(xp / 100)));
      });
    }
  });

  describe("non-integer XP inputs", () => {
    it("handles fractional XP (floors correctly)", () => {
      // 99.9 XP → floor(sqrt(0.999)) = floor(0.9995) = 0
      expect(getLevel(99.9)).toBe(0);
    });

    it("handles XP just above a threshold", () => {
      // 100.1 XP → floor(sqrt(1.001)) = floor(1.0005) = 1
      expect(getLevel(100.1)).toBe(1);
    });
  });
});

describe("getLevelProgress — percentage within current level", () => {
  describe("level 0 progress (XP 0–99 → next threshold 100)", () => {
    it("returns 0 at 0 XP (start of level 0)", () => {
      expect(getLevelProgress(0)).toBe(0);
    });

    it("returns 0.5 at 50 XP (halfway through level 0)", () => {
      // currentLevelXp=0, nextLevelXp=100 → (50-0)/(100-0) = 0.5 → 50
      expect(getLevelProgress(50)).toBeCloseTo(50);
    });

    it("returns close to 1 at 99 XP (end of level 0)", () => {
      // (99-0)/(100-0) = 0.99 → 99
      expect(getLevelProgress(99)).toBeCloseTo(99);
    });
  });

  describe("level 1 progress (XP 100–399 → next threshold 400)", () => {
    it("returns 0 at exactly 100 XP (start of level 1)", () => {
      // (100-100)/(400-100) = 0/300 = 0
      expect(getLevelProgress(100)).toBe(0);
    });

    it("returns ~0.5 at 250 XP (halfway through level 1)", () => {
      // (250-100)/(400-100) = 150/300 = 0.5 → 50
      expect(getLevelProgress(250)).toBeCloseTo(50);
    });

    it("returns close to 1 at 399 XP (one below level 2)", () => {
      // (399-100)/(400-100) = 299/300 ≈ 0.9967 → ~99.67 → rounded to 100
      expect(getLevelProgress(399)).toBeCloseTo(Math.round((299 / 300) * 100));
    });
  });

  describe("level 2 progress (XP 400–899 → next threshold 900)", () => {
    it("returns 0 at exactly 400 XP (start of level 2)", () => {
      // (400-400)/(900-400) = 0/500 = 0
      expect(getLevelProgress(400)).toBe(0);
    });

    it("returns 0.5 at 650 XP (halfway through level 2)", () => {
      // (650-400)/(900-400) = 250/500 = 0.5 → 50
      expect(getLevelProgress(650)).toBeCloseTo(50);
    });

    it("returns close to 1 at 899 XP", () => {
      // (899-400)/(900-400) = 499/500 = 0.998 → ~99.8 → rounded to 100
      expect(getLevelProgress(899)).toBeCloseTo(Math.round((499 / 500) * 100));
    });
  });

  describe("level 3 progress (XP 900–1599 → next threshold 1600)", () => {
    it("returns 0 at exactly 900 XP", () => {
      expect(getLevelProgress(900)).toBe(0);
    });

    it("returns 0.5 at 1250 XP (halfway through level 3)", () => {
      // (1250-900)/(1600-900) = 350/700 = 0.5 → 50
      expect(getLevelProgress(1250)).toBeCloseTo(50);
    });
  });

  describe("range invariants", () => {
    const testCases = [0, 50, 99, 100, 200, 399, 400, 650, 899, 900, 1200, 1599, 1600, 2500, 10000];
    for (const xp of testCases) {
      it(`getLevelProgress(${xp}) is in [0, 1]`, () => {
        const progress = getLevelProgress(xp);
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      });
    }
  });

  describe("progress resets to 0 at each level boundary", () => {
    it("resets to 0 at level 1 boundary (100 XP)", () => {
      expect(getLevelProgress(100)).toBe(0);
    });

    it("resets to 0 at level 2 boundary (400 XP)", () => {
      expect(getLevelProgress(400)).toBe(0);
    });

    it("resets to 0 at level 3 boundary (900 XP)", () => {
      expect(getLevelProgress(900)).toBe(0);
    });

    it("resets to 0 at level 4 boundary (1600 XP)", () => {
      expect(getLevelProgress(1600)).toBe(0);
    });

    it("resets to 0 at level 5 boundary (2500 XP)", () => {
      expect(getLevelProgress(2500)).toBe(0);
    });
  });
});
