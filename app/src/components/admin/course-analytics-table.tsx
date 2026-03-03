"use client";

import Link from "next/link";
import {
  BookOpen,
  Code,
  Users,
  CheckCircle,
  ArrowUpRight,
  ChevronUp,
  ChevronDown,
  Power,
  Pencil,
  Loader2,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTracks } from "@/lib/hooks/use-tracks";
import { useDifficulties } from "@/lib/hooks/use-difficulties";
import { formatXP, difficultyStyle } from "@/lib/utils";
import type { Course } from "@/types";

type SortField = "title" | "enrollments" | "completions" | "rate" | "xp";
type SortDir = "asc" | "desc";

interface CourseAnalyticsTableProps {
  courses: Course[];
}

/** Sort direction indicator icon — declared outside render to avoid re-creation. */
function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field) return null;
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
  );
}

function completionRate(course: Course): number {
  if (course.totalEnrollments === 0) return 0;
  return Math.round((course.totalCompletions / course.totalEnrollments) * 100);
}

export function CourseAnalyticsTable({ courses }: CourseAnalyticsTableProps) {
  const t = useTranslations("admin");
  const TRACKS = useTracks();
  const difficulties = useDifficulties();
  const [sortField, setSortField] = useState<SortField>("enrollments");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const handleToggle = useCallback(async (courseId: string) => {
    setTogglingIds((prev) => new Set(prev).add(courseId));
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) {
        const data = await res.json();
        setToggleStates((prev) => ({ ...prev, [courseId]: data.isActive }));
      }
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  }, []);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const sorted = [...courses].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "title":
        return mul * a.title.localeCompare(b.title);
      case "enrollments":
        return mul * (a.totalEnrollments - b.totalEnrollments);
      case "completions":
        return mul * (a.totalCompletions - b.totalCompletions);
      case "rate":
        return mul * (completionRate(a) - completionRate(b));
      case "xp":
        return mul * (a.xpTotal - b.xpTotal);
      default:
        return 0;
    }
  });

  const thClass =
    "cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors";

  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border/50">
              <th className={thClass} onClick={() => handleSort("title")}>
                {t("course")}
                <SortIcon
                  sortField={sortField}
                  sortDir={sortDir}
                  field="title"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("track")}
              </th>
              <th className={thClass} onClick={() => handleSort("enrollments")}>
                <Users className="mr-1 inline h-3.5 w-3.5" />
                {t("enrollments")}
                <SortIcon
                  sortField={sortField}
                  sortDir={sortDir}
                  field="enrollments"
                />
              </th>
              <th className={thClass} onClick={() => handleSort("completions")}>
                <CheckCircle className="mr-1 inline h-3.5 w-3.5" />
                {t("completions")}
                <SortIcon
                  sortField={sortField}
                  sortDir={sortDir}
                  field="completions"
                />
              </th>
              <th className={thClass} onClick={() => handleSort("rate")}>
                {t("completionRate")}
                <SortIcon
                  sortField={sortField}
                  sortDir={sortDir}
                  field="rate"
                />
              </th>
              <th className={thClass} onClick={() => handleSort("xp")}>
                {t("xpAvailable")}
                <SortIcon sortField={sortField} sortDir={sortDir} field="xp" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {sorted.map((course) => {
              const rate = completionRate(course);
              const track = TRACKS[course.trackId];
              return (
                <tr
                  key={course.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                        {course.challengeCount > 0 ? (
                          <Code className="h-4 w-4 text-brazil-teal" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-st-green" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium leading-tight">
                          {course.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={difficultyStyle(
                              difficulties.find(
                                (d) => d.value === course.difficulty,
                              )?.color ?? "#888",
                            )}
                          >
                            {difficulties.find(
                              (d) => d.value === course.difficulty,
                            )?.label ?? course.difficulty}
                          </span>
                          <span>
                            {course.lessonCount} {t("lessons")} ·{" "}
                            {course.challengeCount} {t("challenges")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${track?.color ?? "#666"}20`,
                        color: track?.color ?? "#666",
                      }}
                    >
                      {track?.display ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {course.totalEnrollments.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {course.totalCompletions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            rate >= 70
                              ? "bg-brazil-green"
                              : rate >= 40
                                ? "bg-brazil-gold"
                                : "bg-brazil-coral"
                          }`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-xp">
                    {formatXP(course.xpTotal)} XP
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggle(course.id)}
                        disabled={togglingIds.has(course.id)}
                        className={`rounded-md p-1.5 transition-colors hover:bg-muted ${
                          (toggleStates[course.id] ?? course.isActive)
                            ? "text-brazil-green"
                            : "text-muted-foreground"
                        }`}
                        title={t("toggleActive")}
                      >
                        {togglingIds.has(course.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>
                      <Link
                        href={`/cms/collections/courses/${course.id}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title={t("editInCMS")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title={t("viewCourse")}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
