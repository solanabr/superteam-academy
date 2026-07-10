import "server-only";
import type { CodeBlockData } from "@superteam-lms/types";
import {
  isExecutorAvailable,
  runJsSubmission,
  type SubmissionRunResult,
} from "@/lib/challenge/executor";
import { runRustSubmission } from "@/lib/challenge/rust-executor";
import { runBuildableSubmission } from "@/lib/challenge/buildable-executor";
import type { CodeProof, GradeResult } from "../types";

/** Maximum submission length accepted from the client. */
export const MAX_SUBMISSION_BYTES = 100_000;

function isCodeProof(proof: unknown): proof is CodeProof {
  return (
    !!proof &&
    typeof proof === "object" &&
    typeof (proof as { code?: unknown }).code === "string"
  );
}

/** Map an executor run onto a grade verdict: pass→ok, fail→403, outage→503. */
function fromRun(run: SubmissionRunResult): GradeResult {
  if (!run.available) return { ok: false, status: 503 };
  return run.passed ? { ok: true } : { ok: false, status: 403 };
}

/**
 * Grade a `code` block from its own PUBLIC projection (D4 — no answer key). The
 * routing mirrors the old `validateAgainstAnswerKey`: JS/TS → the QuickJS
 * isolate, `language: "rust"` (non-buildable) → the Rust Playground,
 * `buildType: "buildable"` → the Anchor build server. Every non-pass path
 * degrades CLOSED — a wrong submission is 403, and an executor outage or an
 * unrecognised language/buildType is 503 (never a granted completion).
 */
export async function gradeCode(
  block: unknown,
  proof: unknown
): Promise<GradeResult> {
  const b = block as CodeBlockData | undefined;
  const tests = b?.tests;
  if (!Array.isArray(tests)) return { ok: false, status: 503 };

  // A missing/empty/oversized submission is a non-pass, not an outage → 403.
  if (
    !isCodeProof(proof) ||
    proof.code.length === 0 ||
    Buffer.byteLength(proof.code, "utf8") > MAX_SUBMISSION_BYTES
  ) {
    return { ok: false, status: 403 };
  }
  const code = proof.code;

  // Buildable: compiled by the Anchor build server. An outage — or the build
  // server simply not being configured — surfaces as `available: false` → 503.
  if (b?.buildType === "buildable") {
    return fromRun(await runBuildableSubmission(code, tests));
  }

  // Plain Rust: graded via the Rust Playground.
  if (b?.language === "rust") {
    return fromRun(await runRustSubmission(code, tests));
  }

  // JS/TS: graded by the secure isolate. An unavailable isolate → 503.
  if (b?.language === "typescript") {
    if (!(await isExecutorAvailable())) return { ok: false, status: 503 };
    return fromRun(await runJsSubmission(code, tests));
  }

  // Any unrecognised language/buildType has no grader — fail closed.
  return { ok: false, status: 503 };
}
