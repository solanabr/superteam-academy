import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate4a-award-refs";
import { makeTempRepo } from "./helpers";

const course = (id: string) => `id: ${id}
slug: ${id.replace("course-", "")}
title: ${id}
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;

const path = (id: string, courses: string[]) => `id: ${id}
slug: ${id.replace("path-", "")}
title: ${id}
difficulty: beginner
courses: [${courses.join(", ")}]
`;

/** A schema-valid empty path — allowed only as an explicit draft. */
const draftEmptyPath = (id: string) => `id: ${id}
slug: ${id.replace("path-", "")}
title: ${id}
difficulty: beginner
draft: true
`;

const achievement = (id: string, award: string) => `id: ${id}
name: ${id}
category: progress
xpReward: 50
award: ${award}
`;

const g4a = (
  r: Awaited<ReturnType<typeof runLint>>
): { severity: string; message: string }[] =>
  r.diagnostics.filter((d) => d.gate === "gate-4a");

describe("gate 4a — achievement award refs", () => {
  it("passes when course-completed names an existing course", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course("course-x"),
      "achievements/a.yaml": achievement(
        "achievement-a",
        "{ kind: course-completed, course: course-x }"
      ),
    });
    expect(g4a(await runLint(root))).toEqual([]);
  });

  it("errors when course-completed names a missing course", async () => {
    const root = makeTempRepo({
      "achievements/a.yaml": achievement(
        "achievement-a",
        "{ kind: course-completed, course: course-ghost }"
      ),
    });
    const d = g4a(await runLint(root));
    expect(
      d.some((x) => x.severity === "error" && /course-ghost/.test(x.message))
    ).toBe(true);
  });

  it("errors when lessons-completed-in-course names a missing course", async () => {
    const root = makeTempRepo({
      "achievements/a.yaml": achievement(
        "achievement-a",
        "{ kind: lessons-completed-in-course, course: course-ghost, gte: 3 }"
      ),
    });
    const d = g4a(await runLint(root));
    expect(
      d.some((x) => x.severity === "error" && /course-ghost/.test(x.message))
    ).toBe(true);
  });

  it("passes when path-completed names an existing non-empty path", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course("course-x"),
      "paths/p.yaml": path("path-p", ["course-x"]),
      "achievements/a.yaml": achievement(
        "achievement-a",
        "{ kind: path-completed, path: path-p }"
      ),
    });
    expect(g4a(await runLint(root))).toEqual([]);
  });

  it("errors when path-completed names a missing path", async () => {
    const root = makeTempRepo({
      "achievements/a.yaml": achievement(
        "achievement-a",
        "{ kind: path-completed, path: path-ghost }"
      ),
    });
    const d = g4a(await runLint(root));
    expect(
      d.some((x) => x.severity === "error" && /path-ghost/.test(x.message))
    ).toBe(true);
  });

  it("errors when path-completed names an existing but EMPTY path — the #559 unearnable case", async () => {
    // A drafted / emptied path is schema-valid but buildUserState never completes
    // it (courseIds.length > 0 is required), so the award can never fire.
    const root = makeTempRepo({
      "paths/p.yaml": draftEmptyPath("path-empty"),
      "achievements/a.yaml": achievement(
        "achievement-a",
        "{ kind: path-completed, path: path-empty }"
      ),
    });
    const d = g4a(await runLint(root));
    expect(
      d.some(
        (x) =>
          x.severity === "error" &&
          /path-empty/.test(x.message) &&
          /no courses|never be unlocked/.test(x.message)
      )
    ).toBe(true);
  });

  it("ignores award kinds that reference no content id", async () => {
    const root = makeTempRepo({
      "achievements/lc.yaml": achievement(
        "achievement-lc",
        "{ kind: lessons-completed, gte: 5 }"
      ),
      "achievements/st.yaml": achievement(
        "achievement-st",
        "{ kind: streak, days: 7 }"
      ),
      "achievements/un.yaml": achievement(
        "achievement-un",
        "{ kind: user-number, lte: 100 }"
      ),
      "achievements/mn.yaml": achievement("achievement-mn", "{ kind: manual }"),
    });
    expect(g4a(await runLint(root))).toEqual([]);
  });
});
