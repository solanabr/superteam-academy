// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  bankCompletion,
  readBank,
  removeBanked,
  clearBank,
  hasBankedCompletions,
} from "../progress-bank";

const base = {
  courseId: "solana-101",
  courseSlug: "solana-101",
  lessonSlug: "intro",
  lessonTitle: "Intro",
  proofs: { c1: { code: "ok" } },
};

beforeEach(() => {
  window.localStorage.clear();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("progress-bank round-trip", () => {
  it("banks and reads back an entry with its proofs intact", () => {
    bankCompletion({ ...base, lessonId: "lesson-1" });

    const bank = readBank();
    expect(bank).toHaveLength(1);
    expect(bank[0]!.lessonId).toBe("lesson-1");
    expect(bank[0]!.proofs).toEqual({ c1: { code: "ok" } });
    expect(typeof bank[0]!.bankedAt).toBe("number");
    expect(hasBankedCompletions()).toBe(true);
  });

  it("upserts by course+lesson rather than duplicating", () => {
    bankCompletion({ ...base, lessonId: "lesson-1", proofs: { c1: 1 } });
    bankCompletion({ ...base, lessonId: "lesson-1", proofs: { c1: 2 } });

    const bank = readBank();
    expect(bank).toHaveLength(1);
    expect(bank[0]!.proofs).toEqual({ c1: 2 });
  });

  it("removes a single entry, leaving the rest", () => {
    bankCompletion({ ...base, lessonId: "lesson-1" });
    bankCompletion({ ...base, lessonId: "lesson-2" });

    removeBanked("solana-101", "lesson-1");

    const bank = readBank();
    expect(bank.map((e) => e.lessonId)).toEqual(["lesson-2"]);
  });

  it("clears the whole bank", () => {
    bankCompletion({ ...base, lessonId: "lesson-1" });
    clearBank();
    expect(readBank()).toHaveLength(0);
    expect(hasBankedCompletions()).toBe(false);
  });
});

describe("progress-bank resilience", () => {
  it("returns [] for corrupt storage instead of throwing", () => {
    window.localStorage.setItem("superteam:progress-bank:v1", "{not json");
    expect(readBank()).toEqual([]);
  });

  it("drops entries whose shape is invalid", () => {
    window.localStorage.setItem(
      "superteam:progress-bank:v1",
      JSON.stringify([{ courseId: "x" }, null, 42])
    );
    expect(readBank()).toEqual([]);
  });

  it("prunes entries older than the 30-day hygiene window", () => {
    const stale = {
      ...base,
      lessonId: "old",
      bankedAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
    };
    window.localStorage.setItem(
      "superteam:progress-bank:v1",
      JSON.stringify([stale])
    );
    expect(readBank()).toEqual([]);
  });

  it("orders freshest first", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T10:00:00Z"));
    bankCompletion({ ...base, lessonId: "first" });
    vi.setSystemTime(new Date("2026-07-26T11:00:00Z"));
    bankCompletion({ ...base, lessonId: "second" });

    expect(readBank().map((e) => e.lessonId)).toEqual(["second", "first"]);
  });
});
