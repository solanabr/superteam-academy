import { describe, it, expect } from "vitest";
import {
  calculateLevel,
  xpForLevel,
  xpToNextLevel,
  levelProgress,
} from "./constants";

describe("calculateLevel", () => {
  it("returns 0 for 0 XP", () => {
    expect(calculateLevel(0)).toBe(0);
  });

  it("returns 0 for XP below level 1 threshold", () => {
    expect(calculateLevel(99)).toBe(0);
  });

  it("returns 1 at exactly 100 XP", () => {
    expect(calculateLevel(100)).toBe(1);
  });

  it("returns 3 at 900 XP", () => {
    expect(calculateLevel(900)).toBe(3);
  });

  it("returns 10 at 10000 XP", () => {
    expect(calculateLevel(10000)).toBe(10);
  });

  it("floors partial levels", () => {
    expect(calculateLevel(350)).toBe(1);
  });
});

describe("xpForLevel", () => {
  it("returns 0 for level 0", () => {
    expect(xpForLevel(0)).toBe(0);
  });

  it("returns 100 for level 1", () => {
    expect(xpForLevel(1)).toBe(100);
  });

  it("returns 400 for level 2", () => {
    expect(xpForLevel(2)).toBe(400);
  });

  it("is the inverse of calculateLevel at boundaries", () => {
    for (const level of [0, 1, 5, 10, 20]) {
      expect(calculateLevel(xpForLevel(level))).toBe(level);
    }
  });
});

describe("xpToNextLevel", () => {
  it("returns 100 from 0 XP (level 0 → 1)", () => {
    expect(xpToNextLevel(0)).toBe(100);
  });

  it("returns 300 from 100 XP (level 1 → 2)", () => {
    expect(xpToNextLevel(100)).toBe(300);
  });

  it("decreases as you earn XP within a level", () => {
    expect(xpToNextLevel(200)).toBe(200);
  });
});

describe("levelProgress", () => {
  it("returns 0 at a level boundary", () => {
    expect(levelProgress(100)).toBe(0);
  });

  it("returns 50 halfway through a level", () => {
    // Level 1: 100..400, midpoint = 250
    expect(levelProgress(250)).toBe(50);
  });

  it("clamps to 100", () => {
    expect(levelProgress(0)).toBeLessThanOrEqual(100);
  });
});
