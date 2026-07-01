/**
 * Authoritative server-side grader for Rust challenge submissions.
 *
 * WHY THIS EXISTS
 * ---------------
 * `/api/lessons/complete` must independently prove a submission passes ALL
 * tests (visible + hidden) before it records an on-chain completion. For
 * JS/TS challenges that proof comes from the isolated-vm executor
 * (`executor.ts`). Rust challenges (`language: "rust"`, NOT `buildType:
 * "buildable"`) are graded here: the submission is compiled + run on the Rust
 * Playground — the same upstream the browser runner uses — but the SERVER runs
 * the full test set and is the source of truth. This mirrors the JS executor's
 * relationship to the browser JS worker.
 *
 * SECURITY — this path grants on-chain XP, so it must resist a hostile
 * submission forging a pass, which the browser runner (non-authoritative) does
 * not care about:
 *
 *   - NONCE-GUARDED MARKERS. Pass/fail is read from `TEST_<nonce>_<i>_PASS`
 *     lines on stdout, where <nonce> is a fresh server-generated random token
 *     never shown to the client. A submission can `println!` anything, but it
 *     cannot emit a marker for a nonce it cannot guess, so it cannot fake a pass.
 *   - DENYLIST of compile-time source/environment reflection macros
 *     (`file!`, `include_str!`, `include!`, `env!`, …). Without this a
 *     submission could `include_str!(file!())` to read the assembled harness
 *     source and recover the nonce. Any hit fails the submission closed.
 *   - DEGRADE CLOSED. If the Playground is unreachable or returns a non-2xx,
 *     the grader reports `available: false`; callers MUST deny completion.
 *     A submission that merely fails to compile is `available: true` with every
 *     test failed (compile error != executor outage).
 *
 * The Playground itself sandboxes execution (no network, no writable fs, CPU/
 * wall limits) on its own infrastructure — untrusted Rust never runs on ours.
 */

import { randomBytes } from "node:crypto";
import type { AdminTestCase } from "@superteam-lms/types";
import type { ServerTestResult, SubmissionRunResult } from "./executor";

const RUST_PLAYGROUND_URL =
  process.env.RUST_PLAYGROUND_URL ?? "https://play.rust-lang.org/execute";

/** Matches the browser runner + /api/rust/execute upstream budget. */
const UPSTREAM_TIMEOUT_MS = 30_000;

/** Upper bound on the RAW submission we are willing to compile. */
const MAX_CODE_BYTES = 50 * 1024;

/**
 * Compile-time reflection / escape-hatch macros. A submission using any of
 * these could read the harness source (and thus the nonce) or the build
 * environment, defeating the marker guard. Legitimate learning solutions never
 * need them. Matched as whole macro invocations (`ident!`).
 */
const DENYLISTED_MACROS =
  /\b(?:include_str|include_bytes|include|file|module_path|env|option_env)\s*!/;

interface PlaygroundResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  exitDetail?: string;
}

