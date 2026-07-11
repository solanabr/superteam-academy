import "server-only";

import { Award } from "@superteam-lms/content-schema";
import type { AwardT } from "@superteam-lms/content-schema";
import type {
  AchievementDoc,
  CourseDoc,
  InstructorDoc,
  LessonDoc,
  QuestDoc,
} from "./types";
import type {
  Course,
  Instructor,
  LearningPath,
  Lesson,
  LessonBlock,
  TestCase,
} from "@/lib/sanity/types";
import type {
  CourseSummary,
  DeployedAchievement,
  QuestData,
  RecommendedCourse,
  SanityQuest,
} from "@/lib/sanity/queries";

/**
 * Content projectors (SP2-B Task 4). Pure functions that reshape a RAW bundle
 * doc (Sanity-shaped: `_ref` references unresolved, `{ _type: "slug", current }`
 * slugs, prose inlined) into the GROQ-PROJECTED `@superteam-lms/types` shapes
 * the app already consumes (`Course`, `Lesson`, …).
 *
 * Each projector reproduces the exact projection its pre-flip GROQ query emitted
 * (slug flatten, thumbnail path, instructor deref, `blocks[]` shape, `award{…}`),
 * byte-for-byte — golden tests in `__tests__/project.golden.test.ts` deep-equal
 * these outputs against a live capture of the old GROQ. Two deliberate,
 * documented deltas from GROQ:
 *  - instructor `avatar` is always `null` (spec decision 2 / plan §ambiguity 1:
 *    the bundle carries no avatars and live content has none; wiring real
 *    `profiles.avatar_url` is a follow-up).
 *  - `thumbnail` is `null` unless already a resolved URL string — the bundle
 *    holds no Sanity image assets to resolve (all live thumbnails are null).
 *
 * The raw docs are typed loosely ({@link CourseDoc} et al. extend `SanityDoc`,
 * every non-discriminant field `unknown`). Reads go through the small coercion
 * helpers below, which preserve GROQ's null-for-absent semantics; the final
 * object is asserted to the declared return type — the same (already-unsound)
 * boundary `sanityFetch<Course>` crosses today.
 */

// --- coercion helpers (GROQ null-for-absent semantics) ---

function optString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function optNumber(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

function optBool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

/** A raw weak reference `{ _ref, _type: "reference" }` as it sits in the bundle. */
interface RawRef {
  _ref?: unknown;
}

function refId(v: unknown): string | null {
  if (typeof v === "object" && v !== null && "_ref" in v) {
    const r = (v as RawRef)._ref;
    return typeof r === "string" ? r : null;
  }
  return null;
}

/**
 * Flatten a raw `{ _type: "slug", current }` (or already-flat string) — the
 * `"slug": slug.current` GROQ projection. Returns `null` when absent (GROQ
 * emits null; learning paths carry no slug), so callers whose type pins `string`
 * cast at the site where the data guarantees a slug.
 */
function flatSlug(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "current" in v) {
    const c = (v as { current?: unknown }).current;
    if (typeof c === "string") return c;
  }
  return null;
}

// --- instructor ---

/**
 * `instructor->{ name, "avatar": avatar.asset->url, bio, socialLinks }`.
 * `avatar` is projected null by design (see module header). Returns `null` when
 * the reference does not resolve — matching GROQ `->` on an unresolvable ref.
 */
export function projectInstructor(
  doc: InstructorDoc | undefined
): Instructor | null {
  if (!doc) return null;
  return {
    name: optString(doc.name),
    avatar: null,
    bio: optString(doc.bio),
    socialLinks: (doc.socialLinks ?? null) as Instructor["socialLinks"],
  } as unknown as Instructor;
}

/** `instructor->{ name, "avatar": avatar.asset->url }` — the 2-field recommended shape. */
function projectInstructorMini(
  doc: InstructorDoc | undefined
): RecommendedCourse["instructor"] {
  if (!doc) return null;
  return { name: optString(doc.name) as string, avatar: null };
}

// --- lesson blocks ---

function projectTests(v: unknown): TestCase[] | null {
  if (!Array.isArray(v)) return null;
  return v.map((t) => {
    const o = (t ?? {}) as Record<string, unknown>;
    return {
      id: optString(o.id),
      description: optString(o.description),
      input: optString(o.input),
      expectedOutput: optString(o.expectedOutput),
    };
  }) as unknown as TestCase[];
}

