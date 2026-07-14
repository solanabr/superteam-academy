import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate5-orphans";
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

describe("gate 5 — orphans", () => {
  it("errors on a file that no block references", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/slots.lock.json": JSON.stringify({
        version: 1,
        slots: { "lesson-a": 0 },
        retired: [],
        next: 1,
      }),
      "courses/x/lessons/a/lesson.yaml": `id: lesson-a
slug: a
title: A
skills: [general]
blocks: [{ type: prose, key: intro, src: intro.md }]
`,
      "courses/x/lessons/a/intro.md": "# a",
      "courses/x/lessons/a/leftover.ts": "// nobody references this",
    });
    const r = await runLint(root);
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-5" && /leftover\.ts/.test(d.message)
      )
    ).toBe(true);
  });

  it("does not flag an asset referenced from markdown", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/slots.lock.json": JSON.stringify({
        version: 1,
        slots: { "lesson-a": 0 },
        retired: [],
        next: 1,
      }),
      "courses/x/lessons/a/lesson.yaml": `id: lesson-a
slug: a
title: A
skills: [general]
blocks: [{ type: prose, key: intro, src: intro.md }]
`,
      "courses/x/lessons/a/intro.md":
        "# a\n\n![diagram](assets/accounts.png)\n",
      "courses/x/lessons/a/assets/accounts.png": "PNG",
    });
    const r = await runLint(root);
    expect(r.diagnostics.filter((d) => d.gate === "gate-5")).toEqual([]);
  });
});
