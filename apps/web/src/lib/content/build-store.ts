import type { SlotsLockT } from "@superteam-lms/content-schema";
import type {
  ContentStore,
  RawBundle,
  CourseDoc,
  LessonDoc,
  InstructorDoc,
  AchievementDoc,
  QuestDoc,
  LearningPathDoc,
} from "./types";

/** A doc with a raw Sanity slug — course or lesson. */
type SluggedDoc = CourseDoc | LessonDoc;

/**
 * Freeze a map into a read-only view. `Object.freeze` alone is a no-op for a
 * Map (its entries live in internal slots, not own properties), so the mutators
 * are replaced with throwing stubs. The store is a shared module-scoped
 * singleton reused across requests on a warm serverless instance — a stray
 * `.set` from a mis-typed consumer must fail loudly, not corrupt every request.
 */
function readonly<T>(entries: Iterable<[string, T]>): ReadonlyMap<string, T> {
  const m = new Map<string, T>(entries);
  const block = (): never => {
    throw new Error("content store is read-only");
  };
  return Object.assign(m, { set: block, delete: block, clear: block });
}

const idEntries = <T extends { _id: string }>(
  docs: readonly T[]
): Iterable<[string, T]> => docs.map((doc) => [doc._id, doc] as [string, T]);

const slugEntries = <T extends SluggedDoc>(
  docs: readonly T[]
): Iterable<[string, T]> =>
  docs.map((doc) => [doc.slug.current, doc] as [string, T]);

/**
 * Pure bundle → indexed store. Kept free of `server-only` and of the real
 * generated JSON so it can be unit-tested against a fixture. {@link store} is the
 * only caller that feeds it the committed bundle.
 */
export function buildStore(raw: RawBundle): ContentStore {
  return {
    coursesById: readonly(idEntries<CourseDoc>(raw.courses)),
    coursesBySlug: readonly(slugEntries<CourseDoc>(raw.courses)),
    lessonsById: readonly(idEntries<LessonDoc>(raw.lessons)),
    lessonsBySlug: readonly(slugEntries<LessonDoc>(raw.lessons)),
    instructorsById: readonly(idEntries<InstructorDoc>(raw.instructors)),
    achievementsById: readonly(idEntries<AchievementDoc>(raw.achievements)),
    questsById: readonly(idEntries<QuestDoc>(raw.quests)),
    pathsById: readonly(idEntries<LearningPathDoc>(raw.paths)),
    slotsByCourseId: readonly<SlotsLockT>(Object.entries(raw.slots)),
  };
}
