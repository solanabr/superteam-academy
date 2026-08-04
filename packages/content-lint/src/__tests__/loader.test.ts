import { describe, it, expect } from "vitest";
import { symlinkSync, mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  isCompilerContentDoc,
  isExcludedContentPath,
} from "@superteam-lms/content-schema";
import {
  classify,
  discover,
  walkFiles,
  unclassifiedContentFiles,
} from "../loader";
import { runLint } from "../lint";
import { makeTempRepo } from "./helpers";

describe("discover", () => {
  it("classifies every content file kind by path", () => {
    const root = makeTempRepo({
      "courses/solana-fundamentals/course.yaml":
        "id: course-solana-fundamentals\n",
      "courses/solana-fundamentals/slots.lock.json": "{}\n",
      "courses/solana-fundamentals/lessons/accounts/lesson.yaml":
        "id: lesson-accounts\n",
      "courses/solana-fundamentals/lessons/accounts/check.quiz.yaml":
        "key: check\n",
      "achievements/first-steps.yaml": "id: achievement-first-steps\n",
      "quests/complete-lesson.yaml": "id: quest-complete-lesson\n",
      "paths/solana-core.yaml": "id: path-solana-core\n",
      "README.md": "# ignored\n",
    });
    const kinds = discover(root)
      .map((d) => d.kind)
      .sort();
    expect(kinds).toEqual(
      [
        "achievement",
        "course",
        "lesson",
        "path",
        "quest",
        "quiz",
        "slots",
      ].sort()
    );
  });

  it("reports a YAML parse error rather than throwing", () => {
    const root = makeTempRepo({
      "achievements/x.yaml": "id: : : broken\n  - [\n",
    });
    const doc = discover(root).find((d) => d.kind === "achievement");
    expect(doc?.parseError).toBeTruthy();
  });
});

describe("discover — parked content (#973)", () => {
  it("skips every _draft/ file, in any collection", () => {
    const root = makeTempRepo({
      "courses/live/course.yaml": "id: course-live\n",
      "courses/_draft/parked/course.yaml": "id: course-parked\n",
      "courses/_draft/parked/lessons/x/lesson.yaml": "id: lesson-parked\n",
      "paths/live.yaml": "id: path-live\n",
      "paths/_draft/parked.yaml": "id: path-parked\n",
      "achievements/_draft/parked.yaml": "id: achievement-parked\n",
      "quests/_draft/parked.yaml": "id: quest-parked\n",
    });
    expect(
      discover(root)
        .map((d) => d.path)
        .sort()
    ).toEqual(["courses/live/course.yaml", "paths/live.yaml"]);
  });

  /**
   * These two paths are the ONLY reason `discover`'s `isDraftPath` guard is
   * load-bearing: `classify()` claims them (its `[^/]+` segments happily match
   * `_draft`), so without the guard they are linted as a real course/lesson —
   * duplicate ids against their live twins. Every other `_draft/` fixture above
   * sits at a depth `classify()` already rejects, which is why deleting the
   * guard left the suite green before this test existed.
   */
  it("skips a _draft dir that classify() itself would claim as a course", () => {
    const root = makeTempRepo({
      "courses/_draft/course.yaml": "id: course-parked\n",
    });
    expect(discover(root)).toEqual([]);
  });

  it("skips a _draft dir that classify() itself would claim as a lesson", () => {
    const root = makeTempRepo({
      "courses/live/lessons/_draft/lesson.yaml": "id: lesson-parked\n",
    });
    expect(discover(root)).toEqual([]);
  });

  it("still lints the `courses/_template/` scaffold (unchanged by #973)", () => {
    const root = makeTempRepo({
      "courses/_template/course.yaml": "id: course-template\n",
    });
    expect(discover(root).map((d) => d.path)).toEqual([
      "courses/_template/course.yaml",
    ]);
  });

  it("does not warn about parked or scaffold files it cannot classify", () => {
    const root = makeTempRepo({
      "courses/_draft/parked/notes.yaml": "a: 1\n",
      "courses/_template/lessons/x/notes.yaml": "a: 1\n",
    });
    expect(unclassifiedContentFiles(root)).toEqual([]);
  });
});

