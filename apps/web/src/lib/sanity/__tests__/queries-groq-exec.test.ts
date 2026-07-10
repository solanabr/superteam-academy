/* eslint-disable import/order -- vi.mock must precede importing ../queries. */
import { describe, it, expect, vi } from "vitest";
import { parse, evaluate } from "groq-js";

// EXECUTE the real GROQ (Sanity's reference engine) against a fixture, instead
// of string-matching the query text — the only way to catch silent-null
// projection bugs (a missing field or an unresolved `^` type-checks and
// string-matches fine, but returns wrong data at runtime).
const DATASET = [
  {
    _type: "course",
    _id: "course-x",
    slug: { current: "course-x" },
    onChainStatus: { status: "synced", isActive: true },
    modules: [
      {
        _key: "m1",
        key: "mod-1",
        lessons: [
          { _type: "reference", _ref: "les-quiz" },
          { _type: "reference", _ref: "les-code" },
        ],
      },
    ],
  },
  // Module-less course: injects a null element into a flattened modules[]
  // traversal — the BUG 2 crash source.
  {
    _type: "course",
    _id: "course-empty",
    slug: { current: "course-empty" },
    onChainStatus: { status: "synced", isActive: true },
  },
  {
    _type: "lesson",
    _id: "les-quiz",
    slug: { current: "lesson-quiz" },
    blocks: [
      {
        _key: "q1",
        _type: "quiz",
        questions: [
          {
            id: "qq1",
            prompt: "Pick",
            multiSelect: false,
            options: [
              { id: "a", label: "A", correct: true },
              { id: "b", label: "B", correct: false },
            ],
            explanation: "because A",
          },
        ],
      },
    ],
  },
  {
    _type: "lesson",
    _id: "les-code",
    slug: { current: "lesson-code" },
    blocks: [
      {
        _key: "c1",
        _type: "code",
        language: "typescript",
        starter: "x",
        solution: "y",
        tests: [{ id: "t", description: "d", input: "1", expectedOutput: "2" }],
      },
    ],
  },
];

vi.mock("../client", () => ({
  sanityFetch: async (query: string, params?: Record<string, unknown>) => {
    const tree = parse(query);
    return (await (
      await evaluate(tree, { dataset: DATASET, params })
    ).get()) as unknown;
  },
}));

import { getLessonBySlug, getAllQuests } from "../queries";

describe("BUG 1 — lesson projection carries quiz questions", () => {
  it("projects a quiz block's questions[] as a populated array (not undefined)", async () => {
    const lesson = await getLessonBySlug("course-x", "lesson-quiz");
    expect(lesson).not.toBeNull();
    const quiz = lesson!.blocks.find((b) => b._type === "quiz");
    expect(quiz).toBeDefined();
    // Regression: lessonFields omitted `questions`, so the renderer's
    // `b.questions.map(...)` threw and the quiz grader got undefined → 503.
    const questions = (quiz as { questions?: unknown }).questions;
    expect(Array.isArray(questions)).toBe(true);
    expect(questions).toHaveLength(1);
    const q0 = (questions as Array<{ options: unknown[] }>)[0]!;
    expect(q0.options).toHaveLength(2);
    // D4: answers are public by design — `correct` IS present, and stays.
    expect(
      (q0.options as Array<{ id: string; correct: boolean }>).some(
        (o) => o.id === "a" && o.correct === true
      )
    ).toBe(true);
  });
});

describe("BUG 2 — moduleLessonMap resolves the course parent + survives module-less courses", () => {
  it("yields a non-null composite id and does not throw on a module-less course", async () => {
    // Regression: `^._id` did not resolve in a flattened `.modules[]` traversal
    // (→ null ids), and a module-less course injected a null element that made
    // the JS post-processing throw → /api/quests/daily 500.
    const data = await getAllQuests();

    // challengeLessonIds already correct — the code-block lesson is present.
    expect(data.challengeLessonIds).toContain("les-code");

    // Exactly one usable module (course-x:mod-1); the module-less course
    // contributes nothing and does not crash.
    expect(data.moduleLessonMap).toEqual([
      { id: "course-x:mod-1", lessonIds: ["les-quiz", "les-code"] },
    ]);
    for (const m of data.moduleLessonMap) {
      expect(m.id).not.toBeNull();
      expect(m.id.startsWith("course-x:")).toBe(true);
    }
  });
});
