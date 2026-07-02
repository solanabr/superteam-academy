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
import { runRustSubmission } from "@/lib/challenge/rust-executor";
import { runBuildableSubmission } from "@/lib/challenge/buildable-executor";

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
       * Lesson is a challenge no server-side grader can currently judge — a
       * true dead-end that the completion gate must deny (fail closed). With the
       * buildable grader wired up this is now unreachable for the known
       * challenge types (JS → isolate, `language: "rust"` → Rust executor,
       * `buildType: "buildable"` → build server), but it is retained so any
       * FUTURE unrecognised type also degrades closed instead of falling
       * through to a granted completion.
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
 * A JS/TS code challenge is one the isolate executor can grade. Rust
 * (`language: "rust"`) is graded by the Rust executor; `buildType: "buildable"`
 * challenges are compiled by the Anchor build server (not yet wired up). Both
 * are out of scope for the JS isolate executor.
 */
function isJsExecutableChallenge(key: ChallengeAnswerKey): boolean {
  if (key.type !== "challenge") return false;
  if (key.buildType === "buildable") return false;
  // Treat anything that isn't explicitly rust as JS/TS (matches the browser
  // runner, which only routes language === "rust" away from the JS worker).
  return key.language !== "rust";
}

/**
 * A plain Rust challenge the Rust executor can grade end-to-end via the Rust
 * Playground. Excludes `buildType: "buildable"`, which needs the Anchor build
 * server rather than the Playground.
 */
function isRustGradableChallenge(key: ChallengeAnswerKey): boolean {
  return (
    key.type === "challenge" &&
    key.buildType !== "buildable" &&
    key.language === "rust"
  );
}

/**
 * A buildable challenge (`buildType: "buildable"`) — a full on-chain Anchor
 * program graded by compiling it via the build server (`buildable-executor.ts`).
 */
function isBuildableChallenge(key: ChallengeAnswerKey): boolean {
  return key.type === "challenge" && key.buildType === "buildable";
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

  // Rust challenges: graded authoritatively via the Rust Playground (full test
  // set, incl. hidden). A Playground outage degrades closed to
  // executor_unavailable so completion is denied, never granted unverified.
  if (isRustGradableChallenge(key)) {
    const run = await runRustSubmission(submittedCode, key.tests ?? []);
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

  // Buildable challenges: graded authoritatively by compiling the submission on
  // the Anchor build server. Pass == the program compiles (see
  // buildable-executor.ts for the rubric). A build-server outage — or the build
  // server simply not being configured (prod, pre-#193) — degrades closed to
  // executor_unavailable so completion is denied, never granted unverified.
  if (isBuildableChallenge(key)) {
    const run = await runBuildableSubmission(submittedCode, key.tests ?? []);
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

  // Any remaining challenge type has no server-side grader — fail closed.
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
