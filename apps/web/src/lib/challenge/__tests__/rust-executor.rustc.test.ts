/**
 * A Rust vector's `expectedOutput` is pasted into the generated program as a
 * Rust expression (`let __expected__ = <expectedOutput>;`), so a `String`
 * result has to be written as a string literal. The mocked Playground in
 * rust-executor.test.ts can't tell a vector that parses from one that doesn't;
 * only rustc can. This runs the real harness and the real nonce-guarded parser
 * against a local rustc in place of the Playground.
 *
 * Regression for #1290: `rust-ts-fundamentals` m04-l1 shipped
 * `expectedOutput: "max=930,over=1"`, which rustc rejects, so the reference
 * solution failed every test.
 *
 * Skipped when rustc isn't on PATH.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminTestCase } from "@superteam-lms/types";

vi.mock("server-only", () => ({}));
import { runRustSubmission } from "../rust-executor";

const HAS_RUSTC =
  spawnSync("rustc", ["--version"], { stdio: "ignore" }).status === 0;

/** Compile and run what the grader would have sent to the Playground. */
function stubPlaygroundWithLocalRustc(): void {
  vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
    const { code } = JSON.parse(init.body) as { code: string };
    const dir = mkdtempSync(join(tmpdir(), "rust-executor-"));
    try {
      const src = join(dir, "main.rs");
      const bin = join(dir, "main");
      writeFileSync(src, code);
      const build = spawnSync("rustc", ["--edition", "2021", "-o", bin, src], {
        encoding: "utf8",
      });
      const run =
        build.status === 0
          ? spawnSync(bin, { encoding: "utf8", timeout: 10_000 })
          : null;
      return {
        ok: true,
        json: async () => ({
          success: build.status === 0,
          stdout: run?.stdout ?? "",
          stderr: build.stderr + (run?.stderr ?? ""),
        }),
      } as unknown as Response;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/** m04-l1's reference solution: a `String`-returning entry point. */
const LATENCY_REPORT = `fn latency_report(latencies: Vec<u64>, threshold_ms: u64) -> String {
    fn max_latency(latencies: &[u64]) -> u64 {
        let mut max = 0;
        for &l in latencies {
            if l > max {
                max = l;
            }
        }
        max
    }

    fn count_over(latencies: &[u64], threshold_ms: u64) -> u64 {
        let mut n = 0;
        for &l in latencies {
            if l > threshold_ms {
                n += 1;
            }
        }
        n
    }

    let max = max_latency(&latencies);
    let over = count_over(&latencies, threshold_ms);
    format!("max={},over={}", max, over)
}
`;

const vector = (
  id: string,
  input: string,
  expectedOutput: string
): AdminTestCase => ({ id, description: id, input, expectedOutput });

/** The same five vectors as the lesson, with each result as a string literal. */
const STRING_VECTORS: AdminTestCase[] = [
  vector("t1", "vec![120, 340, 930], 500", '"max=930,over=1"'),
  vector("t2", "vec![100, 200, 300], 250", '"max=300,over=1"'),
  vector("t3", "vec![900, 901, 950], 100", '"max=950,over=3"'),
  vector("t4", "vec![], 500", '"max=0,over=0"'),
  vector("t5", "vec![500, 499], 500", '"max=500,over=0"'),
];

describe.skipIf(!HAS_RUSTC)("runRustSubmission against a real rustc", () => {
  it("passes a String-returning fn when expectedOutput is a string literal", async () => {
    stubPlaygroundWithLocalRustc();
    const r = await runRustSubmission(LATENCY_REPORT, STRING_VECTORS);
    expect(r).toMatchObject({ available: true, passed: true });
    if (r.available) {
      expect(r.results.map((t) => t.detail)).toEqual(
        STRING_VECTORS.map(() => "pass")
      );
    }
  }, 60_000);

  it("fails a wrong String result and reports expected vs got", async () => {
    stubPlaygroundWithLocalRustc();
    const wrong =
      "fn latency_report(latencies: Vec<u64>, threshold_ms: u64) -> String {\n" +
      "    let _ = (latencies, threshold_ms);\n" +
      '    "max=0,over=0".to_string()\n' +
      "}\n";
    const r = await runRustSubmission(wrong, STRING_VECTORS);
    expect(r).toMatchObject({ available: true, passed: false });
    if (r.available) {
      expect(r.results[0]?.passed).toBe(false);
      expect(r.results[0]?.detail).toBe(
        'expected "max=930,over=1", got "max=0,over=0"'
      );
      // t4 is the one the wrong answer happens to get right.
      expect(r.results[3]?.passed).toBe(true);
    }
  }, 60_000);

  // The contract, pinned: the executor does not quote or guess. Bare text is not
  // an expression, so it is a compile failure, not an outage and not a pass.
  it("fails closed when a String vector is bare text instead of a literal", async () => {
    stubPlaygroundWithLocalRustc();
    const bare = STRING_VECTORS.map((t) => ({
      ...t,
      expectedOutput: t.expectedOutput.replace(/^"|"$/g, ""),
    }));
    const r = await runRustSubmission(LATENCY_REPORT, bare);
    expect(r).toMatchObject({ available: true, passed: false });
    if (r.available) {
      expect(r.results.every((t) => !t.passed)).toBe(true);
      expect(r.results[0]?.detail).toMatch(/^error/);
    }
  }, 60_000);

  it("keeps grading numeric, boolean and tuple vectors as expressions", async () => {
    stubPlaygroundWithLocalRustc();
    const code =
      "fn settle(total: u64, fee_bps: u64) -> (u64, u64, bool) {\n" +
      "    let fee = total * fee_bps / 10_000;\n" +
      "    (total - fee, fee, fee > 0)\n" +
      "}\n";
    const r = await runRustSubmission(code, [
      vector("t1", "1000, 100", "(990, 10, true)"),
      vector("t2", "1000, 0", "(1000, 0, false)"),
      {
        ...vector("t3", "1000, 100", "__result__.1 == 10"),
      },
    ]);
    expect(r).toMatchObject({ available: true, passed: true });
  }, 60_000);
});