function projectQuestions(v: unknown): unknown {
  if (!Array.isArray(v)) return null;
  return v.map((q) => {
    const o = (q ?? {}) as Record<string, unknown>;
    const options = Array.isArray(o.options)
      ? o.options.map((op) => {
          const oo = (op ?? {}) as Record<string, unknown>;
          return {
            id: optString(oo.id),
            label: optString(oo.label),
            correct: optBool(oo.correct),
            feedback: optString(oo.feedback),
          };
        })
      : null;
    return {
      id: optString(o.id),
      prompt: optString(o.prompt),
      multiSelect: optBool(o.multiSelect),
      options,
      explanation: optString(o.explanation),
    };
  });
}

/**
 * One literal `blocks[]{…}` projection (queries.ts §lessonFields). GROQ projects
 * every listed field on EVERY block, so each output block carries all keys with
 * `null` where the raw block omits them. `key` is the array item `_key`.
 */
function projectBlock(raw: unknown): LessonBlock {
  const b = (raw ?? {}) as Record<string, unknown>;
  return {
    key: optString(b._key),
    _type: optString(b._type),
    produces: b.produces ?? null,
    consumes: b.consumes ?? null,
    src: optString(b.src),
    url: optString(b.url),
    language: optString(b.language),
    buildType: optString(b.buildType),
    deployable: optBool(b.deployable),
    starter: optString(b.starter),
    solution: optString(b.solution),
    tests: projectTests(b.tests),
    hints: b.hints ?? null,
    questions: projectQuestions(b.questions),
    prompt: optString(b.prompt),
    maxWords: optNumber(b.maxWords),
    amount: optNumber(b.amount),
    network: optString(b.network),
    idl: optString(b.idl),
  } as unknown as LessonBlock;
}

/** Full lesson projection (queries.ts §lessonFields): `_id, title, slug, blocks[]`. */
export function projectLesson(doc: LessonDoc): Lesson {
  const blocks = Array.isArray(doc.blocks) ? doc.blocks : [];
  return {
    _id: doc._id,
    title: optString(doc.title) as string,
    slug: flatSlug(doc.slug) as string,
    blocks: blocks.map(projectBlock),
  };
}

/** Lesson summary `{ _id, title, "slug": slug.current }` (module nav / dashboards). */
export function projectLessonSummary(
  doc: LessonDoc
): Pick<Lesson, "_id" | "title" | "slug"> {
  return {
    _id: doc._id,
    title: optString(doc.title) as string,
    slug: flatSlug(doc.slug) as string,
  };
}

// --- modules ---

/** Raw inline module object on a course doc. */
interface RawModule {
  key?: unknown;
  title?: unknown;
  description?: unknown;
  lessons?: unknown;
}

/**
 * Deref a module's weak lesson refs through `lessonsById`, dropping unresolvable
 * ones — the explicit `.filter` mirror of GROQ `(lessons[]->{…})[defined(_id)]`
 * (#405 hardening: a stale ref degrades to fewer items, never a null crash).
 */
function derefLessons(
  raw: unknown,
  lessonsById: ReadonlyMap<string, LessonDoc>
): LessonDoc[] {
  if (!Array.isArray(raw)) return [];
  const out: LessonDoc[] = [];
  for (const ref of raw) {
    const id = refId(ref);
    const lesson = id ? lessonsById.get(id) : undefined;
    if (lesson) out.push(lesson);
  }
  return out;
}

function projectModule<T>(
  raw: RawModule,
  lessonsById: ReadonlyMap<string, LessonDoc>,
  lessonProjector: (l: LessonDoc) => T
): { key: string; title: string; description: string | null; lessons: T[] } {
  return {
    key: optString(raw.key) as string,
    title: optString(raw.title) as string,
    description: optString(raw.description),
    lessons: derefLessons(raw.lessons, lessonsById).map(lessonProjector),
  };
}

// --- course ---

export interface CourseProjectionDeps {
  instructorsById: ReadonlyMap<string, InstructorDoc>;
  lessonsById: ReadonlyMap<string, LessonDoc>;
}

