import type {
  L10nCourseBundle,
  L10nLessonBundle,
} from "@/lib/content/compile/l10n";
import type { CourseDoc, LessonDoc } from "./types";

/**
 * Runtime merge of a course's translation overlay onto its RAW bundle docs
 * (academy-courses PR #51). Pure and per-leaf: a string the overlay carries
 * replaces the source string; anything it does not carry stays as authored.
 * Fallback is to the course's own source language, never to English.
 *
 * It operates BEFORE projection, on the Sanity-shaped docs the store holds,
 * so the projectors (`project.ts`) and every renderer downstream stay
 * locale-blind: they receive the same `Course` / `Lesson` shape they always
 * did, already in the right language. Grading never comes through here — the
 * overlay shape cannot carry a `correct` flag, a `starter`/`solution` or a
 * test's `input`/`expectedOutput`, and the grader reads the source tree by
 * construction (`getLessonByIdForGrading` takes no locale).
 */

/** The overlay locales a course ships, from its `l10n.json` entry. */
export function overlayLocales(
  overlays: Record<string, L10nCourseBundle> | undefined
): string[] {
  return overlays ? Object.keys(overlays).sort() : [];
}

/**
 * `sourceLocale` plus every overlay locale, sorted with the source first —
 * the list a catalogue chip or a language notice reads.
 */
export function availableLocales(
  sourceLocale: string,
  overlays: Record<string, L10nCourseBundle> | undefined
): string[] {
  const rest = overlayLocales(overlays).filter((l) => l !== sourceLocale);
  return [sourceLocale, ...rest];
}

/**
 * The locale a course actually renders in for a request: the requested one
 * when the course has it (as source or as overlay), else the source. A
 * course reached in a language it does not have still renders — links never
 * break — it just answers in its own language, and the caller can compare
 * the result to the request to show a notice.
 */
export function resolveCourseLocale(
  requested: string | undefined,
  sourceLocale: string,
  overlays: Record<string, L10nCourseBundle> | undefined
): string {
  if (!requested || requested === sourceLocale) return sourceLocale;
  return overlays && requested in overlays ? requested : sourceLocale;
}

/** A course doc's declared source language; `en` only for a doc that predates the field. */
export function docSourceLocale(doc: CourseDoc): string {
  return typeof doc.sourceLocale === "string" ? doc.sourceLocale : "en";
}

// ── course ──────────────────────────────────────────────────────────────────

interface RawModule {
  key?: unknown;
  title?: unknown;
  description?: unknown;
  [k: string]: unknown;
}

/**
 * Apply a course-level overlay: title, description, localized thumbnail,
 * module titles/descriptions. Module lesson refs are untouched — the overlay
 * has no place to put one.
 */
export function localizeCourseDoc(
  doc: CourseDoc,
  overlay: L10nCourseBundle | undefined
): CourseDoc {
  const c = overlay?.course;
  if (!c) return doc;
  const modules = Array.isArray(doc.modules)
    ? (doc.modules as RawModule[]).map((m) => {
        const key = typeof m.key === "string" ? m.key : undefined;
        const t = key ? c.modules?.[key] : undefined;
        if (!t) return m;
        return {
          ...m,
          ...(t.title ? { title: t.title } : {}),
          ...(t.description ? { description: t.description } : {}),
        };
      })
    : doc.modules;
  return {
    ...doc,
    ...(c.title ? { title: c.title } : {}),
    ...(c.description ? { description: c.description } : {}),
    ...(c.thumbnail ? { thumbnail: c.thumbnail } : {}),
    modules,
  };
}

// ── lesson ──────────────────────────────────────────────────────────────────

interface RawBlock {
  _key?: unknown;
  _type?: unknown;
  [k: string]: unknown;
}

/** Overlay an index-keyed list (`hints`, `tutorNotes`) onto the source array, sparse. */
function localizeIndexed(
  source: unknown,
  overlay: Record<string, string> | undefined
): unknown {
  if (!overlay || !Array.isArray(source)) return source;
  return source.map((item, i) => overlay[String(i)] ?? item);
}

