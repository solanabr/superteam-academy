import { describe, it, expect } from "vitest";
import { symlinkSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

describe("gate 13c — symlink escape (#381)", () => {
  it("rejects (without reading) a program.idl.json symlink pointing outside the repo", async () => {
    // A file OUTSIDE the content repo entirely. The exploit: a symlink named
    // "program.idl.json" that satisfies the schema's string-only relativePath
    // check while resolving here, hoping its contents leak into a diagnostic.
    const secretDir = mkdtempSync(join(tmpdir(), "content-lint-secret-"));
    const secretPath = join(secretDir, "secret.json");
    writeFileSync(secretPath, '{"leak": "TOP_SECRET_MARKER_1234"}', "utf8");

    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": explorerLesson,
    });
    symlinkSync(secretPath, join(root, "courses/x/lessons/a/program.idl.json"));

    const r = await runLint(root);
    const idlDiags = r.diagnostics.filter((d) => d.gate === "gate-13c");
    expect(idlDiags.some((d) => d.severity === "error")).toBe(true);
    expect(/escape/i.test(idlDiags.map((d) => d.message).join(" "))).toBe(true);
    // The secret must never surface anywhere in the diagnostics.
    expect(
      r.diagnostics.some((d) => d.message.includes("TOP_SECRET_MARKER_1234"))
    ).toBe(false);
  });

  it("rejects a program.idl.json symlink escaping to a sibling lesson dir (still in-repo)", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": explorerLesson,
      "courses/x/lessons/b/program.idl.json": JSON.stringify({
        instructions: [{ name: "init" }],
        metadata: { name: "sibling" },
      }),
    });
    symlinkSync(
      join(root, "courses/x/lessons/b/program.idl.json"),
      join(root, "courses/x/lessons/a/program.idl.json")
    );

    const r = await runLint(root);
    expect(
      r.diagnostics.some((d) => d.gate === "gate-13c" && d.severity === "error")
    ).toBe(true);
  });

  it("emits a generic parse-failure diagnostic that never echoes the parser's error message", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": explorerLesson,
      // Malformed JSON chosen so Node's JSON.parse error text embeds a slice
      // of the source (e.g. `Unexpected token '@', "{"SECRET_abc": @bad}" is
      // not valid JSON`) — unlike a bare truncation error (`Unexpected end of
      // JSON input`), which contains no source bytes and wouldn't catch a
      // regression that interpolates `err.message` into the diagnostic.
      "courses/x/lessons/a/program.idl.json": '{"SECRET_abc": @bad}',
    });

    const r = await runLint(root);
    const idlDiags = r.diagnostics.filter((d) => d.gate === "gate-13c");
    expect(idlDiags.some((d) => d.severity === "error")).toBe(true);
    expect(
      r.diagnostics.some(
        (d) => d.message.includes("SECRET_abc") || d.message.includes("@bad")
      )
    ).toBe(false);
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
