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
 * GRADING RUBRIC (compilation success)
 * ------------------------------------
 * Every buildable lesson's tests are compilation checks. Test 0 is always
 * "Program compiles successfully"; any further tests are prose content-checks
 * ("Code contains a greet function", …) that the browser runner ALSO grades as
 * plain compile-success (it never regexes the description). We honour the same
 * contract server-side: a submission passes iff the build server reports the
 * program compiled. The build server's own `build.rs` still defers IDL parsing
 * ("no anchor-syn"), so `success: bool` is the only authoritative signal — and a
 * clean SBF compile is the realistic, non-forgeable v1 bar for these lessons.
 * (If a future lesson encodes a checkable expected result, extend here.)
 *
 * SECURITY — this path grants on-chain XP, so it must resist a hostile
 * submission forging a pass:
 *
 *   - FAIL-CLOSED ON CONFIG. If the build server is not configured
 *     (`BUILD_SERVER_URL` / `BUILD_SERVER_API_KEY` unset), the grader reports
 *     `available: false` and grades NOTHING — callers deny completion. This is
 *     what keeps PROD (where the build server is not yet deployed) unchanged: a
 *     buildable submission still 503s rather than being granted unverified.
 *   - FAIL-CLOSED ON OUTAGE. A build-server timeout, network error, non-2xx, or
 *     malformed body all resolve to `available: false` (deny), never a pass. Only
 *     an explicit `success: true` from the build server is a pass; an explicit
 *     `success: false` (genuine compile error) is `available: true` + all tests
 *     failed (a bad submission, not an outage).
 *   - SIZE-CAPPED. The raw submission is rejected above `MAX_BUILDABLE_BYTES`
 *     before any network call.
 *
 * ⚠️ OPERATIONAL SECURITY — DO NOT set `BUILD_SERVER_URL` in production until the
 * build server is network-isolated (issue #193, VPC deny-egress). Grading an
 * untrusted `anchor build` runs the submission's `build.rs` / proc-macros as
 * arbitrary code on the build host; egress isolation is what contains that. The
 * SBF target sandboxes the *compiled* program, NOT the build itself. Until #193
 * lands, leave it unset — this grader then fails closed and blocks nothing.
 */

import type { AdminTestCase } from "@superteam-lms/types";
import type { ServerTestResult, SubmissionRunResult } from "./executor";
import { serverEnv } from "@/lib/env.server";

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

/** Shape the build server's `/build` returns (see apps/build-server build.rs). */
interface BuildServerResponse {
  success: boolean;
  stderr: string;
  uuid: string | null;
  binary_b64?: string;
}

const ANSI_REGEX = /\x1b\[[0-9;]*m/g;
const stripAnsi = (s: string): string => s.replace(ANSI_REGEX, "");

/** Whether the build server is configured (and therefore grading can run). */
export function isBuildServerConfigured(): boolean {
  return Boolean(BUILD_SERVER_URL && BUILD_SERVER_API_KEY);
}

/**
 * The build server only accepts source paths matching `^/src/<name>.rs$`, so a
 * buildable submission is always compiled as the crate's `src/lib.rs`. It also
 * pins `declare_id!` at runtime, but for a *compile-only* grade the placeholder
 * id compiles fine, so we leave the source byte-identical (no rewrite needed).
 *
 * A per-request nonce file busts the build server's content-addressable cache so
 * one learner's PASS/FAIL is never served from another submission's cached
 * entry — the grade always reflects THIS exact source.
 */
function toBuildFiles(code: string, nonce: string): [string, string][] {
  return [
    ["/src/lib.rs", code],
    ["/src/_grade_nonce.rs", `// ${nonce}`],
  ];
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
  tests: AdminTestCase[]
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

  const nonce = crypto.randomUUID();
  const files = toBuildFiles(code, nonce);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let data: BuildServerResponse;
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
    if (!res.ok) {
      // Build server reachable but erroring (4xx/5xx/429) — cannot render a
      // trustworthy verdict, so degrade closed.
      return { available: false, reason: "executor_unavailable" };
    }
    data = (await res.json()) as BuildServerResponse;
  } catch {
    // Network failure / timeout / abort — degrade closed.
    return { available: false, reason: "executor_unavailable" };
  } finally {
    clearTimeout(timer);
  }

  if (data.success === true) {
    return allPassed(tests);
  }

  // Explicit compile failure: a bad submission, not an outage. Surface the first
  // real compiler error line as a short, non-sensitive diagnostic (no answer
  // key). Prefer a diagnostic line (`error[E1234]:` / `error:`) over incidental
  // matches like a crate named "…-error" in cargo's "Compiling …" progress.
  const lines = stripAnsi(data.stderr ?? "").split("\n");
  const firstError =
    lines.find((l) => /^\s*error(\[|:)/.test(l)) ??
    lines.find((l) => l.includes("error")) ??
    "Program did not compile";
  return allFailed(tests, firstError.trim().slice(0, 200));
}

/** Result of running a single test case — re-exported for callers/tests. */
export type { ServerTestResult };
