import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AdminTestCase } from "@superteam-lms/types";
import { isRustExecutorAvailable, runRustSubmission } from "../rust-executor";

/**
 * These tests never reach the real Rust Playground. The substrate is mocked at
 * `globalThis.fetch`, and the per-run marker nonce is pinned, so we can assert
 * the exact harness/grading behaviour deterministically:
 *
 *   - a submission passes ONLY when the SERVER observes every nonce-tagged PASS
 *     marker in real stdout (server-authoritative, non-forgeable),
 *   - HIDDEN tests are injected into the harness and gate the verdict,
 *   - a submission cannot forge a pass by println!-ing a marker (unpredictable
 *     nonce), and
 *   - any substrate failure degrades CLOSED (`available: false` ⇒ deny).
 */

// runRustSubmission derives its marker nonce as `crypto.randomUUID()` with
// dashes stripped. We pin the UUID below; FIXED_NONCE is that UUID dash-stripped,
// i.e. exactly what the grader scans for.
const FIXED_UUID =
  "deadbeef-cafe-babe-0000-000000000000" as `${string}-${string}-${string}-${string}-${string}`;
const FIXED_NONCE = FIXED_UUID.replace(/-/g, "");

const sumTests: AdminTestCase[] = [
  {
    id: "visible-1",
    description: "adds 2 and 3",
    input: "2, 3",
    expectedOutput: "5",
  },
  {
    id: "hidden-1",
    description: "adds 10 and 20 (hidden)",
    input: "10, 20",
    expectedOutput: "30",
    hidden: true,
  },
];

const CORRECT = "fn add(a: i32, b: i32) -> i32 { a + b }";

/**
 * Stand in for the Rust Playground. Compiles+runs the harness "for real" by
 * emitting the PASS/FAIL markers a correctly-graded run would produce, given a
 * map of test index → did the submission satisfy it. The marker text is keyed by
 * the pinned nonce so it matches what the grader scans for.
 */
function playgroundOk(markerLines: string): Response {
  return {
    ok: true,
    json: async () => ({
      success: true,
      stdout: markerLines,
      stderr: "",
    }),
  } as unknown as Response;
}

function mockFetchOnce(impl: () => Response | Promise<Response>): void {
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => await impl());
}

beforeEach(() => {
  // Pin the nonce so the test's mock stdout matches the grader's markers.
  vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(FIXED_UUID);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isRustExecutorAvailable", () => {
  it("is available when the playground URL is configured (default)", async () => {
    expect(await isRustExecutorAvailable()).toBe(true);
  });
});

describe("runRustSubmission — grading from real output", () => {
  it("passes a correct submission against ALL tests (visible + hidden)", async () => {
    mockFetchOnce(() =>
      playgroundOk(`TEST_${FIXED_NONCE}_0_PASS\nTEST_${FIXED_NONCE}_1_PASS\n`)
    );

    const run = await runRustSubmission(CORRECT, sumTests);
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.passed).toBe(true);
    // The hidden test was actually graded.
    expect(run.results.find((r) => r.id === "hidden-1")?.passed).toBe(true);
    expect(run.results.find((r) => r.id === "hidden-1")?.hidden).toBe(true);
  });

  it("HIDDEN TEST GATES COMPLETION: visible passes, hidden fails ⇒ overall not passed", async () => {
    // Mirrors a submission that satisfies the visible test but not the hidden one.
    mockFetchOnce(() =>
      playgroundOk(
        `TEST_${FIXED_NONCE}_0_PASS\nTEST_${FIXED_NONCE}_1_FAIL: expected 30, got 200\n`
      )
    );

    const run = await runRustSubmission(CORRECT, sumTests);
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.results.find((r) => r.id === "visible-1")?.passed).toBe(true);
    expect(run.results.find((r) => r.id === "hidden-1")?.passed).toBe(false);
    expect(run.passed).toBe(false);
  });

  it("rejects a submission that fails to compile (no markers in stdout)", async () => {
    // Compilation failure ⇒ success may even be false, stdout has no markers.
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        stdout: "",
        stderr: "error[E0308]: mismatched types",
      }),
    } as unknown as Response);

    const run = await runRustSubmission('fn add() -> i32 { "nope" }', sumTests);
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.passed).toBe(false);
    expect(run.results.every((r) => !r.passed)).toBe(true);
  });

  it("FORGED PASS IS BLOCKED: a submission cannot println! a passing marker it can't predict", async () => {
    // The submission prints a marker with a GUESSED nonce ("aaaa"), but the
    // server's real nonce is FIXED_NONCE. Even though the forged line is in
    // stdout, it does not match the grader's pattern, so the test stays failed.
    mockFetchOnce(() =>
      playgroundOk(
        // forged (wrong nonce) + the real FAIL the harness actually produced
        `TEST_aaaa_0_PASS\nTEST_aaaa_1_PASS\n` +
          `TEST_${FIXED_NONCE}_0_FAIL: expected 5, got 6\n` +
          `TEST_${FIXED_NONCE}_1_FAIL: expected 30, got 60\n`
      )
    );

    const run = await runRustSubmission(
      "fn add(a: i32, b: i32) -> i32 { a + b + 1 }",
      sumTests
    );
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.passed).toBe(false);
    expect(run.results.every((r) => !r.passed)).toBe(true);
  });

  it("fails every test when no gradable top-level function is found", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const run = await runRustSubmission("// just a comment", sumTests);
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.passed).toBe(false);
    // Never even called the substrate — nothing gradable to run.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("treats an empty test set as a non-pass (nothing the server can prove)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const run = await runRustSubmission(CORRECT, []);
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.passed).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("runRustSubmission — degrade closed", () => {
  it("returns available:false when the substrate is unreachable (network error)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));
    const run = await runRustSubmission(CORRECT, sumTests);
    expect(run.available).toBe(false);
  });

  it("returns available:false on a non-2xx from the substrate", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({}),
    } as unknown as Response);
    const run = await runRustSubmission(CORRECT, sumTests);
    expect(run.available).toBe(false);
  });

  it("returns available:false on a malformed substrate response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response);
    const run = await runRustSubmission(CORRECT, sumTests);
    expect(run.available).toBe(false);
  });
});
