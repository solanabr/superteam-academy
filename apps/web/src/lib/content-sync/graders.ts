import "server-only";
import type { AdminTestCase } from "@superteam-lms/types";
import type { GraderSet } from "@/lib/content/compile/executor-gate";
import type { SubmissionRunResult } from "@/lib/challenge/executor";
import { runJsSubmission } from "@/lib/challenge/executor";
import { runRustSubmission } from "@/lib/challenge/rust-executor";
import { runBuildableSubmission } from "@/lib/challenge/buildable-executor";

type Run = (
  code: string,
  tests: AdminTestCase[]
) => Promise<SubmissionRunResult>;

/**
 * Adapt a learner-grading executor into the sync's `Grader` shape. An
 * unavailable executor is a NON-pass (fail-closed) — the sync must not certify a
 * block whose oracle could not run (spec §6.2a). This is the SAME oracle that
 * grades learners, so a block that passes the gate at sync time is judged
 * identically in the lesson.
 */
function adapt(run: Run): GraderSet["js"] {
  return async (code, tests) => {
    const result = await run(code, tests as AdminTestCase[]);
    if (!result.available) {
      return { passed: false, failures: ["executor_unavailable"] };
    }
    return {
      passed: result.passed,
      failures: result.results.filter((r) => !r.passed).map((r) => r.detail),
    };
  };
}

/** Wire the three real execution tiers of §6.2a for the sync-time executor gate. */
export function createLiveGraders(): GraderSet {
  return {
    js: adapt(runJsSubmission),
    rust: adapt(runRustSubmission),
    buildable: adapt(runBuildableSubmission),
  };
}