const ANSI_REGEX = /\x1b\[[0-9;]*m/g;
const stripAnsi = (s: string): string => s.replace(ANSI_REGEX, "");

/**
 * Detect the last top-level `fn` in the submission — the function the tests
 * invoke. Top-level only (start of line, no indentation) so methods inside
 * `impl` blocks are skipped. Mirrors `buildRustTestHarness` in the browser
 * runner. `main` is not a gradeable entry point.
 */
function detectFunctionName(code: string): string | null {
  const fns = [...code.matchAll(/^fn\s+(\w+)\s*\(/gm)];
  const name = fns[fns.length - 1]?.[1] ?? null;
  return name && name !== "main" ? name : null;
}

/**
 * Assemble the gradeable program: the submission with any `fn main` removed,
 * followed by a generated `main` that calls the detected function once per test
 * and prints a nonce-guarded PASS/FAIL marker for each. Each test runs in its
 * own block so `__result__` bindings don't collide.
 */
function buildHarness(
  code: string,
  fnName: string,
  tests: AdminTestCase[],
  nonce: string
): string {
  const withoutMain = code.replace(/fn\s+main\s*\(\s*\)\s*\{[\s\S]*?\n\}/, "");

  const blocks = tests.map((tc, i) => {
    const args = (tc.input ?? "").trim();
    const expected = (tc.expectedOutput ?? "").trim();
    const pass = `TEST_${nonce}_${i}_PASS`;
    const fail = `TEST_${nonce}_${i}_FAIL`;

    // Expected clauses that reference __result__ are boolean predicates
    // (e.g. `__result__.contains("…")`); others are equality targets.
    if (expected.includes("__result__")) {
      return `    {
        let __result__ = ${fnName}(${args});
        let __dbg__ = format!("{:?}", &__result__);
        if ${expected} {
            println!("${pass}");
        } else {
            println!("${fail}: got {}", __dbg__);
        }
    }`;
    }

    return `    {
        let __result__ = ${fnName}(${args});
        let __expected__ = ${expected};
        if __result__ == __expected__ {
            println!("${pass}");
        } else {
            println!("${fail}: expected {:?}, got {:?}", __expected__, __result__);
        }
    }`;
  });

  return `${withoutMain}\n\nfn main() {\n${blocks.join("\n")}\n}\n`;
}

/** Fail every test with the same reason (bad submission, not executor outage). */
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

/**
 * Grade a Rust submission against every supplied test.
 *
 * Contract mirrors {@link runJsSubmission}: `{ available: false }` means the
 * grader could not run (deny completion); when available, `passed` is true only
 * if EVERY test passed.
 */
export async function runRustSubmission(
  code: string,
  tests: AdminTestCase[]
): Promise<SubmissionRunResult> {
  if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
    return allFailed(tests, "Submission too large");
  }

  if (DENYLISTED_MACROS.test(code)) {
    return allFailed(tests, "Submission uses a disallowed macro");
  }

  const fnName = detectFunctionName(code);
  if (!fnName) {
    return allFailed(tests, "No top-level function found in submission");
  }

  const nonce = randomBytes(12).toString("hex");
  const harness = buildHarness(code, fnName, tests, nonce);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let data: PlaygroundResponse;
  try {
    const res = await fetch(RUST_PLAYGROUND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "stable",
        mode: "debug",
        edition: "2021",
        crateType: "bin",
        tests: false,
        backtrace: false,
        code: harness,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      // Upstream reachable but erroring (5xx/429/etc.) — cannot grade.
      return { available: false, reason: "executor_unavailable" };
    }
    data = (await res.json()) as PlaygroundResponse;
  } catch {
    // Network failure / timeout / abort — degrade closed.
    return { available: false, reason: "executor_unavailable" };
  } finally {
    clearTimeout(timer);
  }

  const stdout = stripAnsi(data.stdout ?? "");
  const stderr = stripAnsi(data.stderr ?? "");
  const compileFailed = !stdout.includes(`TEST_${nonce}_`);

  const results: ServerTestResult[] = tests.map((tc, i) => {
    const hidden = tc.hidden === true;
    if (stdout.includes(`TEST_${nonce}_${i}_PASS`)) {
      return { id: tc.id, hidden, passed: true, detail: "pass" };
    }
    const failMatch = stdout.match(
      new RegExp(`TEST_${nonce}_${i}_FAIL:?\\s*(.*)`)
    );
    if (failMatch) {
      return {
        id: tc.id,
        hidden,
        passed: false,
        detail: (failMatch[1] ?? "assertion failed").slice(0, 200),
      };
    }
    // No marker for this test: compile error or a panic aborted the run.
    return {
      id: tc.id,
      hidden,
      passed: false,
      detail: compileFailed
        ? (
            stderr.split("\n").find((l) => l.includes("error")) ??
            "Compilation failed"
          ).slice(0, 200)
        : "No result produced",
    };
  });

  return {
    available: true,
    passed: results.length > 0 && results.every((r) => r.passed),
    results,
  };
}
