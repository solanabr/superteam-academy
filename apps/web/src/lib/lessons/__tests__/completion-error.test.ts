import { describe, it, expect } from "vitest";
import { completionErrorKey } from "../completion-error";

const quizOnly = { hasCodeBlock: false, hasQuizBlock: true };
const codeOnly = { hasCodeBlock: true, hasQuizBlock: false };
const mixed = { hasCodeBlock: true, hasQuizBlock: true };
const proseOnly = { hasCodeBlock: false, hasQuizBlock: false };

describe("completionErrorKey — reason discriminator (#564)", () => {
  it("quiz_failed → quiz copy, NEVER the enrollment copy (the mismap)", () => {
    expect(completionErrorKey(403, "quiz_failed", quizOnly)).toBe(
      "completionFailedQuiz"
    );
    // Mixed code+quiz lesson: a failed quiz must not read as a failed
    // challenge either.
    expect(completionErrorKey(403, "quiz_failed", mixed)).toBe(
      "completionFailedQuiz"
    );
  });

  it("challenge_failed → challenge copy", () => {
    expect(completionErrorKey(403, "challenge_failed", mixed)).toBe(
      "completionFailedChallenge"
    );
  });

  it("reflection_required → reflection copy", () => {
    expect(completionErrorKey(403, "reflection_required", proseOnly)).toBe(
      "completionFailedReflection"
    );
  });

  it("enrollment_missing → enrollment copy regardless of lesson shape", () => {
    expect(completionErrorKey(403, "enrollment_missing", quizOnly)).toBe(
      "completionFailedEnrollment"
    );
    expect(completionErrorKey(403, "enrollment_missing", codeOnly)).toBe(
      "completionFailedEnrollment"
    );
  });
});

describe("completionErrorKey — fallback without a reason (deploy skew)", () => {
  it("code lesson → challenge copy (legacy behavior preserved)", () => {
    expect(completionErrorKey(403, undefined, codeOnly)).toBe(
      "completionFailedChallenge"
    );
  });

  it("quiz-only lesson → quiz copy (the pre-#564 bug said enrollment)", () => {
    expect(completionErrorKey(403, undefined, quizOnly)).toBe(
      "completionFailedQuiz"
    );
  });

  it("no graded blocks → enrollment copy (the only remaining 403 cause)", () => {
    expect(completionErrorKey(403, undefined, proseOnly)).toBe(
      "completionFailedEnrollment"
    );
  });

  it("an unknown reason string falls back like a missing one", () => {
    expect(completionErrorKey(403, "somebody_new", quizOnly)).toBe(
      "completionFailedQuiz"
    );
  });
});

describe("completionErrorKey — non-403 statuses", () => {
  it("429 → rate-limit notice (a throttle is not a failure)", () => {
    expect(completionErrorKey(429, undefined, mixed)).toBe(
      "completionRateLimited"
    );
  });

  it("anything else → generic copy", () => {
    expect(completionErrorKey(500, undefined, mixed)).toBe(
      "completionFailedGeneric"
    );
    expect(completionErrorKey(0, undefined, quizOnly)).toBe(
      "completionFailedGeneric"
    );
  });
});
