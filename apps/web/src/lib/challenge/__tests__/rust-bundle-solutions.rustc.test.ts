/**
 * Runs every standard Rust block in the shipped bundle through the grader's own
 * harness, with a local rustc in place of the Playground: the reference solution
 * has to pass every vector and the starter must not pass. A bad vector or a
 * reverted bundle fails here, before it reaches learners (#1290).
 *
 * CI logs are public and the bundle holds the answer keys, so assertions only
 * name lessons, test ids and a coarse cause. Never assert on a raw result: its
 * `detail` quotes expected values and compiler output.
 */
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import type { AdminTestCase } from "@superteam-lms/types";
import { lessonsById } from "@/lib/content/store";
import type { SubmissionRunResult } from "../executor";
import { runRustSubmission } from "../rust-executor";
import {
  describeWithRustc,
  RUSTC_VERSION,
  stubPlaygroundWithLocalRustc,
} from "./fixtures/local-rustc";

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

// The same split gradeCode routes on: buildable blocks go to the build server.
const cases = [...lessonsById.values()].flatMap((lesson) =>
  ((lesson.blocks ?? []) as RawBlock[])
    .filter(
      (b) =>
        b._type === "code" &&
        b.language === "rust" &&
        b.buildType !== "buildable"
    )
    .map((block) => ({ id: `${lesson._id}/${block._key}`, block }))
);

const cause = (detail: string | undefined): string => {
  if (detail === "No result produced") return "panicked";
  return /^(expected |got )/.test(detail ?? "")
    ? "wrong result"
    : "did not compile";
};

/** The verdict with `detail` reduced to a cause, safe to show in a CI log. */
const verdict = (r: SubmissionRunResult) =>
  r.available
    ? {
        available: true,
        passed: r.passed,
        failed: r.results
          .filter((t) => !t.passed)
          .map((t) => `${t.id}: ${cause(t.detail)}`),
      }
    : { available: false };

afterEach(() => {
  vi.unstubAllGlobals();
});

describeWithRustc("standard Rust blocks in the shipped bundle", () => {
  beforeAll(() => {
    const vectors = cases.reduce((n, c) => n + (c.block.tests?.length ?? 0), 0);
    console.info(
      `Grading ${cases.length} blocks, ${vectors} vectors, with ${RUSTC_VERSION}`
    );
  });

  it("finds blocks to grade", () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it.each(cases)(
    "$id: the solution passes every vector",
    async ({ block }) => {
      stubPlaygroundWithLocalRustc();
      const r = await runRustSubmission(
        block.solution ?? "",
        block.tests ?? []
      );
      expect(verdict(r)).toEqual({ available: true, passed: true, failed: [] });
    },
    60_000
  );

  it.each(cases)(
    "$id: the starter doesn't pass",
    async ({ block }) => {
      stubPlaygroundWithLocalRustc();
      const r = await runRustSubmission(block.starter ?? "", block.tests ?? []);
      expect(verdict(r)).toMatchObject({ available: true, passed: false });
    },
    60_000
  );
});
