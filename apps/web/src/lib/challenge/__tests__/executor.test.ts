import { describe, it, expect } from "vitest";
import type { AdminTestCase } from "@superteam-lms/types";
import { runJsSubmission, isExecutorAvailable } from "../executor";
import { validateAgainstAnswerKey } from "../validate";
import type { ChallengeAnswerKey } from "@/lib/sanity/queries";

// These tests exercise the REAL isolated-vm executor (no mocks). They prove the
// server is authoritative: correctness is judged by running the submission
// against the server-held tests, so a forged client "passed" cannot produce a
// passing verdict. They also assert the sandbox isolation guarantees
// (no host objects, timeout kills runaway code).

const sumTests: AdminTestCase[] = [
  {
    id: "visible-1",
    description: "adds 2 and 3",
    input: "2, 3",
    expectedOutput: "result === 5",
  },
  {
    id: "hidden-1",
    description: "adds 10 and 20 (hidden)",
    input: "10, 20",
    expectedOutput: "result === 30",
    hidden: true,
  },
];

const CORRECT = "function add(a, b) { return a + b; }";
// Passes the VISIBLE test (returns 5 for 2,3) but FAILS the hidden test —
// this is exactly the "passed in the browser" shape that must be caught.
const PASSES_VISIBLE_ONLY =
  "function add(a, b) { if (a === 2 && b === 3) return 5; return -1; }";
const WRONG = "function add(a, b) { return a * b; }";
const EMPTY = "";

describe("secure challenge executor (isolated-vm)", () => {
  it("is available in this environment", async () => {
    expect(await isExecutorAvailable()).toBe(true);
  });

  it("passes a correct submission against ALL tests (visible + hidden)", async () => {
    const run = await runJsSubmission(CORRECT, sumTests);
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.passed).toBe(true);
    expect(run.results.every((r) => r.passed)).toBe(true);
    // hidden test was actually executed
    expect(run.results.find((r) => r.id === "hidden-1")?.passed).toBe(true);
  });

  it("rejects a WRONG submission", async () => {
    const run = await runJsSubmission(WRONG, sumTests);
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.passed).toBe(false);
  });

  it("rejects an EMPTY submission", async () => {
    const run = await runJsSubmission(EMPTY, sumTests);
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.passed).toBe(false);
  });

  it("FORGED PASS IS BLOCKED: code that only satisfies the visible test fails the hidden test", async () => {
    const run = await runJsSubmission(PASSES_VISIBLE_ONLY, sumTests);
    expect(run.available).toBe(true);
    if (!run.available) return;
    // Visible passes, hidden fails -> overall NOT passed. The client could have
    // claimed "all green", but the server runs the hidden test and rejects.
    expect(run.results.find((r) => r.id === "visible-1")?.passed).toBe(true);
    expect(run.results.find((r) => r.id === "hidden-1")?.passed).toBe(false);
    expect(run.passed).toBe(false);
  });

  it("kills CPU-bound runaway code via in-isolate timeout (does not hang)", async () => {
    const tests: AdminTestCase[] = [
      { id: "t", description: "loops", input: "", expectedOutput: "true" },
    ];
    const run = await runJsSubmission(
      "function go() { while (true) {} }",
      tests
    );
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.passed).toBe(false);
  }, 20_000);

  it("aborts a quiescent never-settling promise via host guard (does not hang)", async () => {
    const tests: AdminTestCase[] = [
      { id: "t", description: "hangs", input: "", expectedOutput: "true" },
    ];
    // No CPU spin: the in-isolate timeout can't fire, so the host wall-clock
    // guard must abandon the evaluation.
    const run = await runJsSubmission(
      "async function go() { await new Promise(function(){}); }",
      tests
    );
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.passed).toBe(false);
  }, 20_000);

  it("denies host escapes: process / require / globalThis are unreachable", async () => {
    const escapeTests: AdminTestCase[] = [
      {
        id: "no-process",
        description: "process is undefined",
        input: "",
        expectedOutput: "typeof process === 'undefined'",
      },
      {
        id: "no-require",
        description: "require is undefined",
        input: "",
        expectedOutput: "typeof require === 'undefined'",
      },
    ];
    // A submission that probes the host. The assertions verify the host objects
    // are absent inside the isolate, so these "pass" — proving no leakage.
    const run = await runJsSubmission(
      "function probe() { return true; }",
      escapeTests
    );
    expect(run.available).toBe(true);
    if (!run.available) return;
    expect(run.results.find((r) => r.id === "no-process")?.passed).toBe(true);
    expect(run.results.find((r) => r.id === "no-require")?.passed).toBe(true);
  });
});

describe("validateAgainstAnswerKey (completion gate logic)", () => {
  function key(over: Partial<ChallengeAnswerKey> = {}): ChallengeAnswerKey {
    return {
      _id: "lesson-1",
      type: "challenge",
      language: null,
      buildType: null,
      tests: sumTests,
      solution: CORRECT,
      ...over,
    };
  }

  it("returns validated+passed for a correct JS submission", async () => {
    const verdict = await validateAgainstAnswerKey(key(), CORRECT);
    expect(verdict.kind).toBe("validated");
    if (verdict.kind !== "validated") return;
    expect(verdict.passed).toBe(true);
    expect(verdict.hiddenTestCount).toBe(1);
    expect(verdict.visibleTestCount).toBe(1);
  });

  it("returns validated+!passed for a wrong submission (gate would 403)", async () => {
    const verdict = await validateAgainstAnswerKey(key(), WRONG);
    expect(verdict.kind).toBe("validated");
    if (verdict.kind !== "validated") return;
    expect(verdict.passed).toBe(false);
  });

  it("returns validated+!passed for a forged-visible-only submission", async () => {
    const verdict = await validateAgainstAnswerKey(key(), PASSES_VISIBLE_ONLY);
    expect(verdict.kind).toBe("validated");
    if (verdict.kind !== "validated") return;
    expect(verdict.passed).toBe(false);
  });

  it("classifies non-challenge lessons as not_a_challenge (gate skipped)", async () => {
    const verdict = await validateAgainstAnswerKey(
      key({ type: "content" }),
      ""
    );
    expect(verdict.kind).toBe("not_a_challenge");
  });

  it("classifies rust / buildable challenges as non_js_challenge", async () => {
    const rust = await validateAgainstAnswerKey(
      key({ language: "rust" }),
      "fn add() {}"
    );
    expect(rust.kind).toBe("non_js_challenge");

    const buildable = await validateAgainstAnswerKey(
      key({ buildType: "buildable" }),
      "// program"
    );
    expect(buildable.kind).toBe("non_js_challenge");
  });
});
