import { z } from "zod";
import { BlockKey, ModuleKey } from "./ids";

/**
 * Course translations (academy-courses PR #51): a course is ONE course in every
 * language it is available in. It declares the language it was WRITTEN in
 * (`course.yaml` `sourceLocale`) and gains other languages through an optional
 * overlay, `courses/<slug>/l10n/<locale>/`, holding a `strings.yaml` plus any
 * prose and images the translator re-authored at the mirrored path.
 *
 * The overlay is a translation, never a second course. Duplicating a course to
 * translate it would fork its PDA, its enrolment, its slot bitmap and its XP
 * ledger, and two `course_id`s can never be merged.
 *
 * Every key below is optional: anything absent falls back to the source
 * locale, PER ITEM — string by string, file by file. The fallback is to the
 * course's own source language, never to English; most live courses are PT-BR
 * originals with no English at all.
 *
 * `strictObject` throughout is load-bearing. It is what makes an overlay
 * STRUCTURALLY incapable of carrying an id, a slug, a `correct` flag, an XP
 * value, a `starter`/`solution`, a parsons answer key or a test's
 * `input`/`expectedOutput` — the things that reach the on-chain surface or
 * the grader. A translation cannot touch them because there is nowhere in
 * this shape to put them.
 */

/** The locales a course can be authored or translated in — the app's own. */
export const CONTENT_LOCALES = ["en", "pt-BR", "es"] as const;
export const ContentLocale = z.enum(CONTENT_LOCALES);
export type ContentLocaleT = z.infer<typeof ContentLocale>;

const Text = z.string().min(1);
const Id = z.string().min(1);
const LessonSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * `hints` and `tutorNotes` are the only translatable fields the source stores
 * as a bare list with no ids, so the overlay keys them by ARRAY INDEX. Sparse
 * is fine — translate 0 and 2, and 1 renders in the source language.
 */
const IndexedList = z.record(z.string().regex(/^(0|[1-9][0-9]*)$/), Text);

export const L10nQuizOption = z.strictObject({
  label: Text.optional(),
  feedback: Text.optional(),
});

export const L10nQuizQuestion = z.strictObject({
  prompt: Text.optional(),
  explanation: Text.optional(),
  /** Keyed by option id. `correct` is never overlaid — source only. */
  options: z.record(Id, L10nQuizOption).optional(),
});

export const L10nTestCase = z.strictObject({
  description: Text.optional(),
  /** Same bound as the source `TestCase.failureMessage`. */
  failureMessage: z.string().min(1).max(300).optional(),
});

/**
 * One stanza per translated block. Which properties apply depends on the
 * source block's type — the compiler checks that against the real lesson;
 * this shape only says what is EVER allowed to be translated.
 */
export const L10nBlock = z.strictObject({
  /** openEnded prompt, or a parsons block's prompt. */
  prompt: Text.optional(),
  /** A parsons block's explanation. */
  explanation: Text.optional(),
  /** video — an optional dubbed or subtitled variant. Omit and the source plays. */
  url: z
    .url()
    .refine((u) => u.startsWith("https://"), { message: "must be https" })
    .optional(),
  /** code — index-keyed. */
  hints: IndexedList.optional(),
  /** code — index-keyed. What the AI Partner reads. */
  tutorNotes: IndexedList.optional(),
  /** quiz — keyed by question id. */
  questions: z.record(Id, L10nQuizQuestion).optional(),
  /** code — keyed by test case id from tests.json. */
  tests: z.record(Id, L10nTestCase).optional(),
});

export const L10nLesson = z.strictObject({
  title: Text.optional(),
  /**
   * Keyed by block key from lesson.yaml. Prose blocks do NOT appear here — a
   * translated `.md` at the mirrored path is the index.
   */
  blocks: z.record(BlockKey, L10nBlock).optional(),
});

export const L10nModule = z.strictObject({
  title: Text.optional(),
  description: Text.optional(),
});

export const L10nCourse = z.strictObject({
  title: Text.optional(),
  description: Text.optional(),
  /** Keyed by module key from course.yaml. */
  modules: z.record(ModuleKey, L10nModule).optional(),
});

/** `courses/<slug>/l10n/<locale>/strings.yaml` — one file per course per language. */
export const L10nStrings = z.strictObject({
  /**
   * Must match the folder name exactly. Declared rather than derived because
   * macOS filesystems are case-insensitive: `l10n/pt-br/` and `l10n/pt-BR/`
   * are one folder locally and two in git. The SOURCE language is not
   * repeated here — it lives in course.yaml, where a second copy could only
   * drift.
   */
  locale: ContentLocale,
  course: L10nCourse.optional(),
  /** Keyed by lesson slug — the lesson's folder name. */
  lessons: z.record(LessonSlug, L10nLesson).optional(),
});

export type L10nStringsT = z.infer<typeof L10nStrings>;
export type L10nLessonT = z.infer<typeof L10nLesson>;
export type L10nBlockT = z.infer<typeof L10nBlock>;
export type L10nCourseT = z.infer<typeof L10nCourse>;
