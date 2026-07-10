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

  it("compares against the true merge-base (fork point), not the base tip, on a DIVERGED base", async () => {
    // Fork point A: id = course-a. The base branch then diverges (tip id =
    // course-basetip) and the PR head diverges independently (id = course-head).
    // A correct merge-base compares head↔A (course-a); a wrong base-tip
    // comparison would name course-basetip. The assertion pins course-a.
    const root = makeTempRepo({
      "courses/a/course.yaml": course("course-a"),
    });
    const git = (...args: string[]) => execFileSync("git", args, { cwd: root });
    git("init", "-q");
    git("config", "user.email", "t@t.t");
    git("config", "user.name", "t");
    git("add", "-A");
    git("commit", "-qm", "A"); // fork point A
    git("branch", "-M", "main");
    git("branch", "base"); // base points at A

    // Base diverges: tip id becomes course-basetip.
    git("checkout", "-q", "base");
    writeFileSync(
      join(root, "courses/a/course.yaml"),
      course("course-basetip"),
      "utf8"
    );
    git("commit", "-qam", "B");

    // PR head diverges independently and mutates the id to course-head.
    git("checkout", "-q", "main");
    writeFileSync(
      join(root, "courses/a/course.yaml"),
      course("course-head"),
      "utf8"
    );
    git("commit", "-qam", "C");

    const r = await runLint(root, { baseRef: "base" });
    const g2 = r.diagnostics.filter(
      (d) => d.gate === "gate-2" && d.severity === "error"
    );
    // Exactly the fork-point comparison fires: course-a -> course-head.
    expect(g2.some((d) => /"course-a".*"course-head"/.test(d.message))).toBe(
      true
    );
    // The base TIP id must NOT be what we compared against.
    expect(g2.some((d) => /course-basetip/.test(d.message))).toBe(false);
    // Exact merge-base was found — no degrade warning.
    expect(
      r.diagnostics.some((d) => d.gate === "gate-2" && d.severity === "warning")
    ).toBe(false);
  });

  it("emits a warning (never silent) when no exact merge-base exists", async () => {
    // An orphan base branch shares NO history with HEAD, so `git merge-base`
    // fails and the check degrades to the base tip — which must be surfaced.
    const root = makeTempRepo({
      "courses/a/course.yaml": course("course-x"),
    });
    const git = (...args: string[]) => execFileSync("git", args, { cwd: root });
    git("init", "-q");
    git("config", "user.email", "t@t.t");
    git("config", "user.name", "t");
    git("add", "-A");
    git("commit", "-qm", "c1");
    git("branch", "-M", "main");

    // Orphan branch: unrelated root commit, no common ancestor with main.
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
          d.gate === "gate-2" &&
          d.severity === "warning" &&
          /merge-base/i.test(d.message)
      )
    ).toBe(true);
  });
});
