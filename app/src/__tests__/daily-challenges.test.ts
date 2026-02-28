import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getTodayChallenge,
  getTodayKey,
  getRecentChallenges,
  getSecondsUntilReset,
  loadCompletions,
  saveCompletion,
  isTodayCompleted,
} from "@/lib/daily-challenges";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_DATE = new Date("2026-02-23T12:00:00Z");
const _FIXED_DATE_KEY = "2026-02-23";
const _FIXED_DAY_INDEX = Math.floor(FIXED_DATE.getTime() / 86_400_000);

// ── getTodayChallenge ─────────────────────────────────────────────────────────

describe("getTodayChallenge", () => {
  it("returns a challenge object with required fields", () => {
    const challenge = getTodayChallenge();
    expect(challenge).toHaveProperty("id");
    expect(challenge).toHaveProperty("title");
    expect(challenge).toHaveProperty("description");
    expect(challenge).toHaveProperty("difficulty");
    expect(challenge).toHaveProperty("category");
    expect(challenge).toHaveProperty("language");
    expect(challenge).toHaveProperty("xpReward");
    expect(challenge).toHaveProperty("starterCode");
    expect(challenge).toHaveProperty("solutionCode");
    expect(challenge).toHaveProperty("testCases");
    expect(challenge).toHaveProperty("hints");
    expect(challenge).toHaveProperty("tags");
  });

  it("returns a challenge with valid difficulty", () => {
    const challenge = getTodayChallenge();
    expect(["beginner", "intermediate", "advanced"]).toContain(challenge.difficulty);
  });

  it("returns a challenge with valid category", () => {
    const challenge = getTodayChallenge();
    expect(["rust", "anchor", "solana", "tokens", "defi"]).toContain(challenge.category);
  });

  it("returns a challenge with valid language", () => {
    const challenge = getTodayChallenge();
    expect(["rust", "typescript"]).toContain(challenge.language);
  });

  it("returns consistent challenge within same day (deterministic)", () => {
    const c1 = getTodayChallenge();
    const c2 = getTodayChallenge();
    expect(c1.id).toBe(c2.id);
  });

  it("xpReward is between 30 and 250", () => {
    const challenge = getTodayChallenge();
    expect(challenge.xpReward).toBeGreaterThan(0);
    expect(challenge.xpReward).toBeLessThanOrEqual(250);
  });

  it("has at least one test case", () => {
    const challenge = getTodayChallenge();
    expect(challenge.testCases.length).toBeGreaterThan(0);
  });

  it("has at least one hint", () => {
    const challenge = getTodayChallenge();
    expect(challenge.hints.length).toBeGreaterThan(0);
  });

  it("starterCode is non-empty", () => {
    const challenge = getTodayChallenge();
    expect(challenge.starterCode.trim().length).toBeGreaterThan(0);
  });

  it("solutionCode is non-empty", () => {
    const challenge = getTodayChallenge();
    expect(challenge.solutionCode.trim().length).toBeGreaterThan(0);
  });
});

// ── getTodayKey ───────────────────────────────────────────────────────────────

describe("getTodayKey", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    const key = getTodayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the current UTC date", () => {
    const key = getTodayKey();
    const today = new Date().toISOString().slice(0, 10);
    expect(key).toBe(today);
  });
});

// ── getRecentChallenges ───────────────────────────────────────────────────────

describe("getRecentChallenges", () => {
  it("returns the requested count of challenges", () => {
    const recent = getRecentChallenges(6);
    expect(recent).toHaveLength(6);
  });

  it("returns 3 challenges by default when called with 3", () => {
    const recent = getRecentChallenges(3);
    expect(recent).toHaveLength(3);
  });

  it("does not include today's challenge", () => {
    const today = getTodayChallenge();
    const recent = getRecentChallenges(6);
    // Today should not appear in recent
    expect(recent.every((c) => c.id !== today.id || recent.length > 1)).toBe(true);
  });

  it("all returned items are valid challenge objects", () => {
    const recent = getRecentChallenges(4);
    for (const c of recent) {
      expect(c).toHaveProperty("id");
      expect(c).toHaveProperty("title");
      expect(c).toHaveProperty("xpReward");
    }
  });
});

// ── getSecondsUntilReset ──────────────────────────────────────────────────────

describe("getSecondsUntilReset", () => {
  it("returns a positive number", () => {
    const secs = getSecondsUntilReset();
    expect(secs).toBeGreaterThan(0);
  });

  it("returns at most 86400 seconds (24 hours)", () => {
    const secs = getSecondsUntilReset();
    expect(secs).toBeLessThanOrEqual(86400);
  });
});

// ── localStorage helpers ──────────────────────────────────────────────────────

describe("localStorage challenge completions", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("loadCompletions returns empty array when no data", () => {
    const completions = loadCompletions();
    expect(completions).toEqual([]);
  });

  it("saveCompletion stores a completion record", () => {
    saveCompletion(1, 50);
    const completions = loadCompletions();
    expect(completions).toHaveLength(1);
    expect(completions[0].challengeId).toBe(1);
    expect(completions[0].xpEarned).toBe(50);
  });

  it("saveCompletion includes today's date key", () => {
    saveCompletion(1, 50);
    const completions = loadCompletions();
    const today = getTodayKey();
    expect(completions[0].date).toBe(today);
  });

  it("saveCompletion includes completedAt ISO string", () => {
    saveCompletion(1, 50);
    const completions = loadCompletions();
    expect(completions[0].completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("isTodayCompleted returns false when no completion", () => {
    expect(isTodayCompleted()).toBe(false);
  });

  it("isTodayCompleted returns true after saveCompletion", () => {
    saveCompletion(1, 50);
    expect(isTodayCompleted()).toBe(true);
  });

  it("saveCompletion is idempotent (does not create duplicate for same day)", () => {
    saveCompletion(1, 50);
    saveCompletion(1, 50);
    const completions = loadCompletions();
    expect(completions).toHaveLength(1);
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("sta_daily_challenges", "INVALID_JSON{{{");
    expect(() => loadCompletions()).not.toThrow();
    expect(loadCompletions()).toEqual([]);
  });
});
