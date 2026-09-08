import "server-only";

import type { Course, Lesson } from "@superteam-lms/types";
import type { L10nBundle } from "@/lib/content/compile/l10n";
import { localizeCourseView } from "@/lib/content/localize";
import { projectCourse } from "@/lib/content/project";
import type { CourseDoc, LessonDoc } from "@/lib/content/types";
import { compilePrPreview, type PrHead } from "./preview-compile";

/**
 * Memoised PR compiles for the teacher preview (#831).
 *
 * Rendering a previewed course means several page loads — the course page, then
 * one per lesson — and each would otherwise re-download and re-expand the repo
 * tarball. The compile is a pure function of the head SHA, so caching it is
 * safe: a pushed commit changes the SHA and misses the cache naturally.
 *
 * Deliberately in-process and tiny. This is a preview tool used by a handful of
 * teachers, not a hot path: a serverless instance that loses the cache simply
 * recompiles, and there is nothing to invalidate by hand.
 */

/** The compiled bundle, in the shapes the real page components consume. */
export interface PreviewBundle {
  head: PrHead;
  /** Source-language projections — the listing's view. */
  courses: Course[];
  lessonsByCourse: Record<string, Lesson[]>;
  /** Raw docs + overlays, so the pages can project in the reader's locale. */
  rawCourses: CourseDoc[];
  rawLessonsById: Map<string, LessonDoc>;
  l10n: L10nBundle;
  xpPerLessonById: Record<string, number>;
  /** Asset bytes by public rel path — served by the preview asset route (#923). */
  assets: Map<string, Uint8Array>;
}

interface Entry {
  at: number;
  value: Promise<PreviewBundle>;
}

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 8;
const cache = new Map<number, Entry>();

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.at > TTL_MS) cache.delete(key);
  }
  // Map preserves insertion order, so the first key is the oldest.
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

export async function getPreviewBundle(
  prNumber: number
): Promise<PreviewBundle> {
  evictExpired();

  const hit = cache.get(prNumber);
  if (hit) return hit.value;

  // Cache the PROMISE, not the result: two concurrent page loads for the same
  // PR then share one compile instead of racing two tarball downloads.
  const value = compilePrPreview(prNumber).then((r) => ({
    head: r.head,
    courses: r.courses as unknown as Course[],
    lessonsByCourse: r.lessonsByCourse as unknown as Record<string, Lesson[]>,
    rawCourses: r.rawCourses,
    rawLessonsById: r.rawLessonsById,
    l10n: r.l10n,
    xpPerLessonById: r.xpPerLessonById,
    assets: r.assets,
  }));

  cache.set(prNumber, { at: Date.now(), value });
  // A failed compile must not be cached — the teacher will push a fix and retry.
  value.catch(() => cache.delete(prNumber));

  return value;
}

/**
 * A previewed course in the reader's language — the same resolution the live
 * `getCourseBySlug(slug, locale)` performs, over the PR's own overlays:
 * `locale` when the course ships it (as source or as `l10n/<locale>/`), the
 * source language otherwise, with the locale fields attached so the real
 * course/lesson components show the same language notice they show live.
 * That is what lets a teacher check both halves of a bilingual PR before it
 * is published, by switching the UI language.
 */
export function findPreviewCourse(
  bundle: PreviewBundle,
  slug: string,
  locale?: string
): Course | null {
  const doc = bundle.rawCourses.find((c) => c.slug?.current === slug);
  if (!doc) return null;
  const view = localizeCourseView(
    doc,
    bundle.l10n[doc._id],
    bundle.rawLessonsById,
    locale
  );
  return {
    ...projectCourse(
      view.doc,
      { lessonsById: view.lessonsById },
      { fullLessons: true }
    ),
    sourceLocale: view.sourceLocale,
    availableLocales: view.availableLocales,
    locale: view.locale,
  };
}

/** A localized course's lessons in curriculum order — what prev/next follows. */
export function previewCourseLessons(course: Course): Lesson[] {
  return (course.modules ?? []).flatMap((m) => (m.lessons ?? []) as Lesson[]);
}

/** A lesson of an already-localized course, so it is in the same language. */
export function findPreviewLesson(
  course: Course,
  lessonSlug: string
): Lesson | null {
  return (
    previewCourseLessons(course).find((l) => l.slug === lessonSlug) ?? null
  );
}
