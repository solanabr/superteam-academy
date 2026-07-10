import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate3-slots";
import { makeTempRepo } from "./helpers";

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [lesson-a, lesson-b] }]
`;
const lesson = (id: string) => `id: ${id}
slug: ${id.replace("lesson-", "")}
title: ${id}
blocks: [{ type: prose, key: intro, src: intro.md }]
`;

describe("gate 3 — slots", () => {
  const tree = (lock: string) => ({
    "courses/x/course.yaml": course,
    "courses/x/slots.lock.json": lock,
    "courses/x/lessons/a/lesson.yaml": lesson("lesson-a"),
    "courses/x/lessons/a/intro.md": "# a",
    "courses/x/lessons/b/lesson.yaml": lesson("lesson-b"),
    "courses/x/lessons/b/intro.md": "# b",
  });

  it("passes when the lock matches a fresh regeneration", async () => {
    const lock = JSON.stringify({
      version: 1,
      slots: { "lesson-a": 0, "lesson-b": 1 },
      retired: [],
      next: 2,
    });
    const r = await runLint(makeTempRepo(tree(lock)));
    expect(r.diagnostics.filter((d) => d.gate === "gate-3")).toEqual([]);
  });

  it("errors when a slot was renumbered", async () => {
    const lock = JSON.stringify({
      version: 1,
      slots: { "lesson-a": 5, "lesson-b": 1 },
      retired: [],
      next: 6,
    });
    const r = await runLint(makeTempRepo(tree(lock)));
    expect(r.diagnostics.some((d) => d.gate === "gate-3")).toBe(true);
  });

  it("errors when a new lesson is missing from the lock", async () => {
    const lock = JSON.stringify({
      version: 1,
      slots: { "lesson-a": 0 },
      retired: [],
      next: 1,
    });
    const r = await runLint(makeTempRepo(tree(lock)));
    expect(r.diagnostics.some((d) => d.gate === "gate-3")).toBe(true);
  });

  it("emits a warning (never silent) when no exact merge-base exists", async () => {
    const lock = JSON.stringify({
      version: 1,
      slots: { "lesson-a": 0, "lesson-b": 1 },
      retired: [],
      next: 2,
    });
    const root = makeTempRepo(tree(lock));
    const git = (...args: string[]) => execFileSync("git", args, { cwd: root });
    git("init", "-q");
    git("config", "user.email", "t@t.t");
    git("config", "user.name", "t");
    git("add", "-A");
    git("commit", "-qm", "c1");
    git("branch", "-M", "main");

    // Orphan base: no common ancestor → `git merge-base` fails → degrade.
    git("checkout", "-q", "--orphan", "unrelated");
    git("rm", "-r", "-f", ".");
    writeFileSync(join(root, "readme.txt"), "unrelated\n", "utf8");
    git("add", "-A");
    git("commit", "-qm", "orphan");
    git("checkout", "-q", "main");

    const r = await runLint(root, { baseRef: "unrelated" });
    expect(
      r.diagnostics.some(
        (d) =>
          d.gate === "gate-3" &&
          d.severity === "warning" &&
          /merge-base/i.test(d.message)
      )
    ).toBe(true);
    // A warning must never fail the build.
    expect(
      r.diagnostics.filter((d) => d.gate === "gate-3" && d.severity === "error")
    ).toEqual([]);
  });
});
