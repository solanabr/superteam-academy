import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
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
modules: [{ key: m, title: M, lessons: [lesson-a, lesson-b] }]
`;
const lesson = (id: string) => `id: ${id}
slug: ${id.replace("lesson-", "")}
title: ${id}
blocks: [{ type: prose, key: intro, src: intro.md }]
`;

const correctLock = JSON.stringify({
  version: 1,
  slots: { "lesson-a": 0, "lesson-b": 1 },
  retired: [],
  next: 2,
});

describe("gate 3 — slots", () => {
  const tree = (lock: string) => ({
    "courses/x/course.yaml": course,
    "courses/x/slots.lock.json": lock,
    "courses/x/lessons/a/lesson.yaml": lesson("lesson-a"),
    "courses/x/lessons/a/intro.md": "# a",
    "courses/x/lessons/b/lesson.yaml": lesson("lesson-b"),
    "courses/x/lessons/b/intro.md": "# b",
  });

  /** A temp repo committed on `main` — a resolvable base ref for the immutability diff. */
  const gitRepo = (lock: string): { root: string } => {
    const root = makeTempRepo(tree(lock));
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: root, stdio: "ignore" });
    git("init", "-q");
    git("config", "user.email", "t@t.t");
    git("config", "user.name", "t");
    git("add", "-A");
    git("commit", "-qm", "c1");
    git("branch", "-M", "main");
    return { root };
  };

  it("passes when the lock matches the base regeneration", async () => {
    const { root } = gitRepo(correctLock);
    const r = await runLint(root, { baseRef: "main" });
    expect(r.diagnostics.filter((d) => d.gate === "gate-3")).toEqual([]);
  });

  it("errors when a slot was renumbered against the base", async () => {
    // Base (committed on main) is correct; the working tree renumbers lesson-a.
    const { root } = gitRepo(correctLock);
    writeFileSync(
      join(root, "courses/x/slots.lock.json"),
      JSON.stringify({
        version: 1,
        slots: { "lesson-a": 5, "lesson-b": 1 },
        retired: [],
        next: 6,
      }),
      "utf8"
    );
    const r = await runLint(root, { baseRef: "main" });
    expect(
      r.diagnostics.some((d) => d.gate === "gate-3" && d.severity === "error")
    ).toBe(true);
  });

  it("errors when a new lesson is missing from the lock", async () => {
    // course.yaml lists lesson-a + lesson-b but the committed lock only has lesson-a.
    const { root } = gitRepo(
      JSON.stringify({
        version: 1,
        slots: { "lesson-a": 0 },
        retired: [],
        next: 1,
      })
    );
    const r = await runLint(root, { baseRef: "main" });
    expect(
      r.diagnostics.some((d) => d.gate === "gate-3" && d.severity === "error")
    ).toBe(true);
  });

  it("the mismatch remedy never suggests regenerating a deployed lock (#737)", async () => {
    const { root } = gitRepo(correctLock);
    writeFileSync(
      join(root, "courses/x/slots.lock.json"),
      JSON.stringify({
        version: 1,
        slots: { "lesson-a": 5, "lesson-b": 1 },
        retired: [],
        next: 6,
      }),
      "utf8"
    );
    const r = await runLint(root, { baseRef: "main" });
    const msg = r.diagnostics.find(
      (d) => d.gate === "gate-3" && d.severity === "error"
    )?.message;
    expect(msg).toBeDefined();
    // The destructive suggestion is gone; the invariant + a DANGER note replace it.
    expect(msg).not.toMatch(/content:slots/);
    expect(msg).not.toMatch(/Run `/);
    expect(msg).toMatch(/DANGER/);
    expect(msg).toMatch(/invariant/i);
    expect(msg).toMatch(/by hand/i);
    // The DANGER note states the generic truth, not a fabricated enrollment count —
    // it fires for every mismatching course, including a zero-enrollment new one.
    // (Digits still legitimately appear in the trailing Expected-lock JSON.)
    expect(msg).toMatch(/every already-enrolled learner/i);
    expect(msg).not.toMatch(/\d+\+?\s*(?:live\s+)?learner/i); // no hardcoded count e.g. "38+ learners"
  });

  it("skips (warning, never error) when no base ref is resolvable — #737", async () => {
    // A renumbered lock that WOULD be a mismatch, but with no git repo and no base
    // ref there is nothing to diff against: gate-3 must not fabricate a failure.
    const root = makeTempRepo(
      tree(
        JSON.stringify({
          version: 1,
          slots: { "lesson-a": 5, "lesson-b": 1 },
          retired: [],
          next: 6,
        })
      )
    );
    const r = await runLint(root); // no baseRef, not a git repo
    expect(
      r.diagnostics.filter((d) => d.gate === "gate-3" && d.severity === "error")
    ).toEqual([]);
    expect(
      r.diagnostics.some(
        (d) =>
          d.gate === "gate-3" &&
          d.severity === "warning" &&
          /no base ref/i.test(d.message)
      )
    ).toBe(true);
  });

  it("still errors on a genuinely missing lock even with no base ref", async () => {
    const t = tree(correctLock) as Record<string, string>;
    delete t["courses/x/slots.lock.json"];
    const root = makeTempRepo(t);
    const r = await runLint(root); // no baseRef
    expect(
      r.diagnostics.some(
        (d) =>
          d.gate === "gate-3" &&
          d.severity === "error" &&
          /missing slots\.lock\.json/i.test(d.message)
      )
    ).toBe(true);
  });

  it("fails CLOSED when an explicit base ref is set but unresolvable — #737 (no fail-open)", async () => {
    // CI sets LINT_BASE_REF but the ref was never fetched (e.g. a shallow/no fetch).
    // Slot immutability cannot be checked, and a skip here would fail OPEN, silently
    // disabling the hard gate. It must ERROR, not warn.
    const { root } = gitRepo(correctLock);
    // Renumber a slot to prove the gate would otherwise have work to do.
    writeFileSync(
      join(root, "courses/x/slots.lock.json"),
      JSON.stringify({
        version: 1,
        slots: { "lesson-a": 9, "lesson-b": 1 },
        retired: [],
        next: 10,
      }),
      "utf8"
    );
    const r = await runLint(root, { baseRef: "origin/does-not-exist" });
    expect(
      r.diagnostics.some(
        (d) =>
          d.gate === "gate-3" &&
          d.severity === "error" &&
          /misconfiguration/i.test(d.message)
      )
    ).toBe(true);
    // Never a soft warning-skip for an explicitly-requested-but-missing base.
    expect(
      r.diagnostics.some((d) => d.gate === "gate-3" && d.severity === "warning")
    ).toBe(false);
  });

  it("tells you to RESTORE a deleted deployed lock, never regenerate it — #737", async () => {
    // Base (main) has the lock; the working tree deletes it. This is an
    // accidentally-deleted deployed course, not a new one.
    const { root } = gitRepo(correctLock);
    unlinkSync(join(root, "courses/x/slots.lock.json"));
    const r = await runLint(root, { baseRef: "main" });
    const msg = r.diagnostics.find(
      (d) => d.gate === "gate-3" && d.severity === "error"
    )?.message;
    expect(msg).toBeDefined();
    expect(msg).toMatch(/deleted/i);
    expect(msg).toMatch(/restore/i);
    // Must NOT suggest generating a fresh lock for a course that was deployed.
    expect(msg).not.toMatch(/generated from its lesson order/i);
  });

  it("resolves origin/main locally so a correct lock passes with no explicit base ref", async () => {
    // Simulate a fresh clone: a bare invocation (no GITHUB_BASE_REF) must resolve
    // origin/main and validate the lock instead of regenerating it from scratch.
    const { root } = gitRepo(correctLock);
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: root, stdio: "ignore" });
    // Make origin/main a real remote-tracking ref pointing at the same commit.
    git("update-ref", "refs/remotes/origin/main", "main");
    git("symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/main");
    const r = await runLint(root); // no explicit baseRef
    expect(r.diagnostics.filter((d) => d.gate === "gate-3")).toEqual([]);
  });

  it("emits a warning (never silent) when no exact merge-base exists", async () => {
    const root = makeTempRepo(tree(correctLock));
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
