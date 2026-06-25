import { describe, it, expect, vi, afterEach } from "vitest";
import type { AdminTestCase } from "@superteam-lms/types";
import { isExecutorAvailable, runJsSubmission } from "../executor";
import { validateAgainstAnswerKey } from "../validate";
import type { ChallengeAnswerKey } from "@/lib/sanity/queries";

// `isolated-vm` is an OPTIONAL native addon: it requires Node >= 22 and a
// prebuilt/buildable binary, so it is ABSENT on the repo's Node 20 CI runner and
// on Vercel serverless. The isolate-backed tests below therefore run ONLY when
// the addon actually loaded in this environment (resolved once, here); otherwise
// they are SKIPPED, not failed. The gate-logic and degrade-closed tests further
// down do NOT need the isolate and always run — they are what proves the
// server-authoritative behaviour in the addon-absent environment.
const EXECUTOR_AVAILABLE = await isExecutorAvailable();

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

// These tests exercise the REAL isolated-vm executor (no mocks). They prove the
// server is authoritative: correctness is judged by running the submission
// against the server-held tests, so a forged client "passed" cannot produce a
// passing verdict. They also assert the sandbox isolation guarantees
// (no host objects, timeout kills runaway code). SKIPPED when the addon is
// absent (e.g. Node 20 / serverless) — see EXECUTOR_AVAILABLE above.
describe.skipIf(!EXECUTOR_AVAILABLE)(
  "secure challenge executor (isolated-vm)",
  () => {
    it("reports available in this environment", async () => {
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

    // REGRESSION (#195 review HOLE-1): the validator reused ONE isolate context
    // for every test, and the in-isolate harness builds each wrapper with
    // `new Function(...)` (the shared realm's globalThis.Function) and serialises
    // its verdict with `JSON.stringify`. A submission could poison those
    // intrinsics in test #1 (or its own test) to force every later/hidden test
    // to "pass". Fix: a FRESH context per test + the harness builds/serialises
    // through CAPTURED intrinsics. These hidden tests demand a value the poison
    // code does NOT compute (add(10,20)=30, asserted === 999), so a "pass" can
    // ONLY come from taint — each MUST stay failed.
    it.each([
      [
        "globalThis.Function",
        'function add(a,b){ globalThis.Function = function(){ return function(){ return Promise.resolve("pass"); }; }; return a+b; }',
      ],
      [
        "Object.prototype",
        "function add(a,b){ Object.prototype.ok = true; return a+b; }",
      ],
      [
        "Array.prototype",
        "function add(a,b){ Array.prototype.push = function(){ return 0; }; return a+b; }",
      ],
      [
        "JSON.stringify",
        'function add(a,b){ JSON.stringify = function(){ return "{\\"ok\\":true}"; }; return a+b; }',
      ],
    ])(
      "VALIDATOR-BYPASS BLOCKED: poisoning %s does not force-pass the hidden test",
      async (_name, exploit) => {
        const poisonTests: AdminTestCase[] = [
          {
            id: "visible-1",
            description: "adds 2 and 3",
            input: "2, 3",
            expectedOutput: "result === 5",
          },
          {
            id: "hidden-1",
            description: "hidden, real answer is 30 — asserts 999",
            input: "10, 20",
            expectedOutput: "result === 999",
            hidden: true,
          },
        ];
        const run = await runJsSubmission(exploit, poisonTests);
        expect(run.available).toBe(true);
        if (!run.available) return;
        // The submission's add() is correct arithmetic, so the VISIBLE test
        // passes legitimately; the HIDDEN test must NOT be force-passed.
        expect(run.results.find((r) => r.id === "hidden-1")?.passed).toBe(
          false
        );
        expect(run.passed).toBe(false);
      },
      30_000
    );

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
  }
);

function answerKey(over: Partial<ChallengeAnswerKey> = {}): ChallengeAnswerKey {
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

// Gate logic that DOES exercise the real isolate (judging real submissions).
// Guarded so it is skipped when the addon is absent — the degrade-closed block
// below covers the addon-absent path deterministically.
describe.skipIf(!EXECUTOR_AVAILABLE)(
  "validateAgainstAnswerKey (executor present)",
  () => {
    it("returns validated+passed for a correct JS submission", async () => {
      const verdict = await validateAgainstAnswerKey(answerKey(), CORRECT);
      expect(verdict.kind).toBe("validated");
      if (verdict.kind !== "validated") return;
      expect(verdict.passed).toBe(true);
      expect(verdict.hiddenTestCount).toBe(1);
      expect(verdict.visibleTestCount).toBe(1);
    });

    it("returns validated+!passed for a wrong submission (gate would 403)", async () => {
      const verdict = await validateAgainstAnswerKey(answerKey(), WRONG);
      expect(verdict.kind).toBe("validated");
      if (verdict.kind !== "validated") return;
      expect(verdict.passed).toBe(false);
    });

    it("returns validated+!passed for a forged-visible-only submission", async () => {
      const verdict = await validateAgainstAnswerKey(
        answerKey(),
        PASSES_VISIBLE_ONLY
      );
      expect(verdict.kind).toBe("validated");
      if (verdict.kind !== "validated") return;
      expect(verdict.passed).toBe(false);
    });
  }
);

// Classification logic that needs NO isolate — always runs, including on the
// Node 20 / serverless CI where the addon is absent.
describe("validateAgainstAnswerKey (classification, no isolate)", () => {
  it("classifies non-challenge lessons as not_a_challenge (gate skipped)", async () => {
    const verdict = await validateAgainstAnswerKey(
      answerKey({ type: "content" }),
      ""
    );
    expect(verdict.kind).toBe("not_a_challenge");
  });

  it("classifies rust / buildable challenges as non_js_challenge", async () => {
    const rust = await validateAgainstAnswerKey(
      answerKey({ language: "rust" }),
      "fn add() {}"
    );
    expect(rust.kind).toBe("non_js_challenge");

    const buildable = await validateAgainstAnswerKey(
      answerKey({ buildType: "buildable" }),
      "// program"
    );
    expect(buildable.kind).toBe("non_js_challenge");
  });
});

// DEGRADE-CLOSED — the contract that keeps the platform safe when the secure
// executor cannot run (the exact Node 20 / Vercel situation). The executor
// module is MOCKED unavailable so this is deterministic regardless of whether
// isolated-vm happens to be built in the current environment. The verdict here
// is what the routes turn into a 503 (POST /api/lessons/complete) — completion
// is BLOCKED, never silently granted.
describe("degrade-closed when executor is unavailable (mocked)", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("a JS challenge yields executor_unavailable, NOT a pass — even for the reference solution", async () => {
    vi.resetModules();
    vi.doMock("@/lib/challenge/executor", () => ({
      isExecutorAvailable: vi.fn().mockResolvedValue(false),
      // If this were ever reached it would throw — proving the gate denies
      // BEFORE running anything when the executor is unavailable.
      runJsSubmission: vi.fn(async () => {
        throw new Error("executor must not run when unavailable");
      }),
    }));

    const { validateAgainstAnswerKey: validateUnavailable } =
      await import("../validate");

    // The reference solution would PASS if the executor ran; with the executor
    // down it must still be denied (degrade closed), not waved through.
    const verdict = await validateUnavailable(answerKey(), CORRECT);
    expect(verdict.kind).toBe("executor_unavailable");
    if (verdict.kind !== "executor_unavailable") return;
    expect(verdict.hiddenTestCount).toBe(1);
    expect(verdict.visibleTestCount).toBe(1);
    // Crucially there is no `passed: true` shape on this verdict — the route
    // maps `executor_unavailable` to HTTP 503, blocking completion.
    expect("passed" in verdict).toBe(false);
  });

  it("treats runJsSubmission reporting available:false as a non-pass (deny)", async () => {
    vi.resetModules();
    vi.doMock("@/lib/challenge/executor", () => ({
      // isExecutorAvailable optimistically true, but the run reports it could
      // not actually execute — the validator must still degrade closed.
      isExecutorAvailable: vi.fn().mockResolvedValue(true),
      runJsSubmission: vi.fn().mockResolvedValue({
        available: false,
        reason: "executor_unavailable",
      }),
    }));

    const { validateAgainstAnswerKey: validateUnavailable } =
      await import("../validate");

    const verdict = await validateUnavailable(answerKey(), PASSES_VISIBLE_ONLY);
    expect(verdict.kind).toBe("executor_unavailable");
  });
});
