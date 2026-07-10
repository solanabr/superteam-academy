import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema"; // registers the schema check
import { makeTempRepo } from "./helpers";

const okCourse = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
modules:
  - key: m
    title: M
    lessons: [lesson-a]
`;

describe("gate 1 — schema validation", () => {
  it("passes a well-formed course", async () => {
    const root = makeTempRepo({ "courses/x/course.yaml": okCourse });
    const r = await runLint(root);
    expect(r.diagnostics.filter((d) => d.gate === "gate-1")).toEqual([]);
  });

  it("errors on a course missing a required field", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": okCourse.replace("title: X\n", ""),
    });
    const r = await runLint(root);
    const g1 = r.diagnostics.filter((d) => d.gate === "gate-1");
    expect(g1).toHaveLength(1);
    expect(g1[0]!.file).toBe("courses/x/course.yaml");
    expect(r.ok).toBe(false);
  });

  it("errors on a quiz with two correct options when multiSelect is false", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": okCourse,
      "courses/x/lessons/a/check.quiz.yaml": `key: check
questions:
  - id: q1
    prompt: pick one
    multiSelect: false
    options:
      - { id: a, label: A, correct: true }
      - { id: b, label: B, correct: true }
`,
    });
    const r = await runLint(root);
    const g1 = r.diagnostics.filter(
      (d) => d.gate === "gate-1" && d.file.endsWith("check.quiz.yaml")
    );
    expect(g1).toHaveLength(1);
  });
});
