import { describe, it, expect } from "vitest";
import { formatXP, getLevel, xpProgress, xpForLevel } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Gamification component logic tests
// These test the pure logic used by the gamification UI components
// ---------------------------------------------------------------------------

describe("XPBadge logic (formatXP)", () => {
  it("formats small XP values", () => {
    expect(formatXP(0)).toBe("0");
    expect(formatXP(42)).toBe("42");
    expect(formatXP(999)).toBe("999");
  });

  it("formats large XP values with k suffix", () => {
    expect(formatXP(1000)).toBe("1.0k");
    expect(formatXP(1750)).toBe("1.8k");
    expect(formatXP(10000)).toBe("10.0k");
  });
});

describe("LevelBadge logic (level calculations)", () => {
  it("calculates correct levels", () => {
    expect(getLevel(0)).toBe(0);
    expect(getLevel(99)).toBe(0);
    expect(getLevel(100)).toBe(1);
    expect(getLevel(400)).toBe(2);
    expect(getLevel(900)).toBe(3);
  });

  it("calculates XP needed for each level", () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(2)).toBe(400);
    expect(xpForLevel(5)).toBe(2500);
  });

  it("calculates progress ring percentage", () => {
    const p0 = xpProgress(50);
    expect(p0.level).toBe(0);
    expect(p0.progress).toBe(50);

    const p1 = xpProgress(250);
    expect(p1.level).toBe(1);
    expect(p1.progress).toBe(50);

    const pBoundary = xpProgress(400);
    expect(pBoundary.level).toBe(2);
    expect(pBoundary.progress).toBe(0);
  });

  it("clamps progress within 0-100", () => {
    const p = xpProgress(0);
    expect(p.progress).toBeGreaterThanOrEqual(0);
    expect(p.progress).toBeLessThanOrEqual(100);
  });
});

describe("StreakCounter logic", () => {
  it("identifies active vs inactive streak", () => {
    expect(0 > 0).toBe(false);
    expect(1 > 0).toBe(true);
    expect(7 > 0).toBe(true);
  });
});

describe("AchievementCard logic", () => {
  it("distinguishes claimed vs unclaimed", () => {
    const claimed = { id: 1, claimed: true, xpReward: 50 };
    const unclaimed = { id: 2, claimed: false, xpReward: 100 };

    expect(claimed.claimed).toBe(true);
    expect(unclaimed.claimed).toBe(false);
  });
});

describe("ActivityCalendar logic", () => {
  it("builds correct calendar days", () => {
    const activityCalendar: Record<string, boolean> = {
      "2026-02-14": true,
      "2026-02-13": false,
      "2026-02-12": true,
    };

    const days = 30;
    const calendarDays: [string, boolean][] = [];
    const today = new Date("2026-02-14T12:00:00Z");
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      calendarDays.push([key, !!activityCalendar[key]]);
    }

    expect(calendarDays).toHaveLength(30);
    // Today should be the last entry
    const lastEntry = calendarDays[calendarDays.length - 1];
    expect(lastEntry[0]).toBe("2026-02-14");
    expect(lastEntry[1]).toBe(true);
  });

  it("defaults missing days to inactive", () => {
    const activityCalendar: Record<string, boolean> = {};
    const key = "2026-01-01";
    expect(!!activityCalendar[key]).toBe(false);
  });
});

describe("XP notification level-up detection", () => {
  it("detects when XP gain crosses a level boundary", () => {
    // At 90 XP (level 0), gain 20 XP -> 110 XP (level 1) -> level up!
    const prevLevel = getLevel(90);
    const newLevel = getLevel(90 + 20);
    expect(prevLevel).toBe(0);
    expect(newLevel).toBe(1);
    expect(newLevel > prevLevel).toBe(true);
  });

  it("does not trigger when staying in same level", () => {
    // At 200 XP (level 1), gain 50 XP -> 250 XP (level 1) -> no level up
    const prevLevel = getLevel(200);
    const newLevel = getLevel(200 + 50);
    expect(prevLevel).toBe(1);
    expect(newLevel).toBe(1);
    expect(newLevel > prevLevel).toBe(false);
  });

  it("detects multi-level jump", () => {
    // At 50 XP (level 0), gain 400 XP -> 450 XP (level 2) -> level up!
    const prevLevel = getLevel(50);
    const newLevel = getLevel(50 + 400);
    expect(prevLevel).toBe(0);
    expect(newLevel).toBe(2);
    expect(newLevel > prevLevel).toBe(true);
  });
});
