import { describe, it, expect } from "vitest";
import { stringify } from "yaml";
import { isExcludedContentPath } from "@superteam-lms/content-schema";
import type { RepoTree } from "@/lib/github/types";
import { compileContent } from "../compile-bundle";

/**
 * #973 — `_draft/` is the parking convention academy-courses uses to take a
 * course out of the catalog without deleting it. The compiler classified by
 * unanchored `endsWith("/course.yaml")` / `startsWith("paths/")`, so a parked
 * doc compiled straight into the shipped bundle while content-lint's anchored
 * fixed-depth regexes never saw it — parked content shipped, unlinted.
 *
 * These assert the property directly on the compiled bundle: a `_draft/`
 * segment anywhere in the path means the doc is not in the output.
 */

const enc = new TextEncoder();
const yaml = (v: unknown): Uint8Array => enc.encode(stringify(v));
const raw = (s: string): Uint8Array => enc.encode(s);

const SHA = "c".repeat(40);

function course(id: string, slug: string, lessonId: string): unknown {
  return {
    id,
    slug,
    title: slug,
    description: "d",
    difficulty: "beginner",
    duration: 1,
    xpPerLesson: 10,
    xpReward: 100,
    modules: [{ key: "m", title: "M", lessons: [lessonId] }],
  };
}

function lesson(id: string, slug: string): unknown {
  return {
    id,
    slug,
    title: slug,
    skills: ["pdas"],
    blocks: [{ key: "intro", type: "prose", src: "intro.md" }],
  };
}

function slotsLock(lessonId: string): Uint8Array {
  return raw(
    JSON.stringify({
      version: 1,
      slots: { [lessonId]: 0 },
      retired: [],
      next: 1,
    })
  );
}

/** A live course + path + achievement, each shadowed by a parked `_draft/` twin. */
function treeWithDrafts(): RepoTree {
  return new Map<string, Uint8Array>([
    ["skills.yaml", raw("- slug: pdas\n  label: PDAs\n")],

    // live
    [
      "courses/live/course.yaml",
      yaml(course("course-live", "live", "lesson-live")),
    ],
    ["courses/live/slots.lock.json", slotsLock("lesson-live")],
    [
      "courses/live/lessons/live/lesson.yaml",
      yaml(lesson("lesson-live", "live")),
    ],
    ["courses/live/lessons/live/intro.md", raw("# Live\n")],
    [
      "paths/live.yaml",
      yaml({
        id: "path-live",
        slug: "live",
        title: "Live",
        difficulty: "beginner",
        courses: ["course-live"],
      }),
    ],
    [
      "achievements/live.yaml",
      yaml({
        id: "achievement-live",
        name: "Live",
        category: "progress",
        xpReward: 50,
        award: { kind: "manual" },
      }),
    ],

    // parked under _draft/ — must never reach the bundle
    [
      "courses/_draft/parked/course.yaml",
      yaml(course("course-parked", "parked", "lesson-parked")),
    ],
    ["courses/_draft/parked/slots.lock.json", slotsLock("lesson-parked")],
    [
      "courses/_draft/parked/lessons/parked/lesson.yaml",
      yaml(lesson("lesson-parked", "parked")),
    ],
    ["courses/_draft/parked/lessons/parked/intro.md", raw("# Parked\n")],
    [
      "paths/_draft/parked.yaml",
      yaml({
        id: "path-parked",
        slug: "parked",
        title: "Parked",
        difficulty: "beginner",
        courses: ["course-parked"],
      }),
    ],
    [
      "achievements/_draft/parked.yaml",
      yaml({
        id: "achievement-parked",
        name: "Parked",
        category: "progress",
        xpReward: 50,
        award: { kind: "manual" },
      }),
    ],
  ]);
}

const ids = (json: string): string[] =>
  (JSON.parse(json) as { _id: string }[]).map((d) => d._id);

describe("compileBundle — _draft/ exclusion (#973)", () => {
  it("compiles the live docs and drops every _draft/ doc", () => {
    const files = compileContent(treeWithDrafts(), {
      sha: SHA,
      compiledAt: null,
    });

    expect(ids(files.get("courses.json")!)).toEqual(["course-live"]);
    expect(ids(files.get("lessons.json")!)).toEqual(["lesson-live"]);
    expect(ids(files.get("paths.json")!)).toEqual(["path-live"]);
    expect(ids(files.get("achievements.json")!)).toEqual(["achievement-live"]);
  });

  it("keeps the parked course out of slots.json and the meta counts", () => {
    const files = compileContent(treeWithDrafts(), {
      sha: SHA,
      compiledAt: null,
    });

    expect(Object.keys(JSON.parse(files.get("slots.json")!))).toEqual([
      "course-live",
    ]);
    expect(JSON.parse(files.get("meta.json")!).counts).toMatchObject({
      courses: 1,
      lessons: 1,
      learningPaths: 1,
      achievements: 1,
    });
  });
});

describe("the compiler's exclusion rule is the shared one", () => {
  it("uses `isExcludedContentPath`, so lint and compile cannot diverge again", () => {
    // The predicate itself is unit-tested in content-schema (repo-paths.test.ts);
    // this pins the compile side to it rather than to a local copy.
    expect(isExcludedContentPath("courses/_draft/x/course.yaml")).toBe(true);
    expect(isExcludedContentPath("courses/_template/course.yaml")).toBe(true);
    expect(isExcludedContentPath("courses/live/course.yaml")).toBe(false);
  });
});
