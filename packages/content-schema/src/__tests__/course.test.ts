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
  modules: [
    { key: "basics", title: "The Basics", lessons: ["lesson-accounts"] },
  ],
};

describe("Course", () => {
  it("accepts a minimal course with inline modules", () => {
    expect(Course.parse(base).modules[0]!.key).toBe("basics");
  });

  it("accepts an optional thumbnail path and rejects an empty one", () => {
    expect(
      Course.parse({ ...base, thumbnail: "assets/thumbnail.png" }).thumbnail
    ).toBe("assets/thumbnail.png");
    expect(Course.parse(base).thumbnail).toBeUndefined();
    expect(Course.safeParse({ ...base, thumbnail: "" }).success).toBe(false);
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

  it("accepts an optional on-curve `creator` wallet", () => {
    const wallet = "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF";
    expect(Course.parse({ ...base, creator: wallet }).creator).toBe(wallet);
    expect(Course.parse(base).creator).toBeUndefined();
  });

  it("rejects a malformed `creator` (not a valid on-curve wallet)", () => {
    expect(
      Course.safeParse({ ...base, creator: { githubId: "12345678" } }).success
    ).toBe(false);
    expect(Course.safeParse({ ...base, creator: "not-a-wallet" }).success).toBe(
      false
    );
  });

  it("strips a legacy `instructor` field rather than rejecting it", () => {
    // `instructor` was removed in favor of `creator` (issue #478). Course is
    // non-strict, so a stale field from pre-migration content is dropped, not
    // an error — the schema-first rollout tolerates today's content.
    const parsed = Course.parse({ ...base, instructor: "instructor-ana" });
    expect("instructor" in parsed).toBe(false);
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
