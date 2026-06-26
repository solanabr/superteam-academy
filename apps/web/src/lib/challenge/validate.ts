/**
 * Shared server-side challenge validation.
 *
 * Single source of truth used by BOTH `/api/lessons/validate-challenge` (UX
 * pre-check) and `/api/lessons/complete` (the authoritative completion gate).
 * Loads the answer key server-side (hidden tests + reference solution never
 * reach the browser) and runs the submission through the appropriate secure
 * executor: the in-process V8 isolate for JS/TS, or the Rust executor (Rust
 * Playground, server-to-server) for rust function challenges. `buildable`
 * (Anchor) challenges have no non-forgeable substrate and fail closed.
 */

import type { ChallengeAnswerKey } from "@/lib/sanity/queries";
import {
  isExecutorAvailable,
  runJsSubmission,
  type ServerTestResult,
} from "@/lib/challenge/executor";
import {
  isRustExecutorAvailable,
  runRustSubmission,
} from "@/lib/challenge/rust-executor";

export type ChallengeVerdict =
  | {
      /** Lesson is a code challenge the JS executor can judge. */
      kind: "validated";
      passed: boolean;
      hiddenTestCount: number;
      visibleTestCount: number;
      results: ServerTestResult[];
    }
  | {
      /**
       * Lesson is a challenge whose correctness CANNOT be established
       * non-forgeably with the substrates we have. In practice this is the
       * `buildType: "buildable"` (Anchor) path: the Cloud Run build server is
       * compile-only — it can prove a submission compiles, but has no
       * run-the-submission-against-hidden-tests capability, so grading "it
       * compiled" as "passed" would be forgeable test validation. The
       * completion gate MUST treat this as deny (fail closed) until a real
       * grading substrate exists (a build-server test endpoint / #196-style
       * microservice). Rust *function* challenges do NOT land here — they are
       * graded by the Rust executor and return `validated`.
       */
      kind: "non_js_challenge";
      language: string | null;
      buildType: string | null;
      hiddenTestCount: number;
      visibleTestCount: number;
    }
  | {
      /** Lesson is not a challenge — no submission proof required. */
      kind: "not_a_challenge";
    }
  | {
      /**
       * The secure executor is unavailable in this environment. Callers MUST
       * treat this as a non-pass and DENY completion (degrade closed).
       */
      kind: "executor_unavailable";
      hiddenTestCount: number;
      visibleTestCount: number;
    };

/** Maximum submission length accepted from the client. */
export const MAX_SUBMISSION_BYTES = 100_000;

function countTests(key: ChallengeAnswerKey): {
  hidden: number;
  visible: number;
} {
  const tests = key.tests ?? [];
  const hidden = tests.filter((t) => t.hidden === true).length;
  return { hidden, visible: tests.length - hidden };
}

/**
 * A `buildable` (Anchor) challenge is compiled by the Cloud Run build server,
 * which is COMPILE-ONLY — it cannot run a submission against tests. We therefore
 * cannot grade it non-forgeably and must fail closed (see the `non_js_challenge`
 * verdict). This takes precedence over the language check: a buildable challenge
 * is buildable even if `language === "rust"`.
 */
function isBuildableChallenge(key: ChallengeAnswerKey): boolean {
  return key.type === "challenge" && key.buildType === "buildable";
}

/**
 * A Rust *function* challenge: `language === "rust"` and NOT buildable. Graded
 * server-side by compiling + running the submission via the Rust executor
 * (Rust Playground), mirroring the browser runner's rust path. Everything that
 * is neither buildable nor rust is treated as JS/TS and graded by the isolate
 * executor (matches the browser runner, which only routes `language === "rust"`
 * away from the JS worker).
 */
function isRustExecutableChallenge(key: ChallengeAnswerKey): boolean {
  return (
    key.type === "challenge" &&
    key.buildType !== "buildable" &&
    key.language === "rust"
  );
}

/**
 * Validate a submission against the answer key. Pure logic — no auth, no HTTP.
 *
 * Routing:
 *   - buildable (Anchor)  → `non_js_challenge` (deny; substrate is compile-only)
 *   - rust function       → graded by the Rust executor (Rust Playground)
 *   - everything else     → graded by the JS isolate executor
 *
 * Both executable paths degrade closed: an unavailable/erroring substrate yields
 * `executor_unavailable` (a non-pass), never a silent pass.
 */
export async function validateAgainstAnswerKey(
  key: ChallengeAnswerKey,
  submittedCode: string
): Promise<ChallengeVerdict> {
  if (key.type !== "challenge") {
    return { kind: "not_a_challenge" };
  }

  const { hidden, visible } = countTests(key);
  const unavailable: ChallengeVerdict = {
    kind: "executor_unavailable",
    hiddenTestCount: hidden,
    visibleTestCount: visible,
  };

  // Buildable (Anchor) challenges have no non-forgeable grading substrate — the
  // build server is compile-only. Fail closed (deny) until one exists.
  if (isBuildableChallenge(key)) {
    return {
      kind: "non_js_challenge",
      language: key.language,
      buildType: key.buildType,
      hiddenTestCount: hidden,
      visibleTestCount: visible,
    };
  }

  // Pick the substrate. Rust function challenges compile+run via the Rust
  // executor; all other challenges run in the JS isolate. Each runner shares the
  // same availability/result contract (SubmissionRunResult).
  const rust = isRustExecutableChallenge(key);

  if (
    rust ? !(await isRustExecutorAvailable()) : !(await isExecutorAvailable())
  ) {
    return unavailable;
  }

  const run = rust
    ? await runRustSubmission(submittedCode, key.tests ?? [])
    : await runJsSubmission(submittedCode, key.tests ?? []);

  if (!run.available) {
    return unavailable;
  }

  return {
    kind: "validated",
    passed: run.passed,
    hiddenTestCount: hidden,
    visibleTestCount: visible,
    results: run.results,
  };
}
