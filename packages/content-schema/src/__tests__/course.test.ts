import { describe, it, expect } from "vitest";
import { Course } from "../course";

const base = {
  id: "course-solana-fundamentals",
  slug: "solana-fundamentals",
  title: "Solana Fundamentals",
  difficulty: "beginner",
  duration: 6,
  xpPerLesson: 10,
  xpReward: 600,
  creator: { githubId: "12345678" },
  modules: [
    { key: "basics", title: "The Basics", lessons: ["lesson-accounts"] },
  ],
};

describe("Course", () => {
  it("accepts a minimal course with inline modules", () => {
    expect(Course.parse(base).modules[0]!.key).toBe("basics");
  });

  it("enforces the on-chain xpPerLesson range", () => {
    expect(Course.safeParse({ ...base, xpPerLesson: 0 }).success).toBe(false);
    expect(Course.safeParse({ ...base, xpPerLesson: 101 }).success).toBe(false);
    expect(Course.safeParse({ ...base, xpPerLesson: 100 }).success).toBe(true);
  });

  it("rejects duplicate module keys", () => {
    const bad = { ...base, modules: [base.modules[0], base.modules[0]] };
    expect(Course.safeParse(bad).success).toBe(false);
  });

  it("rejects the same lesson appearing twice across modules", () => {
    const bad = {
      ...base,
      modules: [
        { key: "a", title: "A", lessons: ["lesson-accounts"] },
        { key: "b", title: "B", lessons: ["lesson-accounts"] },
      ],
    };
    expect(Course.safeParse(bad).success).toBe(false);
  });

  it("requires a numeric githubId string", () => {
    expect(
      Course.safeParse({ ...base, creator: { githubId: "octocat" } }).success
    ).toBe(false);
  });

  it("rejects more lessons than the on-chain bitmap can hold", () => {
    const lessons = Array.from({ length: 257 }, (_, i) => `lesson-l${i}`);
    const bad = { ...base, modules: [{ key: "m", title: "M", lessons }] };
    expect(Course.safeParse(bad).success).toBe(false);
  });

  it("rejects a course that can never be finalized (xpPerLesson × lessonCount > 10000)", () => {
    // 101 lessons × 100 xp = 10100 → bonus 5050 > MAX_XP_PER_MINT → finalize reverts forever
    const lessons = Array.from({ length: 101 }, (_, i) => `lesson-l${i}`);
    const bad = {
      ...base,
      xpPerLesson: 100,
      modules: [{ key: "m", title: "M", lessons }],
    };
    expect(Course.safeParse(bad).success).toBe(false);
  });

  it("accepts the boundary (product exactly 10000)", () => {
    const lessons = Array.from({ length: 100 }, (_, i) => `lesson-l${i}`);
    const ok = {
      ...base,
      xpPerLesson: 100,
      modules: [{ key: "m", title: "M", lessons }],
    };
    expect(Course.safeParse(ok).success).toBe(true);
  });
});
