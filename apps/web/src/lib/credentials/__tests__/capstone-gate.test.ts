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

describe("capstone identity ↔ the committed bundle", () => {
  // CAPSTONE_CREDENTIAL is a code constant naming content, so this holds for
  // whatever content.lock pins and fails only when the two disagree. Today the
  // capstone course (C3) is parked under `_draft/`, so the gate is dormant:
  // neither id is in the bundle and no live course is gated. If C3 comes back,
  // it has to come back whole — its deploy lesson in the course and hosting
  // the panel — or the gate would deny every capstone credential (see the
  // dormancy note in capstone-identity.ts).
  const courseOfLesson = new Map<string, string>();
  for (const course of coursesJson) {
    for (const mod of course.modules ?? []) {
      for (const ref of mod.lessons ?? []) {
        if (ref._ref) courseOfLesson.set(ref._ref, course._id);
      }
    }
  }
  const hostsDeployPanel = (lessonId: string) =>
    lessonsJson
      .find((l) => l._id === lessonId)
      ?.blocks?.some((b) => b._type === "deployed-program-card") ?? false;
  const capstoneShipped = coursesJson.some(
    (c) => c._id === CAPSTONE_CREDENTIAL.courseId
  );

  it("ships the capstone course and its deploy lesson together, or neither", () => {
    const deployLessonCourse = courseOfLesson.get(
      CAPSTONE_CREDENTIAL.deployLessonId
    );
    if (capstoneShipped) {
      expect(deployLessonCourse).toBe(CAPSTONE_CREDENTIAL.courseId);
      expect(hostsDeployPanel(CAPSTONE_CREDENTIAL.deployLessonId)).toBe(true);
    } else {
      expect(deployLessonCourse).toBeUndefined();
    }
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
