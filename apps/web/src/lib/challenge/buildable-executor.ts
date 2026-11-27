/**
 * Authoritative server-side grader for **buildable** challenge submissions —
 * the `buildType: "buildable"` lessons that ship a full on-chain Anchor program
 * (the "Your First Build" / Counter / "Deploy to Devnet" track).
 *
 * WHY THIS EXISTS
 * ---------------
 * `/api/lessons/complete` must independently prove a submission passes before it
 * records an on-chain completion (which awards XP + credential eligibility).
 * JS/TS challenges are proven by the QuickJS isolate (`executor.ts`); plain Rust
 * snippets by the Rust Playground (`rust-executor.ts`). Buildable challenges are
 * proven HERE: the submission is compiled with `cargo-build-sbf` by the Anchor
 * build server (`apps/build-server`), and the verdict is derived from whether it
 * compiled. This mirrors those graders' relationship to their browser runners —
 * the browser `runBuildChallenge` (in `challenge-runner.tsx`) is a non-
 * authoritative UX pre-check; the server is the source of truth.
 *
 * GRADING RUBRIC (the canonical harness compiles)
 * -----------------------------------------------
 * Every buildable lesson's tests are compilation checks. Test 0 is always
 * "Program compiles successfully"; any further tests are prose content-checks
 * ("Code contains a greet function", …) that the browser runner ALSO grades as
 * plain compile-success (it never regexes the description).
 *
 * Compilation ALONE is not a grade: the build server copies a template
 * Cargo.toml, so `pub fn nothing() {}` compiles and the learner would pass by
 * deleting the exercise. What makes the verdict mean something is the lesson's
 * verification harness — a type-level check naming the symbols the exercise has
 * to define, shipped at the bottom of `starter`. So we do not compile what the
 * learner sent: we compile `buildGradeFiles(code, starter)`, which strips any
 * harness region the submission carries and compiles the STARTER's as a separate
 * `/src/_verify.rs` module, declared on the line ABOVE the body so nothing the
 * learner writes can switch it off (an append could be — see `harness.ts`). A
 * submission passes iff THAT compiles.
 *
 * SECURITY — this path grants on-chain XP, so it must resist a hostile
 * submission forging a pass:
 *
 *   - FAIL-CLOSED ON CONFIG. If the build server is not configured
 *     (`BUILD_SERVER_URL` / `BUILD_SERVER_API_KEY` unset), the grader reports
 *     `available: false` and grades NOTHING — callers deny completion. This is
 *     what keeps PROD (where the build server is not yet deployed) unchanged: a
 *     buildable submission still 503s rather than being granted unverified.
 *   - FAIL-CLOSED ON OUTAGE. A build-server timeout, network error, error status
 *     or a 200 whose body is not a build result (`readBuildServerAnswer` checks
 *     the shape) all resolve to `available: false` (deny), never a pass. Only an
 *     explicit `success: true` from the build server is a pass; an explicit
 *     `success: false` (genuine compile error) is `available: true` + all tests
 *     failed (a bad submission, not an outage).
 *   - A REFUSED REQUEST IS A FAILED SUBMISSION. The one error status that is not
 *     an outage is the build server's own 400 (`{ "error": ... }`: a blocked
 *     name, an invalid file). The same submission gets the same answer every
 *     time, so it is `available: true` + all tests failed, with that message.
 *   - SIZE-CAPPED. The raw submission is rejected above `MAX_BUILDABLE_BYTES`
 *     before any network call.
 *   - FAIL-CLOSED ON A HARNESS-LESS LESSON. If the block's starter carries no
 *     harness there is nothing to grade against, so the grader reports
 *     `available: false` rather than falling back to bare compilation. Content
 *     CI (gate 22) is what keeps such a lesson from shipping.
 *
 * ⚠️ OPERATIONAL SECURITY — grading an untrusted `anchor build` runs the
 * submission's `build.rs` / proc-macros as arbitrary code on the build host; the
 * SBF target sandboxes the *compiled* program, NOT the build itself. Network
 * egress isolation is what contains that. The mechanism exists (#193: Cloud Run
 * VPC + deny-egress firewall, `apps/build-server/deploy/HARDENING.md`) but it is
 * OPT-IN at deploy time — `deploy/deploy.sh` only attaches the VPC when
 * `VPC_NETWORK`/`VPC_SUBNET` are set, and WARNS-then-deploys unrestricted when
 * they are not. Enabling this grader in production is therefore an OPS action
 * with a verification step, not a code change: confirm the live build server
 * was deployed WITH the deny-egress VPC vars, then set `BUILD_SERVER_URL` +
 * `BUILD_SERVER_API_KEY` in the prod env. While they are unset the grader fails
 * closed (buildable lessons 503) and blocks nothing.
 */

import type { AdminTestCase } from "@superteam-lms/types";
import {
  readBuildServerAnswer,
  type BuildServerAnswer,
} from "@/lib/build-server/failure";
import { serverEnv } from "@/lib/env.server";
import type { ServerTestResult, SubmissionRunResult } from "./executor";
import { compilerErrorSummary } from "./compiler-error";
import { buildGradeFiles, splitHarness } from "./harness";

