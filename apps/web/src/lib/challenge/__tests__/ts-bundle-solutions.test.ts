/**
 * Grades every TypeScript block in the shipped bundle through gradeCode, the
 * path /api/lessons/complete takes: the reference solution has to pass every
 * test and the starter must not. A bad content release or an executor change
 * that breaks a live challenge fails here, before it reaches learners.
 *
 * CI logs are public and the bundle holds the answer keys, so assertions only
 * name lessons, test ids and a coarse cause. Never assert on a raw result: a
 * failed test's `detail` can quote submitted code, results and expected values.
 */
import { describe, expect, it, vi } from "vitest";
import type { AdminTestCase, CodeBlockData } from "@superteam-lms/types";
import { lessonsById } from "@/lib/content/store";
import { gradeCode } from "@/lib/grading/graders/code";
import type { GradeResult } from "@/lib/grading/types";

interface RawBlock {
  _type: string;
  _key?: string;
  language?: string;
  buildType?: string | null;
  starter?: string;
  solution?: string;
  tests?: AdminTestCase[];
}

vi.mock("server-only", () => ({}));

// The same split gradeCode routes on: anything not Rust or buildable has to be
// graded by the JS/TS executor or the grader answers 503.
const cases = [...lessonsById.values()].flatMap((lesson) =>
  ((lesson.blocks ?? []) as RawBlock[])
    .filter(
      (b) =>
        b._type === "code" &&
        b.language !== "rust" &&
        b.buildType !== "buildable"
    )
    .map((block) => ({ id: `${lesson._id}/${block._key}`, block }))
);

const cause = (detail: string): string => {
  if (detail === "fail: assertion false") return "assertion false";
  if (detail === "fail: shape mismatch") return "wrong shape";
  if (detail === "No function found in submission") return "no entry point";
  if (/timed out|interrupted/i.test(detail)) return "timed out";
  if (/syntax/i.test(detail)) return "syntax error";
  if (/is not defined/.test(detail)) return "undefined name";
  if (/is not a function/.test(detail)) return "not callable";
  return "wrong result or threw";
};

/** The verdict with `detail` reduced to a cause, safe to show in a CI log. */
const verdict = (r: GradeResult) =>
  r.ok
    ? { ok: true }
    : {
        ok: false,
        status: r.status,
        failed: (r.failedTests ?? []).map((t) => `${t.id}: ${cause(t.detail)}`),
      };

const grade = (block: RawBlock, code: string, tests = block.tests) =>
  gradeCode({ ...block, tests } as unknown as CodeBlockData, { code });

describe("TypeScript blocks in the shipped bundle", () => {
  it("finds blocks to grade", () => {
    console.info(
      `Grading ${cases.length} blocks, ${cases.reduce((n, c) => n + (c.block.tests?.length ?? 0), 0)} tests`
    );
    expect(cases.length).toBeGreaterThan(0);
  });

  it.each(cases)(
    "$id: the solution passes every test",
    async ({ block }) => {
      const r = await grade(block, block.solution ?? "");
      expect(verdict(r)).toEqual({ ok: true });
    },
    30_000
  );

  it.each(cases)(
    "$id: the starter doesn't pass",
    async ({ block }) => {
      const r = await grade(block, block.starter ?? "");
      expect(verdict(r)).toMatchObject({ ok: false, status: 403 });
    },
    30_000
  );

  // Keeps the suite honest: a test nothing can satisfy has to fail the solution.
  it("rejects a solution held to an impossible test", async () => {
    const { block } = cases[0]!;
    const impossible: AdminTestCase = {
      id: "impossible",
      description: "cannot be met",
      input: block.tests?.[0]?.input ?? "",
      expectedOutput: "false",
    };
    const r = await grade(block, block.solution ?? "", [
      ...(block.tests ?? []),
      impossible,
    ]);
    expect(verdict(r)).toEqual({
      ok: false,
      status: 403,
      failed: ["impossible: assertion false"],
    });
  }, 30_000);
});
