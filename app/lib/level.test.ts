import { describe, it, expect } from "vitest";
import {
  getLevel,
  getXpForLevel,
  getXpForNextLevel,
  getLevelProgress,
} from "./level";

describe("getLevel", () => {
  it("returns 0 at 0 xp", () => {
    expect(getLevel(0)).toBe(0);
  });

  it("returns 0 at 99 xp", () => {
    expect(getLevel(99)).toBe(0);
  });

  it("returns 1 at 100 xp", () => {
    expect(getLevel(100)).toBe(1);
  });

  it("returns 10 at 10000 xp", () => {
    expect(getLevel(10000)).toBe(10);
  });

  it("returns 9 at 9999 xp", () => {
    expect(getLevel(9999)).toBe(9);
  });

  it("returns 31 at 100000 xp", () => {
    expect(getLevel(100000)).toBe(31);
  });
});

describe("getXpForLevel", () => {
  it("returns 0 for level 0", () => {
    expect(getXpForLevel(0)).toBe(0);
  });

  it("returns 100 for level 1", () => {
    expect(getXpForLevel(1)).toBe(100);
  });

  it("returns 10000 for level 10", () => {
    expect(getXpForLevel(10)).toBe(10000);
  });
});

describe("getXpForNextLevel", () => {
  it("returns 100 from 0 xp", () => {
    expect(getXpForNextLevel(0)).toBe(100);
  });

  it("returns 400 from 100 xp", () => {
    expect(getXpForNextLevel(100)).toBe(400);
  });

  it("returns 400 from 200 xp", () => {
    expect(getXpForNextLevel(200)).toBe(400);
  });
});

describe("getLevelProgress", () => {
  it("returns 0 at 0 xp", () => {
    expect(getLevelProgress(0)).toBe(0);
  });

  it("returns 0.5 at 50 xp", () => {
    expect(getLevelProgress(50)).toBe(0.5);
  });

  it("returns 0 at level boundary", () => {
    expect(getLevelProgress(100)).toBe(0);
  });

  it("returns close to 1 near next level", () => {
    const progress = getLevelProgress(399);
    expect(progress).toBeGreaterThan(0.99);
    expect(progress).toBeLessThan(1);
  });
});