const BUILD_SERVER_URL = serverEnv.BUILD_SERVER_URL;
const BUILD_SERVER_API_KEY = serverEnv.BUILD_SERVER_API_KEY;

/**
 * Upper bound on the RAW submission we are willing to compile. Matches the
 * build server's own per-file limit (100KB); the isolate/Playground graders cap
 * lower because they wrap the code in a harness, which we do not.
 */
const MAX_BUILDABLE_BYTES = 100 * 1024;

/**
 * Wall-clock budget for the build round-trip. The build server's own build
 * timeout is 120s; we wait slightly longer so a genuinely slow compile surfaces
 * its real verdict instead of being cut off client-side as an outage.
 */
const UPSTREAM_TIMEOUT_MS = 130_000;

/** Whether the build server is configured (and therefore grading can run). */
export function isBuildServerConfigured(): boolean {
  return Boolean(BUILD_SERVER_URL && BUILD_SERVER_API_KEY);
}

/**
 * The graded files plus a per-request nonce file, which busts the build server's
 * content-addressable cache so one learner's PASS/FAIL is never served from
 * another submission's cached entry — the grade always reflects THIS exact
 * source. The build server pins `declare_id!` at runtime, but for a
 * *compile-only* grade the placeholder id compiles fine, so the submission goes
 * over byte-identical (no rewrite needed).
 */
function toBuildFiles(
  graded: [string, string][],
  nonce: string
): [string, string][] {
  return [...graded, ["/src/_grade_nonce.rs", `// ${nonce}`]];
}

/** Fail every test with the same reason (bad submission, not a build outage). */
function allFailed(
  tests: AdminTestCase[],
  detail: string
): SubmissionRunResult {
  return {
    available: true,
    passed: false,
    results: tests.map((t) => ({
      id: t.id,
      hidden: t.hidden === true,
      passed: false,
      detail,
    })),
  };
}

/** Pass every test (the program compiled — the rubric for buildable lessons). */
function allPassed(tests: AdminTestCase[]): SubmissionRunResult {
  return {
    available: true,
    passed: true,
    results: tests.map((t) => ({
      id: t.id,
      hidden: t.hidden === true,
      passed: true,
      detail: "compiled",
    })),
  };
}

/**
 * Grade a buildable submission by compiling it via the build server.
 *
 * Contract mirrors {@link runJsSubmission} / {@link runRustSubmission}:
 *   - `{ available: false }` → the grader could not run (build server unset or
 *     unreachable); callers MUST deny completion.
 *   - `{ available: true, passed }` → the build server rendered a verdict;
 *     `passed` is true iff the program compiled (all tests pass together).
 */
export async function runBuildableSubmission(
  code: string,
  tests: AdminTestCase[],
  starter: string
): Promise<SubmissionRunResult> {
  // Fail closed when the build server is not configured. This is the guard that
  // leaves prod (build server not deployed) unchanged — a buildable submission
  // stays un-gradeable → completion denied, never granted.
  if (!BUILD_SERVER_URL || !BUILD_SERVER_API_KEY) {
    return { available: false, reason: "executor_unavailable" };
  }

  if (Buffer.byteLength(code, "utf8") > MAX_BUILDABLE_BYTES) {
    return allFailed(tests, "Submission too large");
  }

  // No harness in the starter → nothing distinguishes a real solution from an
  // empty file. Deny rather than grade on bare compilation.
  if (!splitHarness(starter).harness) {
    return { available: false, reason: "executor_unavailable" };
  }

  const nonce = crypto.randomUUID();
  const files = toBuildFiles(buildGradeFiles(code, starter), nonce);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let answer: BuildServerAnswer;
  try {
    const res = await fetch(`${BUILD_SERVER_URL}/build`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BUILD_SERVER_API_KEY,
      },
      body: JSON.stringify({ files, uuid: null, flags: {} }),
      signal: controller.signal,
    });
    // Classified by the same function `/api/build-program` uses, so the editor
    // and the grader read one answer the same way.
    answer = await readBuildServerAnswer(res);
  } catch {
    // Network failure / timeout / abort — degrade closed.
    return { available: false, reason: "executor_unavailable" };
  } finally {
    clearTimeout(timer);
  }

  switch (answer.kind) {
    case "busy":
    case "unavailable":
      // No verdict to trust (an error status, a full queue, or a 200 whose
      // body is not a build result), so degrade closed.
      return { available: false, reason: "executor_unavailable" };
    case "rejected":
      // The build server refused the submission itself (a blocked name, an
      // invalid file). It is deterministic, so this is a failed submission
      // with the build server's sentence as the reason, not an outage.
      return allFailed(tests, answer.message);
    case "verdict":
      if (answer.verdict.success) return allPassed(tests);
      // Explicit compile failure: a bad submission, not an outage. Surface the
      // first real compiler error line as a short, non-sensitive diagnostic (no
      // answer key) — or, when that error is inside the hidden harness module,
      // the sentence the editor shows for it, so the 403 reason and the test
      // row agree.
      return allFailed(tests, compilerErrorSummary(answer.verdict.stderr));
  }
}

/** Result of running a single test case — re-exported for callers/tests. */
export type { ServerTestResult };
