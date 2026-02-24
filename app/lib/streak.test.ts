import { describe, it, expect, beforeEach, vi } from "vitest";

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  };
}

function setDate(dateStr: string) {
  vi.setSystemTime(new Date(`${dateStr}T12:00:00Z`));
}

function advanceDays(n: number) {
  const now = vi.getMockedSystemTime() as Date;
  vi.setSystemTime(new Date(now.getTime() + n * 86_400_000));
}

describe("streak", () => {
  let mod: typeof import("./streak");

  beforeEach(async () => {
    vi.useFakeTimers();
    setDate("2025-01-10");
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.resetModules();
    mod = await import("./streak");
  });

  it("initial streak is 0", () => {
    expect(mod.getStreak()).toBe(0);
  });

  it("isActiveToday is false initially", () => {
    expect(mod.isActiveToday()).toBe(false);
  });

  it("recordActivity returns 1 first time", () => {
    expect(mod.recordActivity()).toBe(1);
  });

  it("recordActivity same day returns same count", () => {
    mod.recordActivity();
    expect(mod.recordActivity()).toBe(1);
  });

  it("consecutive days increment streak", () => {
    mod.recordActivity();
    advanceDays(1);
    expect(mod.recordActivity()).toBe(2);
  });

  it("gap > 1 day resets streak", () => {
    mod.recordActivity();
    advanceDays(3);
    expect(mod.recordActivity()).toBe(1);
  });

  it("freeze maintains streak over gap", () => {
    mod.addFreeze(1);
    mod.recordActivity();
    advanceDays(2);
    expect(mod.recordActivity()).toBe(2);
  });

  it("freeze capped at 5", () => {
    mod.addFreeze(10);
    expect(mod.getFreezeCount()).toBe(5);
  });

  it("milestone at day 3 awards freeze", () => {
    mod.recordActivity();
    advanceDays(1);
    mod.recordActivity();
    advanceDays(1);
    const before = mod.getFreezeCount();
    mod.recordActivity(); // day 3
    expect(mod.getFreezeCount()).toBe(before + 1);
  });

  it("milestone at day 7 awards freeze", () => {
    for (let i = 0; i < 7; i++) {
      if (i > 0) advanceDays(1);
      mod.recordActivity();
    }
    // Days 3 and 7 each award 1 freeze
    expect(mod.getFreezeCount()).toBe(2);
  });

  it("getActivityHistory records dates", () => {
    mod.recordActivity();
    expect(mod.getActivityHistory()).toContain("2025-01-10");
  });

  it("getCalendarData returns correct length", () => {
    expect(mod.getCalendarData(7)).toHaveLength(7);
  });

  it("getCalendarData marks active days", () => {
    mod.recordActivity();
    const data = mod.getCalendarData(7);
    expect(data[data.length - 1].active).toBe(true);
  });

  it("getMilestones reflects streak", () => {
    for (let i = 0; i < 7; i++) {
      if (i > 0) advanceDays(1);
      mod.recordActivity();
    }
    const milestones = mod.getMilestones();
    expect(milestones[0].achieved).toBe(true);  // 3 days
    expect(milestones[1].achieved).toBe(true);  // 7 days
    expect(milestones[2].achieved).toBe(false); // 14 days
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("superteam-streak", "not-json{{{");
    expect(mod.getStreak()).toBe(0);
  });
});
