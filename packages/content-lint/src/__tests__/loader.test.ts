import { describe, it, expect } from "vitest";
import { symlinkSync, mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discover, walkFiles, unclassifiedContentFiles } from "../loader";
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
  it("warns on a typo'd parking directory that no gate can see", () => {
    const root = makeTempRepo({
      "courses/_drafts/parked/course.yaml": "id: course-parked\n",
      "courses/live/course.yaml": "id: course-live\n",
    });

    const diags = unclassifiedContentFiles(root);
    expect(diags).toHaveLength(1);
    expect(diags[0]).toMatchObject({
      gate: "loader",
      severity: "warning",
      file: "courses/_drafts/parked/course.yaml",
    });
    expect(diags[0]!.message).toContain("unclassified content file");
  });

  it("warns on a collection yaml at the wrong depth", () => {
    const root = makeTempRepo({
      "paths/archive/old.yaml": "id: path-old\n",
      "courses/live/lessons/x/notes.yaml": "note: not a lesson\n",
    });
    expect(
      unclassifiedContentFiles(root)
        .map((d) => d.file)
        .sort()
    ).toEqual(["courses/live/lessons/x/notes.yaml", "paths/archive/old.yaml"]);
  });

  it("ignores yaml outside the content collections", () => {
    const root = makeTempRepo({
      "skills.yaml": "- slug: pdas\n  label: PDAs\n",
      "docs/notes.yaml": "a: 1\n",
    });
    expect(unclassifiedContentFiles(root)).toEqual([]);
  });

  it("surfaces the warning through runLint without failing the run", async () => {
    const root = makeTempRepo({
      "courses/_drafts/parked/course.yaml": "id: course-parked\n",
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
