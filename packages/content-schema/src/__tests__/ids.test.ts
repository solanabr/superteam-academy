import { describe, it, expect } from "vitest";
import {
  CourseId,
  LessonId,
  AchievementId,
  PathId,
  BlockKey,
  byteLength,
} from "../ids";

describe("byteLength", () => {
  it("counts UTF-8 bytes, not code units", () => {
    expect(byteLength("abc")).toBe(3);
    expect(byteLength("é")).toBe(2);
  });
});

describe("CourseId", () => {
  it("accepts a conventional id", () => {
    expect(CourseId.parse("course-solana-fundamentals")).toBe(
      "course-solana-fundamentals"
    );
  });

  it("accepts the longest live id (29 bytes)", () => {
    expect(CourseId.parse("course-building-first-program")).toBeTruthy();
  });

  it("rejects an id over the 32-byte PDA seed limit", () => {
    // 33 bytes
    const tooLong = "course-" + "a".repeat(26);
    expect(byteLength(tooLong)).toBe(33);
    expect(CourseId.safeParse(tooLong).success).toBe(false);
  });

  it("rejects a missing prefix", () => {
    expect(CourseId.safeParse("solana-fundamentals").success).toBe(false);
  });

  it("rejects uppercase and underscores", () => {
    expect(CourseId.safeParse("course-Solana").success).toBe(false);
    expect(CourseId.safeParse("course-solana_x").success).toBe(false);
  });

  it("rejects the legacy Studio-generated id", () => {
    // aD45H1NEbb1bqELwloGCqI — migrated to course-solana-101 per spec §15.5
    expect(CourseId.safeParse("aD45H1NEbb1bqELwloGCqI").success).toBe(false);
  });
});

describe("AchievementId", () => {
  it("requires the achievement- prefix and fits the seed limit", () => {
    expect(AchievementId.parse("achievement-first-steps")).toBeTruthy();
    expect(AchievementId.safeParse("first-steps").success).toBe(false);
    expect(
      AchievementId.safeParse("achievement-" + "a".repeat(21)).success
    ).toBe(false);
  });
});

describe("LessonId", () => {
  it("requires the lesson- prefix", () => {
    expect(LessonId.parse("lesson-accounts")).toBeTruthy();
    expect(LessonId.safeParse("accounts").success).toBe(false);
  });
});

describe("PathId", () => {
  it("uses the path- prefix, not learningPath-", () => {
    expect(PathId.parse("path-solana-core")).toBeTruthy();
    expect(PathId.safeParse("learningPath-solana-core").success).toBe(false);
  });
});

describe("BlockKey", () => {
  it("accepts kebab-case keys", () => {
    expect(BlockKey.parse("intro")).toBe("intro");
    expect(BlockKey.parse("check-accounts")).toBe("check-accounts");
    expect(BlockKey.safeParse("Intro").success).toBe(false);
  });
});
