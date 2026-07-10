import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate13bcd-widgets";
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
const explorerLesson = `id: lesson-a
slug: a
title: A
blocks:
  - { key: explore, type: program-explorer, idl: program.idl.json, consumes: [deployed-program] }
`;

describe("gate 13c — program.idl.json", () => {
  it("errors on an idl with an empty instructions array", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": explorerLesson,
      "courses/x/lessons/a/program.idl.json": JSON.stringify({
        instructions: [],
        metadata: { name: "x" },
      }),
    });
    const r = await runLint(root);
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-13c" && /instructions/.test(d.message)
      )
    ).toBe(true);
  });

  it("passes a well-formed idl", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": explorerLesson,
      "courses/x/lessons/a/program.idl.json": JSON.stringify({
        instructions: [{ name: "init" }],
        metadata: { name: "counter" },
      }),
    });
    const r = await runLint(root);
    expect(r.diagnostics.filter((d) => d.gate === "gate-13c")).toEqual([]);
  });
});

describe("gate 13d — slot exhaustion", () => {
  it("warns (not errors) when next exceeds 200", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": `id: lesson-a
slug: a
title: A
blocks: [{ type: prose, key: intro, src: intro.md }]
`,
      "courses/x/lessons/a/intro.md": "# a",
      "courses/x/slots.lock.json": JSON.stringify({
        version: 1,
        slots: { "lesson-a": 0 },
        retired: [],
        next: 201,
      }),
    });
    const r = await runLint(root);
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-13d" && d.severity === "warning"
      )
    ).toBe(true);
    expect(
      r.diagnostics.filter(
        (d) => d.gate === "gate-13d" && d.severity === "error"
      )
    ).toEqual([]);
  });
});
