import { describe, it, expect } from "vitest";
import { gradeQuiz } from "../graders/quiz";

const block = {
  _type: "quiz" as const,
  key: "q",
  questions: [
    {
      id: "q1",
      prompt: "?",
      multiSelect: true,
      options: [
        { id: "a", label: "A", correct: true },
        { id: "b", label: "B", correct: true },
        { id: "c", label: "C", correct: false },
      ],
    },
    {
      id: "q2",
      prompt: "?",
      multiSelect: false,
      options: [
        { id: "x", label: "X", correct: true },
        { id: "y", label: "Y", correct: false },
      ],
    },
  ],
};

describe("gradeQuiz", () => {
  it("passes the exact correct set", async () => {
    const r = await gradeQuiz(block, {
      selections: { q1: ["a", "b"], q2: ["x"] },
    });
    expect(r).toEqual({ ok: true });
  });
  it("403 when a multi-select set is incomplete", async () => {
    const r = await gradeQuiz(block, { selections: { q1: ["a"], q2: ["x"] } });
    expect(r).toEqual({ ok: false, status: 403 });
  });
  it("403 when a superset is chosen (extra wrong option)", async () => {
    const r = await gradeQuiz(block, {
      selections: { q1: ["a", "b", "c"], q2: ["x"] },
    });
    expect(r).toEqual({ ok: false, status: 403 });
  });
  it("403 when a question has no selection", async () => {
    const r = await gradeQuiz(block, { selections: { q1: ["a", "b"] } });
    expect(r).toEqual({ ok: false, status: 403 });
  });
  it("403 on a malformed proof", async () => {
    const r = await gradeQuiz(block, { selections: "nope" });
    expect(r).toEqual({ ok: false, status: 403 });
  });
  it("503 when the block has no questions array (unjudgeable)", async () => {
    const r = await gradeQuiz({ _type: "quiz" }, { selections: {} });
    expect(r).toEqual({ ok: false, status: 503 });
  });
});
