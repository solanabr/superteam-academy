import { describe, it, expect } from "vitest";
import { symlinkSync, mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discover, walkFiles } from "../loader";
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