export interface CourseProjectionOptions {
  /** Full `blocks[]` lessons in modules (course detail) vs `{_id,title,slug}`
   *  summaries (catalog list). Defaults to summaries (getAllCourses shape). */
  fullLessons?: boolean;
  /** Attach `trackCollectionAddress` (getCourseById reward path only). Omitted
   *  from the object entirely when not provided, matching getCourseBySlug. */
  trackCollectionAddress?: string | null;
}

/**
 * `courseFields` + `modules[]` (queries.ts). Reproduces getAllCourses (summary
 * module lessons) and getCourseBySlug/getCourseById (full module lessons via
 * `fullLessons`). `trackCollectionAddress` is added only when supplied.
 */
export function projectCourse(
  doc: CourseDoc,
  deps: CourseProjectionDeps,
  opts: CourseProjectionOptions = {}
): Course {
  const instructor = deps.instructorsById.get(refId(doc.instructor) ?? "");
  const rawModules: RawModule[] = Array.isArray(doc.modules)
    ? (doc.modules as RawModule[])
    : [];
  const lessonProjector = opts.fullLessons
    ? (l: LessonDoc) => projectLesson(l)
    : (l: LessonDoc) => projectLessonSummary(l);

  const projected = {
    _id: doc._id,
    title: optString(doc.title),
    slug: flatSlug(doc.slug) as string,
    description: optString(doc.description),
    difficulty: optString(doc.difficulty),
    duration: optNumber(doc.duration),
    thumbnail: optString(doc.thumbnail),
    instructor: projectInstructor(instructor),
    tags: (doc.tags ?? null) as string[] | null,
    xpReward: optNumber(doc.xpReward),
    trackId: optNumber(doc.trackId),
    trackLevel: optNumber(doc.trackLevel),
    modules: rawModules.map((m) =>
      projectModule(m, deps.lessonsById, lessonProjector)
    ),
    ...(opts.trackCollectionAddress !== undefined
      ? { trackCollectionAddress: opts.trackCollectionAddress }
      : {}),
  };

  return projected as unknown as Course;
}

/** Sum of raw module lesson-ref counts. NEVER a flattened traversal — matches
 *  GROQ `count(modules[].lessons[])`, per-course sum (memory: flatten null-count). */
export function countCourseLessons(doc: CourseDoc): number {
  const rawModules = Array.isArray(doc.modules) ? doc.modules : [];
  let total = 0;
  for (const m of rawModules) {
    const lessons = (m as RawModule).lessons;
    if (Array.isArray(lessons)) total += lessons.length;
  }
  return total;
}

/**
 * getCoursesByIds projection: `_id, title, slug, thumbnail, tags, difficulty,
 * totalLessons, learningPath`. `learningPath` is injected (resolved from path
 * membership by the caller) — the projector does not own the cross-doc join.
 */
export function projectCourseSummary(
  doc: CourseDoc,
  learningPath: string | null
): CourseSummary {
  return {
    _id: doc._id,
    title: optString(doc.title) as string,
    slug: flatSlug(doc.slug) as string,
    thumbnail: optString(doc.thumbnail),
    tags: (doc.tags ?? null) as string[] | null,
    difficulty: optString(doc.difficulty) as string,
    totalLessons: countCourseLessons(doc),
    learningPath,
  };
}

/**
 * getRecommendedCourses projection. Instructor is the 2-field mini deref
 * `{ name, "avatar": … }`. `learningPath` injected as in {@link projectCourseSummary}.
 */
export function projectRecommended(
  doc: CourseDoc,
  deps: Pick<CourseProjectionDeps, "instructorsById">,
  learningPath: string | null
): RecommendedCourse {
  const instructor = deps.instructorsById.get(refId(doc.instructor) ?? "");
  return {
    _id: doc._id,
    title: optString(doc.title) as string,
    slug: flatSlug(doc.slug) as string,
    description: optString(doc.description) as string,
    difficulty: optString(doc.difficulty) as string,
    duration: optNumber(doc.duration) as number,
    thumbnail: optString(doc.thumbnail),
    instructor: projectInstructorMini(instructor),
    tags: (doc.tags ?? null) as string[] | null,
    xpReward: optNumber(doc.xpReward) as number,
    totalLessons: countCourseLessons(doc),
    trackId: optNumber(doc.trackId) ?? undefined,
    trackLevel: optNumber(doc.trackLevel) ?? undefined,
    learningPath,
  };
}

// --- achievements ---

