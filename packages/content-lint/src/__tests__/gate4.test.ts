import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate4-refs";
import { makeTempRepo } from "./helpers";

describe("gate 4 — cross-references", () => {
  it("errors on a lesson id referenced by a module but absent from the repo", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [lesson-ghost] }]
`,
    });
    const r = await runLint(root);
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-4" && /lesson-ghost/.test(d.message)
      )
    ).toBe(true);
  });

  it("errors on a path referencing a missing course", async () => {
    const root = makeTempRepo({
      "paths/p.yaml": `id: path-p
slug: p
title: P
difficulty: beginner
courses: [course-missing]
`,
    });
    const r = await runLint(root);
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-4" && /course-missing/.test(d.message)
      )
    ).toBe(true);
  });
});