function localizeQuestions(
  source: unknown,
  overlay: NonNullable<L10nLessonBundle["blocks"]>[string]["questions"]
): unknown {
  if (!overlay || !Array.isArray(source)) return source;
  return source.map((q) => {
    const question = (q ?? {}) as { id?: unknown; options?: unknown };
    const t =
      typeof question.id === "string" ? overlay[question.id] : undefined;
    if (!t) return q;
    const options = Array.isArray(question.options)
      ? question.options.map((op) => {
          const option = (op ?? {}) as { id?: unknown };
          const to =
            typeof option.id === "string" ? t.options?.[option.id] : undefined;
          if (!to) return op;
          return {
            ...(op as object),
            ...(to.label ? { label: to.label } : {}),
            ...(to.feedback ? { feedback: to.feedback } : {}),
          };
        })
      : question.options;
    return {
      ...(q as object),
      ...(t.prompt ? { prompt: t.prompt } : {}),
      ...(t.explanation ? { explanation: t.explanation } : {}),
      options,
    };
  });
}

function localizeTests(
  source: unknown,
  overlay: NonNullable<L10nLessonBundle["blocks"]>[string]["tests"]
): unknown {
  if (!overlay || !Array.isArray(source)) return source;
  return source.map((tc) => {
    const test = (tc ?? {}) as { id?: unknown };
    const t = typeof test.id === "string" ? overlay[test.id] : undefined;
    if (!t) return tc;
    return {
      ...(tc as object),
      ...(t.description ? { description: t.description } : {}),
      ...(t.failureMessage ? { failureMessage: t.failureMessage } : {}),
    };
  });
}

function localizeBlock(
  block: RawBlock,
  t: NonNullable<L10nLessonBundle["blocks"]>[string] | undefined
): RawBlock {
  if (!t) return block;
  const out: RawBlock = { ...block };
  // Prose: the translated markdown, already rewritten to public asset urls.
  if (t.src) out.src = t.src;
  if (t.prompt) out.prompt = t.prompt;
  if (t.explanation) out.explanation = t.explanation;
  if (t.url) out.url = t.url;
  if (t.hints) out.hints = localizeIndexed(block.hints, t.hints);
  if (t.tutorNotes)
    out.tutorNotes = localizeIndexed(block.tutorNotes, t.tutorNotes);
  if (t.questions)
    out.questions = localizeQuestions(block.questions, t.questions);
  if (t.tests) out.tests = localizeTests(block.tests, t.tests);
  return out;
}

/** Apply a lesson-level overlay: title, then each block by its `_key`. */
export function localizeLessonDoc(
  doc: LessonDoc,
  overlay: L10nLessonBundle | undefined
): LessonDoc {
  if (!overlay) return doc;
  const blocks = Array.isArray(doc.blocks)
    ? (doc.blocks as RawBlock[]).map((b) =>
        localizeBlock(
          b,
          typeof b._key === "string" ? overlay.blocks?.[b._key] : undefined
        )
      )
    : doc.blocks;
  return {
    ...doc,
    ...(overlay.title ? { title: overlay.title } : {}),
    blocks,
  };
}

/**
 * A `lessonsById` view for one course in one locale: each of the course's
 * lessons localized, so a course projector that derefs module lesson refs
 * through it gets translated lessons without learning about locales itself.
 * Lessons outside the course fall through to the source map untouched.
 */
export function localizedLessonMap(
  lessonsById: ReadonlyMap<string, LessonDoc>,
  overlay: L10nCourseBundle | undefined
): ReadonlyMap<string, LessonDoc> {
  const lessons = overlay?.lessons;
  if (!lessons) return lessonsById;
  const view = new Map(lessonsById);
  for (const [id, entry] of Object.entries(lessons)) {
    const doc = lessonsById.get(id);
    if (doc) view.set(id, localizeLessonDoc(doc, entry));
  }
  return view;
}
