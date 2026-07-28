import "server-only";

import type { Course, Lesson } from "@superteam-lms/types";
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
  courses: Course[];
  lessonsByCourse: Record<string, Lesson[]>;
  xpPerLessonById: Record<string, number>;
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
    xpPerLessonById: r.xpPerLessonById,
  }));

  cache.set(prNumber, { at: Date.now(), value });
  // A failed compile must not be cached — the teacher will push a fix and retry.
  value.catch(() => cache.delete(prNumber));

  return value;
}

export function findPreviewCourse(
  bundle: PreviewBundle,
  slug: string
): Course | null {
  return bundle.courses.find((c) => c.slug === slug) ?? null;
}

export function findPreviewLesson(
  bundle: PreviewBundle,
  course: Course,
  lessonSlug: string
): Lesson | null {
  const lessons = bundle.lessonsByCourse[course._id] ?? [];
  return lessons.find((l) => l.slug === lessonSlug) ?? null;
}
