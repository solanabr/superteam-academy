import type { SlotsLockT } from "@superteam-lms/content-schema";
import type { SanityDoc } from "@/lib/content-sync/types";

/**
 * The committed content bundle (`src/content/generated/*.json`) holds RAW
 * Sanity-shaped documents — the exact shapes the content sync writes: `_ref`
 * references left unresolved, `{ _type: "slug", current }` slug objects, prose
 * inlined — minus the sync/onChainStatus/authoringStatus overlays. These are
 * NOT the GROQ-projected `@superteam-lms/types` shapes (`Course`, `Lesson`, …
 * with references resolved and slugs flattened to strings); re-deriving those
 * is SP2-B scope. So the store types below extend {@link SanityDoc} (the same
 * interface the projector emits) and pin only the discriminant plus the field
 * each lookup map keys on. Every other field stays `unknown` via the base
 * index signature — honest about the raw shape, no invented parallel duplicate.
 */

/** Raw Sanity slug object as it appears on course/lesson bundle docs. */
export interface RawSlug {
  _type: "slug";
  current: string;
}

export interface CourseDoc extends SanityDoc {
  _type: "course";
  slug: RawSlug;
}

export interface LessonDoc extends SanityDoc {
  _type: "lesson";
  slug: RawSlug;
}

export interface InstructorDoc extends SanityDoc {
  _type: "instructor";
}

export interface AchievementDoc extends SanityDoc {
  _type: "achievement";
}

export interface QuestDoc extends SanityDoc {
  _type: "quest";
}

export interface LearningPathDoc extends SanityDoc {
  _type: "learningPath";
}

/** The parsed bundle handed to {@link buildStore}: one array per doc type plus
 *  the per-course slot lockfiles (`slots.json`, keyed by course id). */
export interface RawBundle {
  courses: CourseDoc[];
  lessons: LessonDoc[];
  instructors: InstructorDoc[];
  achievements: AchievementDoc[];
  quests: QuestDoc[];
  paths: LearningPathDoc[];
  slots: Record<string, SlotsLockT>;
}

/** Typed, read-only lookup maps over the bundle. Maps are exposed as
 *  {@link ReadonlyMap} so consumers cannot mutate the module-scoped index. */
export interface ContentStore {
  coursesById: ReadonlyMap<string, CourseDoc>;
  coursesBySlug: ReadonlyMap<string, CourseDoc>;
  lessonsById: ReadonlyMap<string, LessonDoc>;
  lessonsBySlug: ReadonlyMap<string, LessonDoc>;
  instructorsById: ReadonlyMap<string, InstructorDoc>;
  achievementsById: ReadonlyMap<string, AchievementDoc>;
  questsById: ReadonlyMap<string, QuestDoc>;
  pathsById: ReadonlyMap<string, LearningPathDoc>;
  slotsByCourseId: ReadonlyMap<string, SlotsLockT>;
}
