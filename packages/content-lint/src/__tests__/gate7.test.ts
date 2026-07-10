import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate7-quiz";
import { makeTempRepo } from "./helpers";

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;

describe("gate 7 — quiz", () => {
  it("surfaces a quiz-specific message for an inline quiz block with no correct option", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": `id: lesson-a
slug: a
title: A
blocks:
  - key: check
    type: quiz
    questions:
      - id: q1
        prompt: pick
        multiSelect: false
        options:
          - { id: a, label: A, correct: false }
          - { id: b, label: B, correct: false }
`,
    });
    const r = await runLint(root);
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-7" && /correct/i.test(d.message)
      )
    ).toBe(true);
  });
});
