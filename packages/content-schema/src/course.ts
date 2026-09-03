import { z } from "zod";
import { CourseId, LessonId, ModuleKey } from "./ids";
import { DIFFICULTIES, MAX_LESSON_SLOTS, MAX_XP_PER_MINT } from "./constants";
import { SolanaAddress } from "./wallet";
import { ContentLocale } from "./l10n";

const unique = <T>(xs: readonly T[]) => new Set(xs).size === xs.length;

/** Inline object, not a document — modules are never reused across courses. */
export const CourseModule = z.object({
  key: ModuleKey,
  title: z.string().min(1),
  description: z.string().optional(),
  lessons: z.array(LessonId).min(1),
});

export const Course = z
  .object({
    id: CourseId,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    /**
     * The language this course is WRITTEN in — the language its base tree IS
     * (academy-courses PR #51). Set once at creation. Other languages arrive
     * as `l10n/<locale>/` overlays beside the lessons (see `l10n.ts`), and
     * the available-language list is DERIVED: this plus whatever overlay
     * folders exist. Fallback is always requested → sourceLocale, never →
     * `en`; most live courses are PT-BR originals with no English at all.
     *
     * Required, not defaulted: a defaulted `en` would silently label a
     * Portuguese course English the moment an author forgot the line, and
     * the Portuguese reader would then be told the course is not available
     * in Portuguese.
     */
    sourceLocale: ContentLocale,
    title: z.string().min(1),
    description: z.string().optional(),
    difficulty: z.enum(DIFFICULTIES),
    duration: z.number().nonnegative(),
    /**
     * Stored in the Course PDA. On-chain, `create_course` does NOT bound this;
     * the only chain ceiling is `complete_lesson.rs:30` (xp_per_lesson ≤ 5000).
     * This 1..100 range is a product policy the Zod schema alone enforces —
     * plus the finalize-invariant refine below (xpPerLesson × lessonCount ≤ 10000).
     */
    xpPerLesson: z.number().int().min(1).max(100),
    /** Completion bonus is derived on-chain; this is the catalogue display value. */
    xpReward: z.number().int().min(0).max(MAX_XP_PER_MINT),
    creatorRewardXp: z.number().int().min(0).max(MAX_XP_PER_MINT).default(0),
    minCompletionsForReward: z.number().int().min(0).default(0),
    trackId: z.number().int().min(0).default(0),
    trackLevel: z.number().int().min(0).default(0),
    /**
     * The course's on-chain `Course.creator` (the creator XP recipient) —
     * authored directly on the course as a wallet, no longer resolved through a
     * separate instructor document (issue #478). OPTIONAL for now: today's
     * content predates this field (it still carries the retired `instructor`
     * ref, which this schema no longer recognizes and Zod silently strips). A
     * later activation PR tightens this to required once content is migrated —
     * until then, the sync rejects a course with no creator wallet at deploy
     * time, not at schema validation.
     */
    creator: SolanaAddress.optional(),
    /**
     * Repo-relative path to the course's catalogue thumbnail (e.g.
     * `assets/thumbnail.png`), resolved against the course folder. Optional in
     * the schema; the compiler verifies the file exists when set (SP2 — images
     * are git-sourced, no external image host).
     */
    thumbnail: z.string().min(1).optional(),
    prerequisiteCourse: CourseId.optional(),
    /**
     * Listed nowhere, live by direct link (#1137). The course page, its
     * lessons, enrolment and completion all keep working for anyone holding
     * the URL; what goes away is discovery — the catalogue, the landing
     * count, the sitemap, recommendations, the catalogue filter chips, and
     * path membership. That is the distribution model for event/QR-booth
     * courses.
     *
     * This is the ONLY listing-visibility control: it is read at runtime by
     * lib/content/queries.ts, so hiding a course is a content decision, not
     * an app-code constant. "Gone" is a different state and already modelled
     * twice over — `_draft/` parking keeps a course out of the bundle, and
     * the admin deactivate toggle takes a deployed one off-chain-active.
     */
    unlisted: z.boolean().default(false),
    modules: z.array(CourseModule).min(1),
    // No authored `tags` field (#466 C3): a course's catalogue tags are
    // DERIVED — the compiler's projector computes them as the sorted,
    // deduplicated union of its lessons' `skills` (see
    // apps/web/src/lib/content/compile/projector.ts). Authoring a `tags:` key
    // on a course.yaml is silently stripped, not an error.
  })
  .refine((c) => unique(c.modules.map((m) => m.key)), {
    message: "module keys must be unique within a course",
    path: ["modules"],
  })
  .refine((c) => unique(c.modules.flatMap((m) => m.lessons)), {
    message: "a lesson may appear in only one module",
    path: ["modules"],
  })
  .refine(
    (c) => c.modules.flatMap((m) => m.lessons).length <= MAX_LESSON_SLOTS,
    {
      message: `a course may hold at most ${MAX_LESSON_SLOTS} lessons (Enrollment.lesson_flags is [u64; 4])`,
      path: ["modules"],
    }
  )
  // The finalize XP invariant (spec §5.2 / gate 5a): finalize_course.rs computes
  // bonus = xp_per_lesson * liveLessonCount / 2 and reverts if bonus > 5000, so
  // xpPerLesson * lessonCount must be <= 2 * MAX_XP_PER_MINT (10000). Violate it
  // and EVERY learner's finalize reverts forever — no bonus, no credential,
  // total_completions frozen, creator rewards dead.
  .refine(
    (c) =>
      c.xpPerLesson * c.modules.flatMap((m) => m.lessons).length <=
      2 * MAX_XP_PER_MINT,
    {
      message: `xpPerLesson × lessonCount must be ≤ ${2 * MAX_XP_PER_MINT} (finalize_course bonus ≤ MAX_XP_PER_MINT); above it, no learner can finalize`,
      path: ["xpPerLesson"],
    }
  )
  .refine((c) => c.prerequisiteCourse !== c.id, {
    message: "a course cannot be its own prerequisite",
    path: ["prerequisiteCourse"],
  });

export type CourseT = z.infer<typeof Course>;
export type CourseModuleT = z.infer<typeof CourseModule>;
