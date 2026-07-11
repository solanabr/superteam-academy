import "server-only";

import type { SlotsLockT } from "@superteam-lms/content-schema";
import { buildStore } from "./build-store";
import type {
  AchievementDoc,
  CourseDoc,
  InstructorDoc,
  LearningPathDoc,
  LessonDoc,
  QuestDoc,
} from "./types";
import achievementsJson from "@/content/generated/achievements.json";
import coursesJson from "@/content/generated/courses.json";
import instructorsJson from "@/content/generated/instructors.json";
import lessonsJson from "@/content/generated/lessons.json";
import pathsJson from "@/content/generated/paths.json";
import questsJson from "@/content/generated/quests.json";
import slotsJson from "@/content/generated/slots.json";

/**
 * SECURITY: this module value-imports the generated content bundle, which
 * contains quiz answers, code solutions and hidden tests. The `server-only`
 * marker above makes any client-component value import of this file a build
 * error, keeping those secrets off the browser. Do NOT remove it, and do NOT
 * add a client entrypoint that re-exports these maps.
 *
 * The bundle is a committed set of deterministic JSON files (see
 * `scripts/compile-content.ts`); static `import` lets the Next.js bundler trace
 * and inline them, which is safe on Vercel serverless/edge where a runtime
 * `fs.readFile` of a repo path is not guaranteed to be traced.
 *
 * `resolveJsonModule` types each import structurally from the JSON literal
 * (e.g. `_type: string`, not the `"course"` literal our raw-doc types pin), so
 * the shapes are looser than {@link CourseDoc} et al. Each import therefore
 * takes exactly one boundary assertion here — the bundle is validated and
 * projected upstream by the compiler, so the shape is known-good at this seam.
 */
const store = buildStore({
  courses: coursesJson as unknown as CourseDoc[],
  lessons: lessonsJson as unknown as LessonDoc[],
  instructors: instructorsJson as unknown as InstructorDoc[],
  achievements: achievementsJson as unknown as AchievementDoc[],
  quests: questsJson as unknown as QuestDoc[],
  paths: pathsJson as unknown as LearningPathDoc[],
  slots: slotsJson as unknown as Record<string, SlotsLockT>,
});

export const {
  coursesById,
  coursesBySlug,
  lessonsById,
  lessonsBySlug,
  instructorsById,
  achievementsById,
  questsById,
  pathsById,
  slotsByCourseId,
} = store;
