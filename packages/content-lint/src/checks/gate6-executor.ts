import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runJsSubmission } from "@superteam-lms/challenge-executor";
import type { AdminTestCase } from "@superteam-lms/types";
import { registerCheck } from "../lint";
import { type RepoModel, type LessonEntry } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

interface CodeBlock {
  type: "code";
  key: string;
  language: "typescript" | "rust";
  buildType?: "standard" | "buildable";
  starter: string;
  solution: string;
  tests: string;
}

function read(root: string, entry: LessonEntry, rel: string): string {
  return readFileSync(join(root, entry.dir, rel), "utf8");
}

function loadTests(
  root: string,
  entry: LessonEntry,
  rel: string
): AdminTestCase[] {
  return JSON.parse(read(root, entry, rel)) as AdminTestCase[];
}

async function gradeJsBlock(
  root: string,
  entry: LessonEntry,
  block: CodeBlock
): Promise<Diagnostic[]> {
  const out: Diagnostic[] = [];
  const where = `${entry.file} (block "${block.key}")`;
  let tests: AdminTestCase[];
  try {
    tests = loadTests(root, entry, block.tests);
  } catch (err) {
    return [
      diag(
        "gate-6",
        "error",
        entry.file,
        `block "${block.key}": cannot read tests.json — ${err instanceof Error ? err.message : String(err)}`
      ),
    ];
  }

  const solution = await runJsSubmission(
    read(root, entry, block.solution),
    tests
  );
  if (!solution.available) {
    return [
      diag(
        "gate-6",
        "error",
        entry.file,
        `${where}: executor unavailable — cannot verify (fail-closed)`
      ),
    ];
  }
  if (!solution.passed) {
    const failing = solution.results
      .filter((r) => !r.passed)
      .map((r) => r.id)
      .join(", ");
    out.push(
      diag(
        "gate-6",
        "error",
        entry.file,
        `${where}: solution.ts does NOT pass its own tests (failing: ${failing})`
      )
    );
  }

  const starter = await runJsSubmission(
    read(root, entry, block.starter),
    tests
  );
  if (!starter.available) {
    return [
      diag(
        "gate-6",
        "error",
        entry.file,
        `${where}: executor unavailable — cannot verify (fail-closed)`
      ),
    ];
  }
  if (starter.passed) {
    out.push(
      diag(
        "gate-6",
        "error",
        entry.file,
        `${where}: starter.ts already passes the tests — a starter must FAIL them (spec §3)`
      )
    );
  }

  return out;
}

export async function gate6Check(model: RepoModel): Promise<Diagnostic[]> {
  const out: Diagnostic[] = [];
  for (const entry of model.lessons) {
    for (const raw of entry.lesson.blocks as Record<string, unknown>[]) {
      if (raw.type !== "code") continue;
      const block = raw as unknown as CodeBlock;
      const buildable = block.buildType === "buildable";
      if (block.language === "typescript" && !buildable) {
        out.push(...(await gradeJsBlock(model.root, entry, block)));
      } else {
        out.push(
          diag(
            "gate-6",
            "notice",
            entry.file,
            `block "${block.key}" (${block.language}${buildable ? ", buildable" : ""}) is DEFERRED to runtime grading (fail-closed per block) — not verified in repo CI`
          )
        );
      }
    }
  }
  return out;
}

registerCheck(gate6Check);
