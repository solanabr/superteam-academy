"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Plus, Eye, Edit2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TRACK_LABELS, TRACK_COLORS, type TrackType } from "@/lib/constants";
import { useAdmin } from "@/lib/hooks/use-admin";
import type { AdminCourse } from "@/app/api/admin/courses/route";

export function CourseTable() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { isAdmin } = useAdmin();
  const DIFFICULTY_NAMES = [tc("beginner"), tc("intermediate"), tc("advanced")] as const;
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data: AdminCourse[] = await res.json();
      setCourses(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch";
      setError(msg);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filtered = courses.filter(
    (c) =>
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.track.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="h-4 w-4 text-[var(--c-text-2)]" />
          <Input
            placeholder={t("searchCourses")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchCourses}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => router.push(`/${locale}/admin/courses/new`)}>
            <Plus className="h-3.5 w-3.5" /> {t("newCourse")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-[2px] border border-[#EF4444]/20 bg-[#EF4444]/5 px-4 py-3 mb-4">
          <p className="text-xs text-[#EF4444]">{error}</p>
        </div>
      )}

      <div className="border border-[var(--c-border-subtle)] rounded-[2px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--c-bg-elevated)] text-[var(--c-text-2)] text-xs uppercase tracking-wider">
              <th className="px-4 py-2.5 text-left font-medium">{t("course")}</th>
              <th className="px-4 py-2.5 text-left font-medium">{t("track")}</th>
              <th className="px-4 py-2.5 text-center font-medium">{t("lessons")}</th>
              <th className="px-4 py-2.5 text-center font-medium">{t("xpPerLesson")}</th>
              <th className="px-4 py-2.5 text-center font-medium">
                {t("enrollments")}
              </th>
              <th className="px-4 py-2.5 text-center font-medium">{t("status")}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--c-border-subtle)]">
            {loading && courses.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 rounded bg-[var(--c-border-subtle)] animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-[var(--c-text-2)]"
                >
                  {searchQuery
                    ? t("noCoursesMatch")
                    : t("noCoursesFound")}
                </td>
              </tr>
            ) : (
              filtered.map((course) => {
                const trackKey = course.track as TrackType;
                const trackColor = TRACK_COLORS[trackKey] ?? "#888";
                const trackLabel = TRACK_LABELS[trackKey] ?? course.track;
                const diffName =
                  DIFFICULTY_NAMES[course.difficulty] ?? "Unknown";

                return (
                  <tr
                    key={course.courseId}
                    className="hover:bg-[var(--c-bg-elevated)]/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--c-text)]">
                        {course.title}
                      </div>
                      <div className="text-xs text-[var(--c-text-2)] mt-0.5 line-clamp-1">
                        {course.description || course.courseId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-mono"
                        style={{ color: trackColor }}
                      >
                        {trackLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[var(--c-text-2)]">
                      {course.lessonCount}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[#00FFA3]">
                      {course.xpPerLesson}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[var(--c-text-2)]">
                      {course.totalEnrollments}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {course.isActive ? (
                          <Badge variant="beginner" className="text-[10px]">
                            {t("active")}
                          </Badge>
                        ) : (
                          <Badge variant="advanced" className="text-[10px]">
                            {t("inactive")}
                          </Badge>
                        )}
                        {course.onChain && (
                          <Badge className="text-[10px] bg-[#03E1FF]/10 text-[#03E1FF] border-[#03E1FF]/20">
                            {t("onChain")}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 rounded hover:bg-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors cursor-pointer"
                          aria-label={t("viewCourse")}
                          onClick={() => router.push(`/${locale}/courses/${course.courseId}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors cursor-pointer"
                          aria-label={t("editCourse")}
                          onClick={() => router.push(`/${locale}/admin/courses/${course.courseId}`)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-[var(--c-text-2)]">
          {t("coursesCount", { filtered: filtered.length, total: courses.length })}
        </p>
      </div>
    </div>
  );
}
