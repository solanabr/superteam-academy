import { describe, it, expect } from "vitest";
import { isDraftPath, isExcludedContentPath } from "../repo-paths";

/**
 * #973 — one rule, two consumers: the bundle compiler (apps/web) and
 * content-lint. The near-miss cases below are the whole point: a typo'd
 * `_drafts/` must NOT be silently parked, it must stay visible so content-lint's
 * unclassified-file diagnostic can flag it.
 */

const PARKED = [
  "courses/_draft/x/course.yaml",
  "courses/_draft/x/lessons/y/lesson.yaml",
  "paths/_draft/p.yaml",
  "achievements/_draft/a.yaml",
  "quests/_draft/q.yaml",
  "courses/live/_draft/old/lesson.yaml",
  "_draft/anything.yaml",
];

const NEAR_MISSES = [
  "courses/_drafts/x/course.yaml",
  "courses/_draft-old/x/course.yaml",
  "courses/live/_draft.md",
  "courses/live/lessons/x/my_draft/notes.md",
  "courses/live/lessons/draft/lesson.yaml",
];

describe("isDraftPath", () => {
  it("matches a `_draft` directory segment at any depth", () => {
    for (const p of PARKED) expect(isDraftPath(p), p).toBe(true);
  });

  it("matches a directory and only a directory", () => {
    for (const p of NEAR_MISSES) expect(isDraftPath(p), p).toBe(false);
  });

  it("does not match live content or the scaffold", () => {
    for (const p of [
      "courses/live/course.yaml",
      "paths/live.yaml",
      "skills.yaml",
      "courses/_template/course.yaml",
    ]) {
      expect(isDraftPath(p), p).toBe(false);
    }
  });
});

describe("isExcludedContentPath", () => {
  it("excludes parked content and the `courses/_template/` scaffold", () => {
    for (const p of [
      ...PARKED,
      "courses/_template/course.yaml",
      "courses/_template/lessons/x/lesson.yaml",
    ]) {
      expect(isExcludedContentPath(p), p).toBe(true);
    }
  });

  it("keeps live content and every near-miss visible", () => {
    for (const p of [
      ...NEAR_MISSES,
      "courses/live/course.yaml",
      "paths/live.yaml",
      "achievements/a.yaml",
      "skills.yaml",
    ]) {
      expect(isExcludedContentPath(p), p).toBe(false);
    }
  });
});
