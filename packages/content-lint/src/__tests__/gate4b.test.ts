import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate4b-path-lifecycle";
import { makeTempRepo } from "./helpers";

const course = (id: string) => `id: ${id}
slug: ${id.replace("course-", "")}
title: ${id}
difficulty: beginner
duration: 1
sourceLocale: en
xpPerLesson: 10
xpReward: 100
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;

const path = (id: string, body: string) => `id: ${id}
slug: ${id.replace("path-", "")}
title: ${id}
difficulty: beginner
${body}
`;

const pick =
  (gate: string) =>
  (
    r: Awaited<ReturnType<typeof runLint>>
  ): { severity: string; message: string }[] =>
    r.diagnostics.filter((d) => d.gate === gate);

const g4b = pick("gate-4b");
const g1 = pick("gate-1");

describe("gate 4b — path lifecycle flags", () => {
  it("passes a populated path with neither flag", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course("course-x"),
      "paths/p.yaml": path("path-p", "courses: [course-x]"),
    });
    expect(g4b(await runLint(root))).toEqual([]);
  });

  it("errors on the implicit-retirement pattern: draft: true with no courses", async () => {
    const root = makeTempRepo({
      "paths/p.yaml": path("path-p", "draft: true\ncourses: []"),
    });
    const d = g4b(await runLint(root));
    expect(d).toHaveLength(1);
    expect(d[0]!.severity).toBe("error");
    expect(d[0]!.message).toContain("retired: true");
  });

  it("passes an empty path that declares retired: true", async () => {
    const root = makeTempRepo({
      "paths/p.yaml": path("path-p", "retired: true\ncourses: []"),
    });
    const r = await runLint(root);
    expect(g4b(r)).toEqual([]);
    expect(g1(r)).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("errors when a retired path still lists courses", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course("course-x"),
      "paths/p.yaml": path("path-p", "retired: true\ncourses: [course-x]"),
    });
    const d = g4b(await runLint(root));
    expect(d).toHaveLength(1);
    expect(d[0]!.severity).toBe("error");
  });

  it("warns (does not fail) when draft and retired are both set", async () => {
    const root = makeTempRepo({
      "paths/p.yaml": path("path-p", "draft: true\nretired: true\ncourses: []"),
    });
    const r = await runLint(root);
    const d = g4b(r);
    expect(d).toHaveLength(1);
    expect(d[0]!.severity).toBe("warning");
    expect(r.ok).toBe(true);
  });

  it("still rejects an empty path with no lifecycle flag at all (gate 1)", async () => {
    const root = makeTempRepo({
      "paths/p.yaml": path("path-p", "courses: []"),
    });
    const r = await runLint(root);
    // Schema refusal, so the doc never reaches gate 4b.
    expect(g1(r)).toHaveLength(1);
    expect(r.ok).toBe(false);
  });
});
