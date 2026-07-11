import type { RawBundle } from "../../types";

/**
 * A tiny, hand-written bundle in the same RAW Sanity shape the real
 * `content/generated/*.json` files carry. Kept deliberately small and stable so
 * `buildStore` tests never churn when the real content is recompiled.
 */
export const fixtureBundle: RawBundle = {
  courses: [
    {
      _id: "course-alpha",
      _type: "course",
      slug: { _type: "slug", current: "alpha" },
      title: "Alpha Course",
    },
    {
      _id: "course-beta",
      _type: "course",
      slug: { _type: "slug", current: "beta" },
      title: "Beta Course",
    },
  ],
  lessons: [
    {
      _id: "lesson-intro",
      _type: "lesson",
      slug: { _type: "slug", current: "intro" },
      title: "Intro Lesson",
    },
    {
      _id: "lesson-deep-dive",
      _type: "lesson",
      slug: { _type: "slug", current: "deep-dive" },
      title: "Deep Dive",
    },
  ],
  instructors: [{ _id: "instructor-ada", _type: "instructor", name: "Ada" }],
  achievements: [
    { _id: "achievement-first", _type: "achievement", name: "First Steps" },
  ],
  quests: [{ _id: "quest-daily", _type: "quest", name: "Daily Quest" }],
  paths: [{ _id: "path-core", _type: "learningPath", title: "Core Path" }],
  slots: {
    "course-alpha": {
      version: 1,
      slots: { "lesson-intro": 0, "lesson-deep-dive": 1 },
      retired: [],
      next: 2,
    },
  },
};