/** Validate the projected award against CS-1 `Award`; unparseable → null. */
export function parseAward(raw: unknown): AwardT | null {
  const parsed = Award.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/**
 * mapAchievement (queries.ts) over a raw achievement doc: id from `_id`, glyph
 * fallback to the last two chars uppercased, solTier→false, xpReward→0, award
 * validated. Consumes either a bundle achievement doc or the identical GROQ
 * `achievementProjection` output.
 */
export function projectAchievement(doc: AchievementDoc): DeployedAchievement {
  const id = doc._id;
  return {
    id,
    name: optString(doc.name) as string,
    description: optString(doc.description) as string,
    icon: optString(doc.icon) as string,
    glyph: optString(doc.glyph) ?? id.slice(-2).toUpperCase(),
    solTier: optBool(doc.solTier) ?? false,
    category: optString(doc.category) as string,
    xpReward: optNumber(doc.xpReward) ?? 0,
    award: parseAward(doc.award),
  };
}

// --- quests ---

const DRAFT_PREFIX = "drafts.";

/**
 * getAllQuests projection. `quests` = active, non-draft quest docs mapped to
 * {@link SanityQuest} (with the same `description`/`icon` defaults). `challengeLessonIds`
 * = lessons carrying ≥1 `code` block. `moduleLessonMap` = per-course modules
 * keyed `"<courseId>:<key>"`, lesson ids via ref deref, dropping module-less /
 * empty entries (matches the `.m[]` null-guard + `filter(Boolean)`).
 */
export function projectQuestData(
  quests: readonly QuestDoc[],
  lessons: readonly LessonDoc[],
  courses: readonly CourseDoc[]
): QuestData {
  const activeQuests: SanityQuest[] = quests
    .filter((q) => q.active === true && !q._id.startsWith(DRAFT_PREFIX))
    .map((q) => ({
      id: q._id,
      name: optString(q.name) as string,
      description: optString(q.description) ?? "",
      type: optString(q.type) as SanityQuest["type"],
      icon: optString(q.icon) ?? "CircleDashed",
      xpReward: optNumber(q.xpReward) as number,
      targetValue: optNumber(q.targetValue) as number,
      resetType: optString(q.resetType) as SanityQuest["resetType"],
    }));

  const challengeLessonIds = lessons
    .filter((l) => {
      const blocks = Array.isArray(l.blocks) ? l.blocks : [];
      return blocks.some((b) => (b as { _type?: unknown })?._type === "code");
    })
    .map((l) => l._id);

  const moduleLessonMap = courses
    .filter((c) => !c._id.startsWith(DRAFT_PREFIX))
    .flatMap((c) => {
      const rawModules = Array.isArray(c.modules)
        ? (c.modules as RawModule[])
        : [];
      return rawModules.map((m) => ({
        id: `${c._id}:${optString(m.key) ?? ""}`,
        lessonIds: (Array.isArray(m.lessons) ? m.lessons : [])
          .map((ref) => refId(ref))
          .filter((x): x is string => !!x),
      }));
    })
    .filter((m) => m.lessonIds.length > 0);

  return { quests: activeQuests, challengeLessonIds, moduleLessonMap };
}

// --- learning paths ---

export interface PathProjectionDeps extends CourseProjectionDeps {
  coursesById: ReadonlyMap<string, CourseDoc>;
}

/** Raw learning-path doc fields we read. */
interface RawPath {
  _id: string;
  title?: unknown;
  description?: unknown;
  slug?: unknown;
  tag?: unknown;
  order?: unknown;
  difficulty?: unknown;
  courses?: unknown;
}

/**
 * getAllLearningPaths projection. Path scalar fields flattened; `courses` are
 * the referenced course docs (already filtered to synced+active by the caller,
 * which owns the deployment gate) projected with summary module lessons.
 */
export function projectLearningPath(
  doc: RawPath,
  memberCourses: readonly CourseDoc[],
  deps: CourseProjectionDeps
): LearningPath {
  return {
    _id: doc._id,
    title: optString(doc.title),
    description: optString(doc.description),
    slug: flatSlug(doc.slug),
    tag: optString(doc.tag) ?? undefined,
    order: optNumber(doc.order) ?? undefined,
    difficulty: optString(doc.difficulty),
    courses: memberCourses.map((c) => projectCourse(c, deps)),
  } as unknown as LearningPath;
}
