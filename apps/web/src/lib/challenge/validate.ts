/**
 * Shared server-side challenge validation.
 *
 * Single source of truth used by BOTH `/api/lessons/validate-challenge` (UX
 * pre-check) and `/api/lessons/complete` (the authoritative completion gate).
 * Loads the answer key server-side (hidden tests + reference solution never
 * reach the browser) and runs the submission through the secure isolate
 * executor.
 */

import type { ChallengeAnswerKey } from "@/lib/sanity/queries";
import {
  isExecutorAvailable,
  runJsSubmission,
  type ServerTestResult,
} from "@/lib/challenge/executor";

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
       * Lesson is a challenge, but its correctness is established elsewhere
       * (Rust playground / build server) rather than by the JS executor. The
       * completion gate must decide policy for these explicitly.
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
 * A JS/TS code challenge is one we can execute and grade server-side. Rust
 * (`language: "rust"`) and buildable challenges are compiled by the Rust
 * playground / build server respectively and are out of scope for the JS
 * isolate executor.
 */
function isJsExecutableChallenge(key: ChallengeAnswerKey): boolean {
  if (key.type !== "challenge") return false;
  if (key.buildType === "buildable") return false;
  // Treat anything that isn't explicitly rust as JS/TS (matches the browser
  // runner, which only routes language === "rust" away from the JS worker).
  return key.language !== "rust";
}

/**
 * Validate a submission against the answer key. Pure logic — no auth, no HTTP.
 */
export async function validateAgainstAnswerKey(
  key: ChallengeAnswerKey,
  submittedCode: string
): Promise<ChallengeVerdict> {
  if (key.type !== "challenge") {
    return { kind: "not_a_challenge" };
  }

  const { hidden, visible } = countTests(key);

  if (!isJsExecutableChallenge(key)) {
    return {
      kind: "non_js_challenge",
      language: key.language,
      buildType: key.buildType,
      hiddenTestCount: hidden,
      visibleTestCount: visible,
    };
  }

  if (!(await isExecutorAvailable())) {
    return {
      kind: "executor_unavailable",
      hiddenTestCount: hidden,
      visibleTestCount: visible,
    };
  }

  const run = await runJsSubmission(submittedCode, key.tests ?? []);
  if (!run.available) {
    return {
      kind: "executor_unavailable",
      hiddenTestCount: hidden,
      visibleTestCount: visible,
    };
  }

  return {
    kind: "validated",
    passed: run.passed,
    hiddenTestCount: hidden,
    visibleTestCount: visible,
    results: run.results,
  };
}