describe("unclassifiedContentFiles (#973)", () => {
  it("ERRORS on a typo'd parking directory, because the compiler still ships it", () => {
    const root = makeTempRepo({
      "courses/_drafts/parked/course.yaml": "id: course-parked\n",
      "courses/live/course.yaml": "id: course-live\n",
    });

    const diags = unclassifiedContentFiles(root);
    expect(diags).toHaveLength(1);
    expect(diags[0]).toMatchObject({
      gate: "loader",
      severity: "error",
      file: "courses/_drafts/parked/course.yaml",
    });
    expect(diags[0]!.message).toContain("COMPILER STILL SHIPS");
  });

  it("ERRORS on a compiler-visible doc at a depth classify() rejects", () => {
    const root = makeTempRepo({
      // The compiler's chain is `endsWith("/lesson.yaml")` / `startsWith("paths/")`
      // — depth-blind. content-lint's is anchored. Every path here is therefore
      // shipped-but-unlinted, the exact #973 invariant.
      "courses/live/modules/m1/lessons/x/lesson.yaml": "id: lesson-deep\n",
      "paths/archive/old.yaml": "id: path-old\n",
      "achievements/season1/x.yaml": "id: achievement-x\n",
    });
    const diags = unclassifiedContentFiles(root);
    expect(diags.map((d) => d.severity)).toEqual(["error", "error", "error"]);
    expect(diags.map((d) => d.file).sort()).toEqual([
      "achievements/season1/x.yaml",
      "courses/live/modules/m1/lessons/x/lesson.yaml",
      "paths/archive/old.yaml",
    ]);
  });

  it("only WARNS when nothing would ship — no gate sees it, but no bundle gets it", () => {
    const root = makeTempRepo({
      "courses/live/lessons/x/notes.yaml": "note: not a lesson\n",
      "courses/live/meta.yaml": "a: 1\n",
    });
    const diags = unclassifiedContentFiles(root);
    expect(diags.map((d) => d.severity)).toEqual(["warning", "warning"]);
  });

  it("ignores yaml outside the content collections", () => {
    const root = makeTempRepo({
      "skills.yaml": "- slug: pdas\n  label: PDAs\n",
      "docs/notes.yaml": "a: 1\n",
    });
    expect(unclassifiedContentFiles(root)).toEqual([]);
  });

  it("fails the whole lint run on the shipped-but-unlinted case", async () => {
    const root = makeTempRepo({
      "courses/_drafts/parked/course.yaml": "id: course-parked\n",
    });
    const result = await runLint(root);
    // Reviewer's repro: before the severity split this exited 0 while the
    // compiler shipped the parked catalog with duplicate ids.
    expect(result.ok).toBe(false);
    expect(
      result.diagnostics.filter(
        (d) => d.gate === "loader" && d.severity === "error"
      )
    ).toHaveLength(1);
  });

  it("does not fail the run on the warning-tier case", async () => {
    const root = makeTempRepo({
      "courses/live/lessons/x/notes.yaml": "note: not a lesson\n",
    });
    const result = await runLint(root);
    expect(result.ok).toBe(true);
    expect(
      result.diagnostics.filter(
        (d) => d.gate === "loader" && d.severity === "warning"
      )
    ).toHaveLength(1);
  });
});

/**
 * The assertion the issue asked for, stated directly rather than via fixtures:
 * every doc the COMPILER claims must also be lint-classifiable, unless it is
 * excluded from both. When that fails the file ships unlinted — #973 itself.
 */
