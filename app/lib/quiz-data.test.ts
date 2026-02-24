import { describe, it, expect } from "vitest";
import { hasQuiz, verifyAnswers, QUIZ_DATA } from "./quiz-data";

describe("hasQuiz", () => {
  it("returns true for existing quiz", () => {
    expect(hasQuiz("solana-101", 0)).toBe(true);
  });

  it("returns true for all 15 lessons across 3 courses", () => {
    for (const courseId of ["solana-101", "anchor-101", "defi-fundamentals"]) {
      for (let i = 0; i < 5; i++) {
        expect(hasQuiz(courseId, i)).toBe(true);
      }
    }
  });

  it("returns false for unknown course", () => {
    expect(hasQuiz("fake-course", 0)).toBe(false);
  });

  it("returns false for out-of-bounds lesson", () => {
    expect(hasQuiz("solana-101", 99)).toBe(false);
  });
});

describe("verifyAnswers", () => {
  it("accepts correct answers", () => {
    expect(verifyAnswers("solana-101", 0, [1])).toBe(true);
  });

  it("rejects wrong answer", () => {
    expect(verifyAnswers("solana-101", 0, [0])).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(verifyAnswers("solana-101", 0, [1, 1])).toBe(false);
  });

  it("rejects empty answers", () => {
    expect(verifyAnswers("solana-101", 0, [])).toBe(false);
  });

  it("returns false for unknown course", () => {
    expect(verifyAnswers("fake-course", 0, [1])).toBe(false);
  });

  it("verifies all 15 quizzes with correct answers", () => {
    for (const [courseId, lessons] of Object.entries(QUIZ_DATA)) {
      for (const [lessonIdx, questions] of Object.entries(lessons)) {
        const correct = questions.map((q) => q.correctIndex);
        expect(verifyAnswers(courseId, Number(lessonIdx), correct)).toBe(true);
      }
    }
  });
});
