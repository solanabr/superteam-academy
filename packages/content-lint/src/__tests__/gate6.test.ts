import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate6-executor";
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
const lessonYaml = `id: lesson-a
slug: a
title: A
skills: [general]
blocks:
  - key: exercise
    type: code
    language: typescript
    starter: exercise/starter.ts
    solution: exercise/solution.ts
    tests: exercise/tests.json
`;
const tests = JSON.stringify([
  { id: "t1", input: "2, 3", expectedOutput: "result === 5" },
  { id: "t2", input: "10, -4", expectedOutput: "result === 6" },
]);
const SOLUTION = `function add(a: number, b: number): number { return a + b; }\n`;
const STARTER = `function add(a: number, b: number): number { return 0; }\n`;

function tree(starter: string, solution: string) {
  return {
    "courses/x/course.yaml": course,
    "courses/x/lessons/a/lesson.yaml": lessonYaml,
    "courses/x/lessons/a/exercise/starter.ts": starter,
    "courses/x/lessons/a/exercise/solution.ts": solution,
    "courses/x/lessons/a/exercise/tests.json": tests,
  };
}

describe("gate 6 — two-sided JS executor", () => {
  it("passes when solution passes and starter fails", async () => {
    const r = await runLint(makeTempRepo(tree(STARTER, SOLUTION)));
    expect(
      r.diagnostics.filter((d) => d.gate === "gate-6" && d.severity === "error")
    ).toEqual([]);
  });

  it("errors when the starter already passes the tests", async () => {
    const r = await runLint(makeTempRepo(tree(SOLUTION, SOLUTION)));
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-6" && /starter/i.test(d.message)
      )
    ).toBe(true);
  });

  it("errors when the solution fails its own tests", async () => {
    const r = await runLint(makeTempRepo(tree(STARTER, STARTER)));
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-6" && /solution/i.test(d.message)
      )
    ).toBe(true);
  });

  it("defers a rust block with a notice, never an error", async () => {
    const rustLesson = lessonYaml
      .replace("language: typescript", "language: rust")
      .replace("starter.ts", "starter.rs")
      .replace("solution.ts", "solution.rs");
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": rustLesson,
      "courses/x/lessons/a/exercise/starter.rs": "fn add() {}",
      "courses/x/lessons/a/exercise/solution.rs": "fn add() {}",
      "courses/x/lessons/a/exercise/tests.json": tests,
    });
    const r = await runLint(root);
    expect(
      r.diagnostics.some((d) => d.gate === "gate-6" && d.severity === "notice")
    ).toBe(true);
    expect(
      r.diagnostics.filter((d) => d.gate === "gate-6" && d.severity === "error")
    ).toEqual([]);
  });
});
