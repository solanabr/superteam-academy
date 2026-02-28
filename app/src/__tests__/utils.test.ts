import { describe, it, expect } from "vitest";
import { cn, formatXP, xpProgress, truncateAddress, getLevel, xpForLevel } from "@/lib/utils";

// ---------------------------------------------------------------------------
// formatXP
// ---------------------------------------------------------------------------

describe("formatXP", () => {
  it("returns plain number string for values below 1000", () => {
    expect(formatXP(0)).toBe("0");
    expect(formatXP(1)).toBe("1");
    expect(formatXP(500)).toBe("500");
    expect(formatXP(999)).toBe("999");
  });

  it("formats values >= 1000 with 'k' suffix and one decimal place", () => {
    expect(formatXP(1000)).toBe("1.0k");
    expect(formatXP(1500)).toBe("1.5k");
    expect(formatXP(2750)).toBe("2.8k"); // 2750/1000 = 2.75 -> toFixed(1) = "2.8"
    expect(formatXP(10000)).toBe("10.0k");
    expect(formatXP(12345)).toBe("12.3k");
  });

  it("handles exact thousands cleanly", () => {
    expect(formatXP(3000)).toBe("3.0k");
    expect(formatXP(100000)).toBe("100.0k");
  });
});

// ---------------------------------------------------------------------------
// getLevel
// ---------------------------------------------------------------------------

describe("getLevel", () => {
  it("returns 0 for 0 XP", () => {
    expect(getLevel(0)).toBe(0);
  });

  it("returns 0 for XP less than 100 (level 1 threshold)", () => {
    expect(getLevel(50)).toBe(0);
    expect(getLevel(99)).toBe(0);
  });

  it("returns 1 at exactly 100 XP", () => {
    expect(getLevel(100)).toBe(1);
  });

  it("returns correct levels at thresholds", () => {
    // level 2 = sqrt(xp/100) >= 2 => xp >= 400
    expect(getLevel(400)).toBe(2);
    // level 3 = xp >= 900
    expect(getLevel(900)).toBe(3);
    // level 10 = xp >= 10000
    expect(getLevel(10000)).toBe(10);
  });

  it("floors partial levels", () => {
    expect(getLevel(350)).toBe(1); // sqrt(3.5) = 1.87 -> floor = 1
    expect(getLevel(500)).toBe(2); // sqrt(5) = 2.23 -> floor = 2
  });
});

// ---------------------------------------------------------------------------
// xpForLevel
// ---------------------------------------------------------------------------

describe("xpForLevel", () => {
  it("returns 0 for level 0", () => {
    expect(xpForLevel(0)).toBe(0);
  });

  it("returns level^2 * 100", () => {
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(2)).toBe(400);
    expect(xpForLevel(3)).toBe(900);
    expect(xpForLevel(5)).toBe(2500);
    expect(xpForLevel(10)).toBe(10000);
  });
});

// ---------------------------------------------------------------------------
// xpProgress
// ---------------------------------------------------------------------------

describe("xpProgress", () => {
  it("returns level 0 progress for 0 XP", () => {
    const result = xpProgress(0);
    expect(result.level).toBe(0);
    expect(result.currentLevelXp).toBe(0);   // xpForLevel(0) = 0
    expect(result.nextLevelXp).toBe(100);     // xpForLevel(1) = 100
    expect(result.progress).toBe(0);
  });

  it("returns 50% progress when halfway between level thresholds", () => {
    // Level 0 range: 0 to 100. Halfway = 50 XP
    const result = xpProgress(50);
    expect(result.level).toBe(0);
    expect(result.progress).toBe(50);
  });

  it("returns correct progress at a level boundary", () => {
    // At exactly 100 XP: level 1, currentLevelXp = 100, nextLevelXp = 400
    // progress = (100 - 100) / (400 - 100) * 100 = 0
    const result = xpProgress(100);
    expect(result.level).toBe(1);
    expect(result.currentLevelXp).toBe(100);
    expect(result.nextLevelXp).toBe(400);
    expect(result.progress).toBe(0);
  });

  it("computes fractional progress within a level", () => {
    // At 250 XP: level 1 (sqrt(2.5) = 1.58, floor = 1)
    // currentLevelXp = 100, nextLevelXp = 400
    // progress = (250 - 100) / (400 - 100) * 100 = 150/300 * 100 = 50
    const result = xpProgress(250);
    expect(result.level).toBe(1);
    expect(result.progress).toBe(50);
  });

  it("handles higher levels correctly", () => {
    // At 1000 XP: level 3 (sqrt(10) = 3.16, floor = 3)
    // currentLevelXp = 900, nextLevelXp = 1600
    // progress = (1000 - 900) / (1600 - 900) * 100 = 100/700 * 100 ~ 14.2857
    const result = xpProgress(1000);
    expect(result.level).toBe(3);
    expect(result.currentLevelXp).toBe(900);
    expect(result.nextLevelXp).toBe(1600);
    expect(result.progress).toBeCloseTo(14.2857, 2);
  });
});

// ---------------------------------------------------------------------------
// truncateAddress
// ---------------------------------------------------------------------------

describe("truncateAddress", () => {
  const address = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

  it("truncates with default of 4 characters on each side", () => {
    expect(truncateAddress(address)).toBe("7xKX...gAsU");
    // First 4 chars + "..." + last 4 chars
    expect(truncateAddress(address)).toBe(
      `${address.slice(0, 4)}...${address.slice(-4)}`
    );
  });

  it("truncates with custom char count", () => {
    expect(truncateAddress(address, 6)).toBe(
      `${address.slice(0, 6)}...${address.slice(-6)}`
    );
  });

  it("works with a short address and small char count", () => {
    expect(truncateAddress("abcdef", 2)).toBe("ab...ef");
  });

  it("handles char count of 1", () => {
    expect(truncateAddress("abcdef", 1)).toBe("a...f");
  });
});

// ---------------------------------------------------------------------------
// cn (class name merger)
// ---------------------------------------------------------------------------

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates conflicting tailwind classes (tailwind-merge)", () => {
    // tailwind-merge should pick the last conflicting utility
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles arrays and objects from clsx", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
    expect(cn({ active: true, disabled: false })).toBe("active");
  });
});
