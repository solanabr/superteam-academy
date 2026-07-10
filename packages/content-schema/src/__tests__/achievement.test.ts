import { describe, it, expect } from "vitest";
import { Achievement, Award, AWARD_KINDS } from "../achievement";

const base = {
  id: "achievement-first-steps",
  name: "First Steps",
  category: "progress",
  xpReward: 50,
};

describe("Award", () => {
  it("covers every kind the code must implement", () => {
    expect([...AWARD_KINDS].sort()).toEqual([
      "community-stat",
      "course-completed",
      "lessons-completed",
      "lessons-completed-in-course",
      "manual",
      "path-completed",
      "streak",
      "user-number",
    ]);
  });

  it("accepts course-completed with a real course id", () => {
    expect(
      Award.parse({
        kind: "course-completed",
        course: "course-anchor-framework",
      }).kind
    ).toBe("course-completed");
  });

  it("rejects course-completed without a course", () => {
    expect(Award.safeParse({ kind: "course-completed" }).success).toBe(false);
  });

  it("accepts path-completed, replacing the hardcoded SOLANA_DEV_PATH_COURSES", () => {
    expect(
      Award.safeParse({ kind: "path-completed", path: "path-solana-core" })
        .success
    ).toBe(true);
  });

  it("rejects an unknown kind", () => {
    expect(Award.safeParse({ kind: "vibes" }).success).toBe(false);
  });

  it("accepts manual with no parameters", () => {
    expect(Award.parse({ kind: "manual" }).kind).toBe("manual");
  });

  it("restricts community-stat to real UserState fields", () => {
    expect(
      Award.safeParse({
        kind: "community-stat",
        stat: "acceptedAnswers",
        gte: 5,
      }).success
    ).toBe(true);
    expect(
      Award.safeParse({ kind: "community-stat", stat: "vibes", gte: 5 }).success
    ).toBe(false);
  });
});

describe("Achievement", () => {
  it("requires an award kind — no achievement may be unearnable by accident", () => {
    expect(Achievement.safeParse(base).success).toBe(false);
  });

  it("accepts a declarative achievement", () => {
    const a = Achievement.parse({
      ...base,
      award: { kind: "lessons-completed", gte: 1 },
    });
    expect(a.award.kind).toBe("lessons-completed");
  });

  it("caps xpReward at the on-chain mint ceiling", () => {
    expect(
      Achievement.safeParse({
        ...base,
        award: { kind: "manual" },
        xpReward: 5001,
      }).success
    ).toBe(false);
    expect(
      Achievement.safeParse({ ...base, award: { kind: "manual" }, xpReward: 0 })
        .success
    ).toBe(false);
  });
});
