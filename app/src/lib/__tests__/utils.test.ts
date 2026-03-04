import { describe, it, expect } from "vitest";
import { truncateAddress, formatXp, getLevel, getLevelProgress } from "../utils";

describe("truncateAddress", () => {
  it("produces abc...xyz format with default 4 chars", () => {
    const addr = "abcdefgh12345678xyz1";
    const result = truncateAddress(addr);
    expect(result).toBe("abcd...xyz1");
    // last 4 chars of "abcdefgh12345678xyz1" → "xyz1"
  });

  it("uses default 4 chars on each side", () => {
    const addr = "11111111111111111111111111111111"; // 32 chars
    const result = truncateAddress(addr);
    expect(result).toMatch(/^1111\.\.\.1111$/);
  });

  it("uses custom chars parameter", () => {
    const addr = "AABBCCDD11223344";
    const result = truncateAddress(addr, 2);
    expect(result).toBe("AA...44");
  });

  it("includes the ellipsis separator", () => {
    const result = truncateAddress("ABCDEFGHIJKLMNOP", 3);
    expect(result).toContain("...");
  });
});

describe("formatXp", () => {
  it("formats values under 1000 as plain numbers", () => {
    expect(formatXp(0)).toBe("0");
    expect(formatXp(500)).toBe("500");
    expect(formatXp(999)).toBe("999");
  });

  it("formats thousands with K suffix", () => {
    expect(formatXp(1000)).toBe("1.0K");
    expect(formatXp(1500)).toBe("1.5K");
    expect(formatXp(999999)).toBe("1000.0K");
  });

  it("formats millions with M suffix", () => {
    expect(formatXp(1_000_000)).toBe("1.0M");
    expect(formatXp(2_500_000)).toBe("2.5M");
  });
});

describe("getLevel", () => {
  it("returns 0 for 0 XP", () => {
    expect(getLevel(0)).toBe(0);
  });

  it("returns 0 for XP below first threshold (100)", () => {
    expect(getLevel(99)).toBe(0);
  });

  it("returns 1 at exactly 100 XP", () => {
    // floor(sqrt(100/100)) = floor(sqrt(1)) = 1
    expect(getLevel(100)).toBe(1);
  });

  it("returns 2 at exactly 400 XP", () => {
    // floor(sqrt(400/100)) = floor(sqrt(4)) = 2
    expect(getLevel(400)).toBe(2);
  });

  it("returns 10 at exactly 10000 XP", () => {
    // floor(sqrt(10000/100)) = floor(sqrt(100)) = 10
    expect(getLevel(10000)).toBe(10);
  });

  it("matches floor(sqrt(xp/100))", () => {
    for (const xp of [0, 50, 100, 300, 500, 1000, 9999]) {
      expect(getLevel(xp)).toBe(Math.floor(Math.sqrt(xp / 100)));
    }
  });
});

describe("getLevelProgress", () => {
  it("returns 0 at the start of level 0", () => {
    expect(getLevelProgress(0)).toBe(0);
  });

  it("returns 0 at the start of level 1 (100 XP)", () => {
    // level=1, currentLevelXp=100, nextLevelXp=400 → (100-100)/(400-100) = 0
    expect(getLevelProgress(100)).toBe(0);
  });

  it("returns 0.5 halfway through a level", () => {
    // level=1, currentLevelXp=100, nextLevelXp=400 → midpoint=250
    // (250-100)/(400-100) = 150/300 = 0.5 → 50
    expect(getLevelProgress(250)).toBeCloseTo(50);
  });

  it("returns a value in [0, 1) range for any XP below next level threshold", () => {
    const progress = getLevelProgress(399);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it("returns 0 at the start of a new level", () => {
    // At 400 XP, level=2 (floor(sqrt(4))=2), so progress resets to 0
    // currentLevelXp=400, nextLevelXp=900 → (400-400)/(900-400) = 0
    expect(getLevelProgress(400)).toBe(0);
  });
});
