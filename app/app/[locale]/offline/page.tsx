"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { WifiOff, Trash2, Download, Clock, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface SavedCourse {
  slug: string;
  data: string;
  savedAt: number;
}

interface PendingCompletion {
  id: string;
  courseId: string;
  lessonIndex: number;
  completedAt: number;
  synced: boolean;
}

export default function OfflinePage() {
  const t = useTranslations("offline");
  const [courses, setCourses] = useState<SavedCourse[]>([]);
  const [pending, setPending] = useState<PendingCompletion[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { listOfflineCourses, getUnsyncedCompletions } = await import("@/lib/indexed-db");
      const [c, p] = await Promise.all([listOfflineCourses(), getUnsyncedCompletions()]);
      setCourses(c);
      setPending(p);
    } catch {
      // IndexedDB not available
    } finally {
      setLoading(false);
    }
  }

  async function removeCourse(slug: string) {
    const { removeOfflineCourse } = await import("@/lib/indexed-db");
    await removeOfflineCourse(slug);
    setCourses((prev) => prev.filter((c) => c.slug !== slug));
  }

  async function syncNow() {
    const { syncCompletions } = await import("@/lib/indexed-db");
    await syncCompletions();
    await loadData();
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatSize(data: string) {
    const bytes = new Blob([data]).size;
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <WifiOff className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
        <p className="text-gray-400 mb-6">{t("subtitle")}</p>

        {/* Connection status */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mb-8 ${
            isOnline
              ? "bg-green-900/40 text-green-400"
              : "bg-red-900/40 text-red-400"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-green-400" : "bg-red-400"
            }`}
          />
          {isOnline ? t("online") : t("offline_status")}
        </div>

        {/* Saved courses */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-400" />
            {t("saved_courses")} ({courses.length})
          </h2>

          {courses.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">{t("no_courses")}</p>
              <Link
                href="/courses"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                {t("browse_courses")}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                let parsed: { title?: string } = {};
                try {
                  parsed = JSON.parse(course.data);
                } catch {
                  /* ignore */
                }
                return (
                  <motion.div
                    key={course.slug}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-medium">
                        {parsed.title ?? course.slug}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {t("saved")} {formatDate(course.savedAt)}
                        </span>
                        <span>{formatSize(course.data)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCourse(course.slug)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title={t("remove")}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pending sync */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            {t("pending_sync")} ({pending.length})
          </h2>

          {pending.length === 0 ? (
            <p className="text-gray-400">{t("all_synced")}</p>
          ) : (
            <>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
                {pending.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between py-2 border-b border-gray-800 last:border-0"
                  >
                    <span className="text-sm">
                      {p.courseId} — Lesson {p.lessonIndex + 1}
                    </span>
                    <span className="text-sm text-gray-400">
                      {formatDate(p.completedAt)}
                    </span>
                  </div>
                ))}
              </div>
              {isOnline && (
                <button
                  onClick={syncNow}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
                >
                  {t("sync_now")}
                </button>
              )}
            </>
          )}
        </section>
      </motion.div>
    </div>
  );
}
