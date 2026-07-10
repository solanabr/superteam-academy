import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate2-ids";
import { makeTempRepo } from "./helpers";

const course = (id: string) => `id: ${id}
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;

describe("gate 2 — ids", () => {
  it("errors on a duplicate course id", async () => {
    const root = makeTempRepo({
      "courses/a/course.yaml": course("course-dupe"),
      "courses/b/course.yaml": course("course-dupe"),
    });
    const r = await runLint(root);
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-2" && /duplicate/i.test(d.message)
      )
    ).toBe(true);
  });

  it("errors on a mutated id vs the git base", async () => {
    const root = makeTempRepo({
      "courses/a/course.yaml": course("course-original"),
    });
    const git = (...args: string[]) => execFileSync("git", args, { cwd: root });
    git("init", "-q");
    git("config", "user.email", "t@t.t");
    git("config", "user.name", "t");
    git("add", "-A");
    git("commit", "-qm", "base");
    // Head mutates the id (immutable → hard fail).
    writeFileSync(
      join(root, "courses/a/course.yaml"),
      course("course-renamed"),
      "utf8"
    );
    const r = await runLint(root, { baseRef: "HEAD" });
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-2" && /immutable|changed/i.test(d.message)
      )
    ).toBe(true);
  });
});
