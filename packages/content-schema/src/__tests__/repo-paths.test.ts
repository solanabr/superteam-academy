import { describe, it, expect } from "vitest";
import {
  isCompilerContentDoc,
  isDraftPath,
  isExcludedContentPath,
} from "../repo-paths";

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

describe("isCompilerContentDoc", () => {
  it("is depth-blind, exactly like the compiler's unanchored chain", () => {
    for (const p of [
      "courses/live/course.yaml",
      "courses/a/b/c/course.yaml",
      "courses/live/lessons/x/lesson.yaml",
      "courses/live/modules/m1/lessons/x/lesson.yaml",
      "paths/p.yaml",
      "paths/archive/old.yaml",
      "achievements/a.yaml",
      "achievements/season1/a.yaml",
      "quests/q.yaml",
      "quests/nested/q.yaml",
    ]) {
      expect(isCompilerContentDoc(p), p).toBe(true);
    }
  });

  it("does not claim prose, code, assets, or non-collection yaml", () => {
    for (const p of [
      "skills.yaml",
      "courses/live/README.md",
      "courses/live/lessons/x/intro.md",
      "courses/live/lessons/x/exercise/solution.ts",
      "courses/live/lessons/x/assets/pixel.png",
      "courses/live/lessons/x/notes.yaml",
      "courses/live/meta.yaml",
      "docs/notes.yaml",
      // The quiz shorthand is a lint-only doc kind; the compiler reads quizzes
      // out of the lesson's blocks, not as standalone files.
      "courses/live/lessons/x/check.quiz.yaml",
    ]) {
      expect(isCompilerContentDoc(p), p).toBe(false);
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
