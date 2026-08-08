/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CAPSTONE_CREDENTIAL,
  isCapstoneCourse,
  checkCapstoneCredentialGate,
} from "../capstone-gate";

// Read the committed bundle from disk rather than importing it: the generated
// JSON is a restricted import (it carries quiz answers / solutions / hidden
// tests) and must only be loaded via the server-only content store. Reading the
// file here keeps this constant-vs-bundle assertion without pulling secrets
// into a module graph.
const GENERATED = join(process.cwd(), "src/content/generated");
const coursesJson = JSON.parse(
  readFileSync(join(GENERATED, "courses.json"), "utf8")
) as Array<{
  _id: string;
  modules?: Array<{ lessons?: Array<{ _ref?: string }> }>;
}>;
const lessonsJson = JSON.parse(
  readFileSync(join(GENERATED, "lessons.json"), "utf8")
) as Array<{ _id: string; blocks?: Array<{ _type?: string }> }>;

// A `deployed_programs` query mock: chain `.select().eq().eq().eq().limit()`
// then resolve `.maybeSingle()` with the given row/error. Records the eq()
// filters so the test can assert the gate scopes to the capstone constants.
function adminClientWith(result: {
  data?: { id: string } | null;
  error?: { message: string } | null;
}) {
  const eqCalls: Array<[string, unknown]> = [];
  const chain = {
    select: () => chain,
    eq: (col: string, val: unknown) => {
      eqCalls.push([col, val]);
      return chain;
    },
    limit: () => chain,
    maybeSingle: async () => ({
      data: result.data ?? null,
      error: result.error ?? null,
    }),
  };
  const from = vi.fn(() => chain);
  return {
    client: { from } as never,
    from,
    eqCalls,
  };
}

describe("capstone-gate — dormant while the capstone course is parked", () => {
  // The capstone system is DORMANT for the public alpha: C3 is parked under
  // `_draft/` in academy-courses, so neither constant resolves against the
  // bundle (see the dormancy note in capstone-identity.ts). What must hold is
  // that dormancy is total and fails closed — the alpha catalog must contain
  // NO gated course and NO deploy panel, so nothing is half-gated. When
  // track-1 restores, these flip back into the constants-match-the-bundle
  // assertions this block replaced (course present, deploy lesson present and
  // hosting the panel, lesson belongs to the course, exactly one panel).
  const bundleCourseIds = coursesJson.map((c) => c._id);
  const deployPanelLessons = lessonsJson.filter((l) =>
    (l.blocks ?? []).some((b) => b._type === "deployed-program-card")
  );

  it("the capstone course is absent from the bundle (dormant)", () => {
    expect(bundleCourseIds).not.toContain(CAPSTONE_CREDENTIAL.courseId);
  });

  it("the capstone deploy lesson is absent from the bundle (dormant)", () => {
    const lesson = lessonsJson.find(
      (l) => l._id === CAPSTONE_CREDENTIAL.deployLessonId
    );
    expect(lesson).toBeUndefined();
  });

  it("no live course is subject to the deploy gate", () => {
    for (const id of bundleCourseIds) {
      expect(isCapstoneCourse(id), `"${id}" must not be gated`).toBe(false);
    }
  });

  it("no live lesson hosts a deploy panel", () => {
    expect(deployPanelLessons.map((l) => l._id)).toEqual([]);
  });
});

describe("isCapstoneCourse", () => {
  it("is true only for the capstone course", () => {
    expect(isCapstoneCourse(CAPSTONE_CREDENTIAL.courseId)).toBe(true);
    expect(isCapstoneCourse("course-solana-fundamentals")).toBe(false);
    expect(isCapstoneCourse("")).toBe(false);
  });
});

describe("checkCapstoneCredentialGate", () => {
  it("returns not_capstone for a non-capstone course without touching the DB", async () => {
    const { client, from } = adminClientWith({ data: null });
    const result = await checkCapstoneCredentialGate(
      client,
      "user-1",
      "course-solana-fundamentals"
    );
    expect(result).toEqual({ status: "not_capstone" });
    expect(from).not.toHaveBeenCalled();
  });

  it("returns allowed when a verified deploy row exists, scoped to the capstone lesson", async () => {
    const { client, eqCalls } = adminClientWith({ data: { id: "dp-1" } });
    const result = await checkCapstoneCredentialGate(
      client,
      "user-1",
      CAPSTONE_CREDENTIAL.courseId
    );
    expect(result).toEqual({ status: "allowed" });
    // The query is scoped to this user + the capstone course + deploy lesson.
    expect(eqCalls).toEqual([
      ["user_id", "user-1"],
      ["course_id", CAPSTONE_CREDENTIAL.courseId],
      ["lesson_id", CAPSTONE_CREDENTIAL.deployLessonId],
    ]);
  });

  it("returns deploy_required when no deploy row exists", async () => {
    const { client } = adminClientWith({ data: null });
    const result = await checkCapstoneCredentialGate(
      client,
      "user-1",
      CAPSTONE_CREDENTIAL.courseId
    );
    expect(result).toEqual({ status: "deploy_required" });
  });

  it("fails closed (indeterminate) on a read error — never allowed", async () => {
    const { client } = adminClientWith({
      data: null,
      error: { message: "db down" },
    });
    const result = await checkCapstoneCredentialGate(
      client,
      "user-1",
      CAPSTONE_CREDENTIAL.courseId
    );
    expect(result).toEqual({ status: "indeterminate" });
  });
});
