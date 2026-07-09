import { describe, it, expect } from "vitest";
import { QuizBlock } from "../blocks/quiz";

const q = (over: Record<string, unknown> = {}) => ({
  type: "quiz" as const,
  key: "check",
  questions: [
    {
      id: "q1",
      prompt: "Which accounts store state?",
      multiSelect: false,
      options: [
        { id: "a", label: "Data accounts", correct: true },
        {
          id: "b",
          label: "Instructions",
          correct: false,
          feedback: "Those are inputs.",
        },
      ],
      explanation: "Data accounts hold state.",
      ...over,
    },
  ],
});

describe("QuizBlock", () => {
  it("accepts a single-select question", () => {
    expect(QuizBlock.parse(q()).questions[0]!.id).toBe("q1");
  });

  it("keeps per-option feedback and the general explanation as separate channels", () => {
    const b = QuizBlock.parse(q());
    expect(b.questions[0]!.options[1]!.feedback).toBe("Those are inputs.");
    expect(b.questions[0]!.explanation).toBe("Data accounts hold state.");
  });

  it("rejects a question with no correct option", () => {
    const bad = q({ options: [{ id: "a", label: "x", correct: false }] });
    expect(QuizBlock.safeParse(bad).success).toBe(false);
  });

  it("rejects two correct options when multiSelect is false", () => {
    const bad = q({
      options: [
        { id: "a", label: "x", correct: true },
        { id: "b", label: "y", correct: true },
      ],
    });
    expect(QuizBlock.safeParse(bad).success).toBe(false);
  });

  it("accepts two correct options when multiSelect is true", () => {
    const ok = q({
      multiSelect: true,
      options: [
        { id: "a", label: "x", correct: true },
        { id: "b", label: "y", correct: true },
      ],
    });
    expect(QuizBlock.safeParse(ok).success).toBe(true);
  });

  it("rejects duplicate option ids", () => {
    const bad = q({
      options: [
        { id: "a", label: "x", correct: true },
        { id: "a", label: "y", correct: false },
      ],
    });
    expect(QuizBlock.safeParse(bad).success).toBe(false);
  });

  it("rejects duplicate question ids", () => {
    const one = QuizBlock.parse(q()).questions[0]!;
    const bad = { type: "quiz", key: "check", questions: [one, one] };
    expect(QuizBlock.safeParse(bad).success).toBe(false);
  });

  it("requires at least one question", () => {
    expect(
      QuizBlock.safeParse({ type: "quiz", key: "check", questions: [] }).success
    ).toBe(false);
  });
});
