"use client";

import { useEffect, useState } from "react";
import { getCoursesByIds, getLessonsByIds } from "@/lib/content/client-queries";
import type { ThreadContext } from "@/components/community/lesson-context-chip";

interface ScopedThread {
  id: string;
  course_id?: string | null;
  lesson_id?: string | null;
}

/**
 * Resolves the course/lesson titles behind a batch of threads' scope ids, so
 * the feed can show where a question came from. Ids come from the DB; titles
 * come from the committed content bundle via the public `/api/content/*`
 * routes — an id that no longer resolves (deleted lesson) simply degrades to
 * the course, and a course that does not resolve yields no chip at all.
 *
 * Returns a map keyed by thread id; threads with no course scope are absent.
 */
export function useThreadContexts(
  threads: ScopedThread[]
): Map<string, ThreadContext> {
  const [contexts, setContexts] = useState<Map<string, ThreadContext>>(
    new Map()
  );

  // Stable dependency: the set of (courseId, lessonId) pairs actually present.
  const signature = threads
    .filter((t) => t.course_id)
    .map((t) => `${t.course_id}:${t.lesson_id ?? ""}`)
    .sort()
    .join("|");

  useEffect(() => {
    if (!signature) {
      setContexts(new Map());
      return;
    }

    let cancelled = false;
    const pairs = signature.split("|").map((entry) => {
      const [courseId = "", lessonId = ""] = entry.split(":");
      return { courseId, lessonId };
    });
    const courseIds = [...new Set(pairs.map((p) => p.courseId))];
    const lessonIds = [
      ...new Set(pairs.map((p) => p.lessonId).filter(Boolean)),
    ];

    Promise.all([
      getCoursesByIds(courseIds),
      lessonIds.length > 0 ? getLessonsByIds(lessonIds) : Promise.resolve([]),
    ])
      .then(([courses, lessons]) => {
        if (cancelled) return;
        const courseById = new Map(courses.map((c) => [c._id, c]));
        const lessonById = new Map(lessons.map((l) => [l._id, l]));
        const next = new Map<string, ThreadContext>();
        for (const thread of threads) {
          if (!thread.course_id) continue;
          const course = courseById.get(thread.course_id);
          if (!course) continue;
          const lesson = thread.lesson_id
            ? lessonById.get(thread.lesson_id)
            : undefined;
          next.set(thread.id, {
            courseTitle: course.title,
            courseSlug: course.slug,
            ...(lesson
              ? { lessonTitle: lesson.title, lessonSlug: lesson.slug }
              : {}),
          });
        }
        setContexts(next);
      })
      .catch(() => {
        // Provenance is enrichment — a failed lookup drops the chips, never
        // the threads.
        if (!cancelled) setContexts(new Map());
      });

    return () => {
      cancelled = true;
    };
    // `threads` is re-read inside the effect; `signature` is what actually
    // changes the answer, so it alone drives the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return contexts;
}
