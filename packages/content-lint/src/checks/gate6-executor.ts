import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runJsSubmission } from "@superteam-lms/challenge-executor";
import type { AdminTestCase } from "@superteam-lms/types";
import { registerCheck } from "../lint";
import { type RepoModel, type LessonEntry } from "../model";
import { diag, type Diagnostic } from "../diagnostics";
import { withCanonicalHarness } from "../harness";
import {
  createCompiler,
  hasToolchain,
  oracleMode,
  timeoutMs,
  type RustCompiler,
} from "../rust-oracle";

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

/**
 * Compile a buildable Rust block through the real SBF toolchain.
 *
 * Both sources are spliced with the STARTER's canonical harness first, exactly
 * as the runtime grader does (apps/web/src/lib/challenge/harness.ts), so what
 * CI proves is what a learner is actually graded on. Starter must fail;
 * solution must pass.
 */
async function gradeRustBlock(
  root: string,
  entry: LessonEntry,
  block: CodeBlock,
  compiler: RustCompiler
): Promise<Diagnostic[]> {
  const out: Diagnostic[] = [];
  const where = `block "${block.key}" (rust, buildable)`;

  let starterSrc: string;
  let solutionSrc: string;
  try {
    starterSrc = read(root, entry, block.starter);
    solutionSrc = read(root, entry, block.solution);
  } catch (err) {
    return [
      diag(
        "gate-6",
        "error",
        entry.file,
        `${where}: cannot read starter/solution — ${err instanceof Error ? err.message : String(err)}`
      ),
    ];
  }

  const solution = await compiler.compile(
    withCanonicalHarness(solutionSrc, starterSrc)
  );
  if (solution.timedOut) {
    out.push(
      diag(
        "gate-6",
        "error",
        entry.file,
        `${where}: solution build timed out after ${timeoutMs()}ms — raise CONTENT_LINT_RUST_TIMEOUT_MS or simplify the exercise`
      )
    );
  } else if (!solution.ok) {
    out.push(
      diag(
        "gate-6",
        "error",
        entry.file,
        `${where}: solution does NOT compile against the build-server template + its own harness:\n${solution.stderr}`
      )
    );
  }

  const starter = await compiler.compile(
    withCanonicalHarness(starterSrc, starterSrc)
  );
  if (starter.timedOut) {
    out.push(
      diag(
        "gate-6",
        "error",
        entry.file,
        `${where}: starter build timed out after ${timeoutMs()}ms — raise CONTENT_LINT_RUST_TIMEOUT_MS or simplify the exercise`
      )
    );
  } else if (starter.ok) {
    out.push(
      diag(
        "gate-6",
        "error",
        entry.file,
        `${where}: starter already compiles with its own harness — the harness must reference symbols the learner still has to write, or the lesson passes on an empty submission (spec §3)`
      )
    );
  }

  return out;
}

export async function gate6Check(model: RepoModel): Promise<Diagnostic[]> {
  const out: Diagnostic[] = [];
  const blocks: { entry: LessonEntry; block: CodeBlock }[] = [];
  for (const entry of model.lessons) {
    for (const raw of entry.lesson.blocks as Record<string, unknown>[]) {
      if (raw.type !== "code") continue;
      blocks.push({ entry, block: raw as unknown as CodeBlock });
    }
  }

  const rust = blocks.filter(
    (b) => b.block.language === "rust" && b.block.buildType === "buildable"
  );
  const mode = oracleMode();
  // Probe once, and only when there is something to compile — the probe spawns
  // a process, and most content repos have no buildable block at all.
  const compile = rust.length > 0 && mode !== "off" && hasToolchain();
  if (rust.length > 0 && mode === "require" && !compile) {
    out.push(
      diag(
        "gate-6",
        "error",
        "",
        "CONTENT_LINT_RUST_ORACLE=require but cargo-build-sbf is not on PATH — install the Solana toolchain or the buildable gate is not running"
      )
    );
  }

  let compiler: RustCompiler | undefined;
  try {
    if (compile) compiler = createCompiler();
  } catch (err) {
    out.push(
      diag(
        "gate-6",
        mode === "require" ? "error" : "warning",
        "",
        `rust oracle unavailable — ${err instanceof Error ? err.message : String(err)}`
      )
    );
  }

  try {
    for (const { entry, block } of blocks) {
      const buildable = block.buildType === "buildable";
      if (block.language === "typescript" && !buildable) {
        out.push(...(await gradeJsBlock(model.root, entry, block)));
      } else if (block.language === "rust" && buildable && compiler) {
        out.push(...(await gradeRustBlock(model.root, entry, block, compiler)));
      } else {
        const why =
          block.language === "rust" && buildable
            ? mode === "off"
              ? "rust oracle disabled (CONTENT_LINT_RUST_ORACLE=off)"
              : "cargo-build-sbf not found on PATH — install the Solana toolchain to compile it here"
            : "no repo-side oracle for this block type";
        out.push(
          diag(
            "gate-6",
            "notice",
            entry.file,
            `block "${block.key}" (${block.language}${buildable ? ", buildable" : ""}) is DEFERRED to runtime grading (fail-closed per block) — not verified in repo CI: ${why}`
          )
        );
      }
    }
  } finally {
    compiler?.dispose();
  }

  return out;
}

registerCheck(gate6Check);
