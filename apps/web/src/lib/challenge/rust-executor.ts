/**
 * Server-side, non-forgeable executor for untrusted learner RUST submissions.
 *
 * SECURITY BOUNDARY
 * -----------------
 * This is the Rust analog of {@link "./executor".runJsSubmission}. The JS path
 * runs submissions in an in-process V8 isolate; Rust cannot be sandboxed
 * in-process, so the execution substrate is the **Rust Playground**
 * (`play.rust-lang.org/execute`), called SERVER-TO-SERVER. The Playground
 * compiles the submission and runs its `main()`, returning real stdout/stderr.
 * Untrusted Rust therefore executes ONLY inside the Playground's own sandbox,
 * never on our server.
 *
 * NON-FORGEABLE GRADING
 * ---------------------
 * The server synthesises a test harness around the learner's code (mirroring the
 * browser runner's `buildRustTestHarness`, so a submission that passes the
 * visible tests in-browser is judged identically), then grades by scanning the
 * REAL compiler stdout for per-test PASS/FAIL markers. Two properties make a
 * forged pass impossible:
 *
 *   1. The HIDDEN tests (their `input`/`expectedOutput`) live only in the
 *      server-held answer key and are injected into the harness here — they
 *      never reach the browser, so the client cannot know what to satisfy.
 *   2. Each run's markers are tagged with an UNPREDICTABLE per-run nonce
 *      (`TEST_<nonce>_<i>_PASS`). A submission cannot pre-`println!` a passing
 *      marker because it cannot guess the nonce. The browser harness omits this
 *      (it is non-authoritative UX); the server MUST have it.
 *
 * DEGRADE-CLOSED
 * --------------
 * Any substrate failure — Playground unreachable, non-2xx, timeout, malformed
 * response, or a code shape we cannot build a harness for — returns
 * `available: false`. Callers MUST treat that as a non-pass and DENY completion
 * (it maps to HTTP 503 in the completion gate). A submission is graded as passed
 * ONLY when the server itself observed every test's PASS marker in real output.
 */

import type { AdminTestCase } from "@superteam-lms/types";
import type { ServerTestResult, SubmissionRunResult } from "./executor";

/** Upper bound on submission size we are willing to compile/run. */
const MAX_CODE_BYTES = 100_000;

/**
 * Wall-clock budget for the Playground round trip. The Playground itself caps
 * compile+run; this guards against a hung connection. On trip we degrade closed.
 */
const UPSTREAM_TIMEOUT_MS = 30_000;

const RUST_PLAYGROUND_URL =
  process.env.RUST_PLAYGROUND_URL ?? "https://play.rust-lang.org/execute";

/** Strip ANSI colour codes the compiler emits, mirroring the browser runner. */
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;
function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, "");
}

interface RustPlaygroundPayload {
  channel: "stable" | "beta" | "nightly";
  mode: "debug" | "release";
  edition: "2015" | "2018" | "2021";
  crateType: "bin" | "lib";
  tests: boolean;
  backtrace: boolean;
  code: string;
}

interface RustPlaygroundResponse {
  success: boolean;
  stdout: string;
  stderr: string;
}

/**
 * Build a Rust program that exercises the learner's function against every test
 * and prints a NONCE-tagged PASS/FAIL marker per test. Faithful server port of
 * `buildRustTestHarness` in `components/editor/challenge-runner.tsx`, with the
 * marker nonce added so a submission cannot forge a passing line.
 *
 * Returns `null` when no gradable top-level function is found (or the only one
 * is `main`) — the caller treats that as a non-pass for every test rather than
 * silently compiling the submission as-is.
 */
