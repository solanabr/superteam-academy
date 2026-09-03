import "server-only";

import type { SlotsLockT } from "@superteam-lms/content-schema";
import achievementsJson from "@/content/generated/achievements.json";
import coursesJson from "@/content/generated/courses.json";
import l10nJson from "@/content/generated/l10n.json";
import lessonsJson from "@/content/generated/lessons.json";
import pathsJson from "@/content/generated/paths.json";
import questsJson from "@/content/generated/quests.json";
import skillsJson from "@/content/generated/skills.json";
import slotsJson from "@/content/generated/slots.json";
import type {
  AchievementDoc,
  CourseDoc,
  L10nBundle,
  LearningPathDoc,
  LessonDoc,
  QuestDoc,
} from "./types";
import { buildStore } from "./build-store";

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
  achievements: achievementsJson as unknown as AchievementDoc[],
  quests: questsJson as unknown as QuestDoc[],
  paths: pathsJson as unknown as LearningPathDoc[],
  slots: slotsJson as unknown as Record<string, SlotsLockT>,
  // `{}` typed as the sparse overlay map: `resolveJsonModule` infers an empty
  // literal as `{}`, which has no index signature, so this seam takes the
  // same one boundary assertion as the others.
  l10n: l10nJson as unknown as L10nBundle,
});

export const {
  coursesById,
  coursesBySlug,
  lessonsById,
  lessonsBySlug,
  achievementsById,
  questsById,
  pathsById,
  slotsByCourseId,
  l10nByCourseId,
} = store;

/**
 * Display labels from the skills.json vocabulary (#952). The boundary
 * assertion mirrors the others above, but against the SCHEMA's shape, not
 * today's JSON literal: `label` is optional in the content-schema
 * (skills.ts), and a bundle without skills.yaml compiles to `[]` — typing
 * off the literal made both valid content states a TS build break here.
 * Entries without a label simply don't map; consumers fall back to the slug.
 */
export const skillLabelBySlug: ReadonlyMap<string, string> = new Map(
  (skillsJson as { slug: string; label?: string }[]).flatMap((skill) =>
    skill.label ? [[skill.slug, skill.label] as const] : []
  )
);
