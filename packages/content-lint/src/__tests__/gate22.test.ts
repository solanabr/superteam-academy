import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate22-harness";
import { makeTempRepo } from "./helpers";

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
sourceLocale: en
xpPerLesson: 10
xpReward: 100
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;

function lessonYaml(buildType: string) {
  return `id: lesson-a
slug: a
title: A
skills: [general]
blocks:
  - key: exercise
    type: code
    language: rust
    buildType: ${buildType}
    starter: exercise/starter.rs
    solution: exercise/solution.rs
    tests: exercise/tests.json
`;
}

const RULE = "// ─────────────────────────────────────────";
const MARKER =
  "// VERIFICATION HARNESS — DO NOT EDIT ANYTHING BELOW THIS LINE.";

const WITH_HARNESS = [
  "use anchor_lang::prelude::*;",
  "// TODO: add `ping`.",
  RULE,
  MARKER,
  "// A type check.",
  RULE,
  "mod verify {",
  "    const PING: fn() = first_program::ping;",
  "}",
  "",
].join("\n");

const NO_HARNESS = "use anchor_lang::prelude::*;\n// TODO: add `ping`.\n";

const EMPTY_HARNESS = [
  "use anchor_lang::prelude::*;",
  RULE,
  MARKER,
  "// nothing but prose down here",
  "",
].join("\n");

const tests = JSON.stringify([
  { id: "t1", description: "compiles", input: "", expectedOutput: "true" },
]);

function tree(starter: string, buildType = "buildable") {
  return {
    "courses/x/course.yaml": course,
    "courses/x/lessons/a/lesson.yaml": lessonYaml(buildType),
    "courses/x/lessons/a/exercise/starter.rs": starter,
    "courses/x/lessons/a/exercise/solution.rs": starter,
    "courses/x/lessons/a/exercise/tests.json": tests,
  };
}

function gate22(diagnostics: { gate: string; severity: string }[]) {
  return diagnostics.filter(
    (d) => d.gate === "gate-22" && d.severity === "error"
  );
}

describe("gate 22 — buildable starters ship a verification harness", () => {
  it("passes a buildable starter that carries a harness", async () => {
    const r = await runLint(makeTempRepo(tree(WITH_HARNESS)));
    expect(gate22(r.diagnostics)).toEqual([]);
  });

  it("errors when a buildable starter has no harness marker", async () => {
    const r = await runLint(makeTempRepo(tree(NO_HARNESS)));
    expect(gate22(r.diagnostics)).toHaveLength(1);
    expect(gate22(r.diagnostics)[0]).toMatchObject({
      gate: "gate-22",
    });
  });

  it("errors when the harness region is only prose", async () => {
    const r = await runLint(makeTempRepo(tree(EMPTY_HARNESS)));
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-22" && /empty/i.test(d.message)
      )
    ).toBe(true);
  });

  it("ignores non-buildable code blocks", async () => {
    const r = await runLint(makeTempRepo(tree(NO_HARNESS, "standard")));
    expect(gate22(r.diagnostics)).toEqual([]);
  });
});