function buildRustTestHarness(
  userCode: string,
  tests: AdminTestCase[],
  nonce: string
): string | null {
  // Match top-level fn declarations (start of line, no indentation). This skips
  // methods inside impl blocks, which are always indented.
  const topLevelFns = [...userCode.matchAll(/^fn\s+(\w+)\s*\(/gm)];
  const lastMatch = topLevelFns[topLevelFns.length - 1];
  const fnName = lastMatch?.[1] ?? null;

  if (!fnName || fnName === "main") {
    return null;
  }

  const testCalls = tests.map((tc, index) => {
    const args = tc.input.trim();
    const expected = tc.expectedOutput.trim();

    if (expected.includes("__result__")) {
      // Capture debug repr before the test expression, which may move __result__.
      return `
    let __result__ = ${fnName}(${args});
    let __dbg__ = format!("{:?}", &__result__);
    if ${expected} {
        println!("TEST_${nonce}_${index}_PASS");
    } else {
        println!("TEST_${nonce}_${index}_FAIL: got {}", __dbg__);
    }`;
    }

    return `
    let __result__ = ${fnName}(${args});
    let __expected__ = ${expected};
    if __result__ == __expected__ {
        println!("TEST_${nonce}_${index}_PASS");
    } else {
        println!("TEST_${nonce}_${index}_FAIL: expected {:?}, got {:?}", __expected__, __result__);
    }`;
  });

  const codeWithoutMain = userCode.replace(
    /fn\s+main\s*\(\s*\)\s*\{[\s\S]*?\n\}/,
    ""
  );

  return `${codeWithoutMain}

fn main() {
${testCalls.join("\n")}
}`;
}

/**
 * Grade Playground output. A test passes ONLY when its nonce-tagged PASS marker
 * is present in real stdout. Missing marker (e.g. compilation failed, or the
 * submission panicked before reaching it) is a FAIL. Mirrors
 * `parseRustTestResults` but keyed by the per-run nonce.
 */
function gradeFromOutput(
  stdout: string,
  tests: AdminTestCase[],
  nonce: string
): ServerTestResult[] {
  const cleanStdout = stripAnsi(stdout);
  return tests.map((tc, index) => {
    const passPattern = `TEST_${nonce}_${index}_PASS`;
    const failPattern = new RegExp(`TEST_${nonce}_${index}_FAIL:?\\s*(.*)`);
    const hidden = tc.hidden === true;

    if (cleanStdout.includes(passPattern)) {
      return { id: tc.id, hidden, passed: true, detail: "pass" };
    }

    const failMatch = cleanStdout.match(failPattern);
    if (failMatch) {
      return {
        id: tc.id,
        hidden,
        passed: false,
        detail: (failMatch[1]?.trim() || "assertion failed").slice(0, 200),
      };
    }

    return {
      id: tc.id,
      hidden,
      passed: false,
      detail: "no result (compilation failed or panicked)",
    };
  });
}

/** Build the result that fails every test with a shared detail. */
function failAll(
  tests: AdminTestCase[],
  detail: string
): Extract<SubmissionRunResult, { available: true }> {
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

/**
 * Whether the Rust execution substrate is reachable in this environment.
 *
 * Unlike the JS executor (a native addon that is either loadable or not), the
 * Rust substrate is a remote HTTP service whose reachability is only known by
 * actually calling it. To preserve fail-closed semantics WITHOUT a probe on
 * every keystroke, this returns false only when the substrate is structurally
 * impossible to reach — i.e. the upstream URL is empty/unset. The real
 * unreachable/timeout cases surface as `available: false` from
 * {@link runRustSubmission}, which callers already treat as deny.
 */
export async function isRustExecutorAvailable(): Promise<boolean> {
  return RUST_PLAYGROUND_URL.trim().length > 0;
}

/**
 * Run a Rust function-challenge submission against every supplied test via the
 * Rust Playground, server-to-server.
 *
 * Contract (identical to {@link "./executor".runJsSubmission}): returns
 * `{ available: false }` when the substrate could not run — callers MUST deny
 * completion in that case. When available, `passed` is true only if EVERY test
 * (visible + hidden) passed, judged from real compiler stdout.
 */
export async function runRustSubmission(
  code: string,
  tests: AdminTestCase[]
): Promise<SubmissionRunResult> {
  if (RUST_PLAYGROUND_URL.trim().length === 0) {
    return { available: false, reason: "executor_unavailable" };
  }

  if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
    return failAll(tests, "Submission too large");
  }

  // No tests to grade ⇒ nothing the server can prove. Treat as a non-pass.
  if (tests.length === 0) {
    return { available: true, passed: false, results: [] };
  }

  // Per-run nonce: an unpredictable token a submission cannot pre-print to forge
  // a passing marker. Alphanumeric only so it is a safe Rust identifier fragment.
  const nonce = globalThis.crypto.randomUUID().replace(/-/g, "");

  const harness = buildRustTestHarness(code, tests, nonce);
  if (harness === null) {
    return failAll(tests, "No gradable function found in submission");
  }

  const payload: RustPlaygroundPayload = {
    channel: "stable",
    mode: "debug",
    edition: "2021",
    crateType: "bin",
    // The harness provides its own main(); compile+run as a binary (NOT the
    // #[test] runner) so our println! markers reach stdout.
    tests: false,
    backtrace: false,
    code: harness,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(RUST_PLAYGROUND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch {
    // Network error or timeout abort ⇒ degrade closed (deny completion).
    return { available: false, reason: "executor_unavailable" };
  } finally {
    clearTimeout(timeout);
  }

  if (!upstream.ok) {
    // The substrate is up but errored (5xx/4xx). We cannot prove the submission
    // passed ⇒ degrade closed rather than guess.
    return { available: false, reason: "executor_unavailable" };
  }

  let result: RustPlaygroundResponse;
  try {
    result = (await upstream.json()) as RustPlaygroundResponse;
  } catch {
    return { available: false, reason: "executor_unavailable" };
  }

  // A failed COMPILATION is a legitimate non-pass of the submission (not a
  // substrate outage): no PASS markers will be present, so every test fails.
  const results = gradeFromOutput(result.stdout ?? "", tests, nonce);

  return {
    available: true,
    passed: results.length > 0 && results.every((r) => r.passed),
    results,
  };
}
