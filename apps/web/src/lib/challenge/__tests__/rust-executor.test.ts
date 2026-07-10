import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
import type { AdminTestCase, CodeBlockData } from "@superteam-lms/types";
import { runRustSubmission } from "../rust-executor";
import { gradeCode } from "@/lib/grading/graders/code";

const tests: AdminTestCase[] = [
  { id: "v1", description: "visible", input: "2, 3", expectedOutput: "5" },
  {
    id: "h1",
    description: "hidden",
    input: "10, 20",
    expectedOutput: "30",
    hidden: true,
  },
];

const CODE = "fn add(a: i32, b: i32) -> i32 { a + b }";

/**
 * Stub the Rust Playground. The callback receives the assembled harness and the
 * per-request nonce recovered from it, and returns the stdout/stderr the
 * Playground would produce — so tests exercise the real nonce-guarded parser.
 */
function mockPlayground(
  respond: (
    nonce: string,
    code: string
  ) => { ok?: boolean; success?: boolean; stdout?: string; stderr?: string }
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: { body: string }) => {
      const { code } = JSON.parse(init.body) as { code: string };
      const nonce = code.match(/TEST_([0-9a-f]{24})_/)?.[1] ?? "";
      const r = respond(nonce, code);
      return {
        ok: r.ok ?? true,
        json: async () => ({
          success: r.success ?? true,
          stdout: r.stdout ?? "",
          stderr: r.stderr ?? "",
        }),
      } as unknown as Response;
    })
  );
}

const passAll = (nonce: string) =>
  `TEST_${nonce}_0_PASS\nTEST_${nonce}_1_PASS\n`;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("runRustSubmission", () => {
  it("passes only when every test (incl. hidden) passes", async () => {
    mockPlayground((n) => ({ stdout: passAll(n) }));
    const r = await runRustSubmission(CODE, tests);
    expect(r.available).toBe(true);
    expect(r).toMatchObject({ passed: true });
  });

  it("fails when a hidden test fails even if the visible one passes", async () => {
    mockPlayground((n) => ({
      stdout: `TEST_${n}_0_PASS\nTEST_${n}_1_FAIL: expected 30, got 200\n`,
    }));
    const r = await runRustSubmission(CODE, tests);
    expect(r).toMatchObject({ available: true, passed: false });
    if (r.available) {
      expect(r.results[0]?.passed).toBe(true);
      expect(r.results[1]?.passed).toBe(false);
      expect(r.results[1]?.hidden).toBe(true);
    }
  });

  it("does NOT trust unguarded markers a submission prints itself", async () => {
    // Submission emits a marker WITHOUT the server nonce — must not count.
    mockPlayground(() => ({ stdout: "TEST_0_PASS\nTEST_1_PASS\n" }));
    const r = await runRustSubmission(CODE, tests);
    expect(r).toMatchObject({ available: true, passed: false });
  });

  it("treats a compile failure as all-failed, not an outage", async () => {
    mockPlayground(() => ({
      success: false,
      stdout: "",
      stderr: "error[E0425]: cannot find value `x` in this scope",
    }));
    const r = await runRustSubmission(CODE, tests);
    expect(r).toMatchObject({ available: true, passed: false });
    if (r.available) {
      expect(r.results[0]?.detail).toContain("error");
    }
  });

  it("degrades closed when the Playground is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      })
    );
    const r = await runRustSubmission(CODE, tests);
    expect(r).toEqual({ available: false, reason: "executor_unavailable" });
  });

  it("degrades closed on a non-2xx Playground response", async () => {
    mockPlayground(() => ({ ok: false }));
    const r = await runRustSubmission(CODE, tests);
    expect(r).toEqual({ available: false, reason: "executor_unavailable" });
  });

  it("rejects source-reflection macros without calling the Playground", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    const r = await runRustSubmission(
      "fn add(a: i32, b: i32) -> i32 { let _ = include_str!(file!()); a + b }",
      tests
    );
    expect(r).toMatchObject({ available: true, passed: false });
    expect(spy).not.toHaveBeenCalled();
  });

  it("fails closed when no top-level function is present", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    const r = await runRustSubmission("fn main() { let x = 1; }", tests);
    expect(r).toMatchObject({ available: true, passed: false });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("gradeCode — Rust routing", () => {
  const rustBlock: CodeBlockData = {
    _type: "code",
    key: "c1",
    language: "rust",
    buildType: "standard",
    starter: "",
    solution: CODE,
    tests,
  };

  it("grades a rust challenge to ok via the Playground", async () => {
    mockPlayground((n) => ({ stdout: passAll(n) }));
    expect(await gradeCode(rustBlock, { code: CODE })).toEqual({ ok: true });
  });

  it("maps a Playground outage to 503 (deny completion)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("down");
      })
    );
    expect(await gradeCode(rustBlock, { code: CODE })).toEqual({
      ok: false,
      status: 503,
    });
  });

  it("routes a buildable challenge to the build server, NOT the Playground", async () => {
    // With no build server configured (env unset here), the buildable grader
    // fails closed to 503 — never the Rust Playground, and never a granted
    // completion. (Grading against a live build server is covered in
    // buildable-executor.test.ts.)
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    const buildableBlock: CodeBlockData = {
      ...rustBlock,
      buildType: "buildable",
    };
    expect(await gradeCode(buildableBlock, { code: CODE })).toEqual({
      ok: false,
      status: 503,
    });
    expect(spy).not.toHaveBeenCalled();
  });
});
