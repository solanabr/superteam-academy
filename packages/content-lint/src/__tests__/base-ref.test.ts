import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate3-slots";
import { normalizeBaseRef } from "../base-ref";
import { makeTempRepo } from "./helpers";

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
sourceLocale: en
xpPerLesson: 10
xpReward: 100
modules: [{ key: m, title: M, lessons: [lesson-a, lesson-b] }]
`;
const lesson = (id: string) => `id: ${id}
slug: ${id.replace("lesson-", "")}
title: ${id}
blocks: [{ type: prose, key: intro, src: intro.md }]
`;
const lock = JSON.stringify({
  version: 1,
  slots: { "lesson-a": 0, "lesson-b": 1 },
  retired: [],
  next: 2,
});

/**
 * A committed repo whose base branch is reachable both as a bare-named remote
 * branch (`origin/release/1.0`) and as the default `origin/main`.
 */
function repoWithBranches(): string {
  const root = makeTempRepo({
    "courses/x/course.yaml": course,
    "courses/x/slots.lock.json": lock,
    "courses/x/lessons/a/lesson.yaml": lesson("lesson-a"),
    "courses/x/lessons/a/intro.md": "# a",
    "courses/x/lessons/b/lesson.yaml": lesson("lesson-b"),
    "courses/x/lessons/b/intro.md": "# b",
  });
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: root, stdio: "ignore" });
  git("init", "-q");
  git("config", "user.email", "t@t.t");
  git("config", "user.name", "t");
  git("add", "-A");
  git("commit", "-qm", "c1");
  git("branch", "-M", "main");
  // Remote-tracking refs, as a fetch-depth:0 checkout would have.
  git("update-ref", "refs/remotes/origin/main", "main");
  git("update-ref", "refs/remotes/origin/release/1.0", "main");
  return root;
}

describe("normalizeBaseRef (#748)", () => {
  it("prefixes origin/ onto a bare branch name WITH a slash", () => {
    const root = repoWithBranches();
    expect(normalizeBaseRef("release/1.0", root)).toBe("origin/release/1.0");
  });

  it("prefixes origin/ onto a plain bare branch name (unchanged behavior)", () => {
    const root = repoWithBranches();
    expect(normalizeBaseRef("main", root)).toBe("origin/main");
  });

  it("passes an already origin-qualified ref through verbatim", () => {
    const root = repoWithBranches();
    expect(normalizeBaseRef("origin/main", root)).toBe("origin/main");
  });

  it("passes a full-SHA base through verbatim", () => {
    const root = repoWithBranches();
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root })
      .toString()
      .trim();
    expect(normalizeBaseRef(sha, root)).toBe(sha);
  });

  it("returns undefined for no ref (bare local run)", () => {
    const root = repoWithBranches();
    expect(normalizeBaseRef(undefined, root)).toBeUndefined();
  });

  it("keeps #747 fail-closed for a genuinely unresolvable slashed ref", () => {
    const root = repoWithBranches();
    // origin/release/9.9 does not exist; must NOT silently pass — it stays
    // origin-qualified so the gate's hard error names it (never bare/verbatim).
    expect(normalizeBaseRef("release/9.9", root)).toBe("origin/release/9.9");
  });

  it("never falls through to a LOCAL branch shadowing the base name — stays fail-closed (#761 review)", () => {
    const root = repoWithBranches();
    // A local branch named "release" exists, but there is NO origin/release. A bare
    // branch name must not resolve against the (possibly stale) local branch.
    execFileSync("git", ["branch", "release"], { cwd: root, stdio: "ignore" });
    expect(normalizeBaseRef("release", root)).toBe("origin/release");
  });

  it("a base shadowed only by a local branch still fails CLOSED end-to-end (#747)", async () => {
    const root = repoWithBranches();
    execFileSync("git", ["branch", "release"], { cwd: root, stdio: "ignore" });
    const baseRef = normalizeBaseRef("release", root); // origin/release, unresolvable
    const r = await runLint(root, { baseRef });
    expect(
      r.diagnostics.some(
        (d) =>
          d.gate === "gate-3" &&
          d.severity === "error" &&
          /misconfiguration/i.test(d.message)
      )
    ).toBe(true);
  });

  it("resolves a slashed base end-to-end: gate-3 runs (no misconfiguration error)", async () => {
    const root = repoWithBranches();
    const baseRef = normalizeBaseRef("release/1.0", root);
    const r = await runLint(root, { baseRef });
    expect(
      r.diagnostics.filter((d) => d.gate === "gate-3" && d.severity === "error")
    ).toEqual([]);
  });

  it("a genuinely unresolvable base still fails CLOSED end-to-end (#747 message)", async () => {
    const root = repoWithBranches();
    const baseRef = normalizeBaseRef("release/9.9", root); // origin/release/9.9
    const r = await runLint(root, { baseRef });
    expect(
      r.diagnostics.some(
        (d) =>
          d.gate === "gate-3" &&
          d.severity === "error" &&
          /misconfiguration/i.test(d.message)
      )
    ).toBe(true);
  });
});
