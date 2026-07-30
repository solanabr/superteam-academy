/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the capstone-gate import so its module graph loads under vitest. */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  CAPSTONE_CREDENTIAL,
  CAPSTONE_AI_OFF_CODE,
  isCapstoneCourse,
  isCapstoneLesson,
} from "../capstone-identity";
import * as gate from "../capstone-gate";

// The shared-constant clause (#867 / unified spec items 14 + 33): the credential
// gate and the AI hard-off must key off ONE definition of the capstone identity.
// These tests are what breaks when someone forks it.

describe("capstone identity — single definition site", () => {
  it("capstone-gate re-exports the identity module's object, not a copy", () => {
    // Reference equality, not deep equality: a second literal with the same
    // values would pass `toEqual` and defeat the whole point.
    expect(gate.CAPSTONE_CREDENTIAL).toBe(CAPSTONE_CREDENTIAL);
    expect(gate.isCapstoneCourse).toBe(isCapstoneCourse);
    expect(gate.isCapstoneLesson).toBe(isCapstoneLesson);
  });

  it("no other source file hardcodes the capstone ids", () => {
    // Walk the app source and fail on any literal occurrence of either id
    // outside this module. Tests and the generated content bundle are the two
    // legitimate exceptions: tests assert against the ids by construction, and
    // the bundle is where the ids actually come from.
    const SRC = join(process.cwd(), "src");
    const IDS = [
      CAPSTONE_CREDENTIAL.courseId,
      CAPSTONE_CREDENTIAL.deployLessonId,
    ];
    const ALLOWED = new Set([
      join("lib", "credentials", "capstone-identity.ts"),
      // Not a fork: the personalization entry-course table (#599/#673) names
      // C3 as segment 2's entry rung. It happens to be the same course, but it
      // is answering "where does this learner start?", not "is this the graded
      // capstone?" — coupling it to CAPSTONE_CREDENTIAL would be the real bug.
      join("lib", "courses", "learner-segment.ts"),
    ]);

    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          if (entry === "__tests__" || entry === "generated") continue;
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry)) continue;
        const rel = relative(SRC, full);
        if (ALLOWED.has(rel)) continue;
        const source = readFileSync(full, "utf8");
        if (IDS.some((id) => source.includes(id))) offenders.push(rel);
      }
    };
    walk(SRC);

    expect(
      offenders,
      `the capstone ids must be defined once, in ${[...ALLOWED].join(
        ", "
      )} — found literals in: ${offenders.join(", ")}`
    ).toEqual([]);
  });
});

describe("capstone identity — predicates", () => {
  it("isCapstoneLesson matches the credential gate's deploy lesson only", () => {
    expect(isCapstoneLesson(CAPSTONE_CREDENTIAL.deployLessonId)).toBe(true);
    expect(isCapstoneLesson("lesson-something-else")).toBe(false);
    // The course id is not a lesson id — the two must not be interchangeable.
    expect(isCapstoneLesson(CAPSTONE_CREDENTIAL.courseId)).toBe(false);
  });

  it("isCapstoneCourse matches the gated course only", () => {
    expect(isCapstoneCourse(CAPSTONE_CREDENTIAL.courseId)).toBe(true);
    expect(isCapstoneCourse("course-other")).toBe(false);
  });

  it("exposes a stable typed refusal code for the AI routes", () => {
    expect(CAPSTONE_AI_OFF_CODE).toBe("capstone_ai_off");
  });
});