describe("compiler ⊆ lint agreement (#973)", () => {
  const CANONICAL = [
    "courses/live/course.yaml",
    "courses/live/lessons/x/lesson.yaml",
    "achievements/a.yaml",
    "quests/q.yaml",
    "paths/p.yaml",
  ];

  const PARKED = [
    "courses/_draft/x/course.yaml",
    "courses/live/lessons/_draft/lesson.yaml",
    "paths/_draft/p.yaml",
    "achievements/_draft/a.yaml",
    "quests/_draft/q.yaml",
  ];

  const DIVERGENT = [
    "courses/_drafts/x/course.yaml",
    "courses/live/modules/m1/lessons/x/lesson.yaml",
    "paths/archive/old.yaml",
    "achievements/season1/a.yaml",
  ];

  it("holds for every canonical path", () => {
    for (const p of CANONICAL) {
      expect(isCompilerContentDoc(p), p).toBe(true);
      expect(isExcludedContentPath(p), p).toBe(false);
      expect(classify(p), p).not.toBeNull();
    }
  });

  it("holds for every parked path — excluded from BOTH sides", () => {
    for (const p of PARKED) {
      expect(isExcludedContentPath(p), p).toBe(true);
      // Compiler-shaped, but the exclusion runs first on both sides.
      expect(isCompilerContentDoc(p), p).toBe(true);
    }
  });

  it("catches every divergent path — compiler-visible, lint-invisible", () => {
    for (const p of DIVERGENT) {
      expect(isCompilerContentDoc(p), p).toBe(true);
      expect(isExcludedContentPath(p), p).toBe(false);
      expect(classify(p), p).toBeNull();
    }
  });

  it("reports each divergent path as an error, so none can ship silently", () => {
    const root = makeTempRepo(
      Object.fromEntries(DIVERGENT.map((p) => [p, "id: x\n"]))
    );
    const diags = unclassifiedContentFiles(root);
    expect(diags.map((d) => d.file).sort()).toEqual([...DIVERGENT].sort());
    expect(diags.every((d) => d.severity === "error")).toBe(true);
  });
});

describe("walkFiles — symlink safety (#381)", () => {
  it("skips a symlinked file even when its target resolves inside root", () => {
    const root = makeTempRepo({
      "achievements/real.yaml": "id: achievement-real\n",
    });
    symlinkSync(
      join(root, "achievements", "real.yaml"),
      join(root, "achievements", "linked.yaml")
    );

    const files = walkFiles(root);
    expect(files).toContain("achievements/real.yaml");
    expect(files).not.toContain("achievements/linked.yaml");

    const docs = discover(root);
    expect(docs.some((d) => d.path === "achievements/linked.yaml")).toBe(false);
  });

  it("does not follow a symlinked file whose target lives outside root", () => {
    const secretDir = mkdtempSync(join(tmpdir(), "content-lint-secret-"));
    const secretPath = join(secretDir, "secret.yaml");
    writeFileSync(secretPath, "id: achievement-leaked\n", "utf8");

    const root = makeTempRepo({
      "achievements/placeholder.yaml": "id: achievement-placeholder\n",
    });
    symlinkSync(secretPath, join(root, "achievements", "evil.yaml"));

    const files = walkFiles(root);
    expect(files).not.toContain("achievements/evil.yaml");

    const docs = discover(root);
    expect(docs.some((d) => d.path === "achievements/evil.yaml")).toBe(false);
  });

  it("does not descend into a symlinked directory", () => {
    const outsideDir = mkdtempSync(join(tmpdir(), "content-lint-outside-"));
    mkdirSync(join(outsideDir, "quests"), { recursive: true });
    writeFileSync(
      join(outsideDir, "quests", "leaked.yaml"),
      "id: quest-leaked\n",
      "utf8"
    );

    const root = makeTempRepo({
      "achievements/placeholder.yaml": "id: achievement-placeholder\n",
    });
    symlinkSync(outsideDir, join(root, "quests"));

    const files = walkFiles(root);
    expect(files.some((f) => f.startsWith("quests/"))).toBe(false);
  });
});

describe("runLint (empty)", () => {
  it("is ok on a repo with no content and no checks registered", async () => {
    const root = makeTempRepo({ "README.md": "# empty\n" });
    const result = await runLint(root);
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });
});
