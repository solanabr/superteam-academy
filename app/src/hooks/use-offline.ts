"use client";

import { useState, useEffect, useCallback } from "react";
import type { Course } from "@/types";
import {
  saveCourseOffline,
  removeCourseOffline,
  isCourseSavedOffline,
  getAllOfflineCourses,
  getPendingCompletions,
  markCompletionSynced,
  clearSyncedCompletions,
  queueCompletion,
} from "@/lib/offline-store";

// ─── Online/Offline status ──────────────────────────────

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}

// ─── Service Worker registration ────────────────────────

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {
        // SW registration failed — non-critical
      });
  }, []);
}

// ─── Save / Remove course for offline ───────────────────

export function useOfflineCourse(course: Course | null) {
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!course) {
      setLoading(false);
      return;
    }
    isCourseSavedOffline(course.slug)
      .then(setIsSaved)
      .finally(() => setLoading(false));
  }, [course?.slug, course]);

  const saveCourse = useCallback(async () => {
    if (!course || saving) return;
    setSaving(true);
    try {
      // 1. Save course data to IndexedDB
      await saveCourseOffline(course);

      // 2. Tell SW to cache the page URLs
      const urls = buildCourseUrls(course);
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "CACHE_COURSE_URLS",
          urls,
        });
      }

      setIsSaved(true);
    } finally {
      setSaving(false);
    }
  }, [course, saving]);

  const removeCourse = useCallback(async () => {
    if (!course) return;
    await removeCourseOffline(course.slug);

    // Tell SW to remove cached pages
    const urls = buildCourseUrls(course);
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "UNCACHE_COURSE_URLS",
        urls,
      });
    }

    setIsSaved(false);
  }, [course]);

  return { isSaved, saving, loading, saveCourse, removeCourse };
}

// ─── List all saved courses ─────────────────────────────

export function useOfflineCourses() {
  const [courses, setCourses] = useState<
    Array<{ slug: string; courseId: string; title: string; savedAt: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    getAllOfflineCourses()
      .then((entries) =>
        setCourses(
          entries.map((e) => ({
            slug: e.slug,
            courseId: e.courseId,
            title: e.title,
            savedAt: e.savedAt,
          })),
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { courses, loading, refresh };
}

// ─── Queue offline lesson completion ────────────────────

export function useOfflineCompletion() {
  const isOnline = useOnlineStatus();

  const queueOfflineCompletion = useCallback(
    async (courseId: string, lessonIndex: number) => {
      await queueCompletion(courseId, lessonIndex);
    },
    [],
  );

  // Auto-sync when back online
  useEffect(() => {
    if (!isOnline) return;

    const sync = async () => {
      const pending = await getPendingCompletions();
      for (const item of pending) {
        try {
          const res = await fetch("/api/progress/offline-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseId: item.courseId,
              lessonIndex: item.lessonIndex,
              completedAt: item.completedAt,
            }),
          });
          if (res.ok) {
            await markCompletionSynced(item.id);
          }
        } catch {
          // Will retry next time online
          break;
        }
      }
      await clearSyncedCompletions();
    };

    sync();
  }, [isOnline]);

  return { queueOfflineCompletion, isOnline };
}

// ─── Helpers ────────────────────────────────────────────

function buildCourseUrls(course: Course): string[] {
  const urls: string[] = [`/courses/${course.slug}`];

  let lessonIdx = 0;
  for (const mod of course.modules) {
    for (const _ of mod.lessons) {
      urls.push(`/courses/${course.slug}/lessons/${lessonIdx}`);
      lessonIdx++;
    }
  }

  return urls;
}
