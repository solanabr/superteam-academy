"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { toast } from "sonner";
import type { CourseAnalytics } from "@/types/admin";
import { Search, ChevronDown, ChevronUp, Users, GraduationCap, Zap, EyeOff, Eye, Trash2 } from "lucide-react";

interface CourseTableProps {
  courses: CourseAnalytics[];
  loading: boolean;
  onRefresh?: () => void;
}

const difficultyLabels: Record<number, string> = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
const difficultyColors: Record<number, string> = {
  1: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  2: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  3: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  pending_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
  hidden: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  hidden: "Hidden",
};

function getEffectiveStatus(course: CourseAnalytics): string {
  if (course.isActive === false) return "hidden";
  return course.status ?? "approved";
}

type SortField = "enrollments" | "completions" | "completionRate" | "avgProgress" | "xpGenerated";

export function CourseTable({ courses, loading, onRefresh }: CourseTableProps) {
  const [sortBy, setSortBy] = useState<SortField>("enrollments");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getToken = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const handleToggleHide = async (courseId: string, isApproved: boolean) => {
    setActingOn(courseId);
    try {
      const token = await getToken();
      // For approved courses, hide them. For hidden ones (status approved but isActive false), show them.
      const res = await fetch(`/api/admin/courses/${courseId}/hide`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: isApproved }),
      });
      if (res.ok) {
        toast.success(isApproved ? "Course hidden" : "Course is now visible");
        onRefresh?.();
      } else {
        const { error } = await res.json();
        toast.error(error ?? "Failed to update visibility");
      }
    } catch {
      toast.error("Failed to update visibility");
    } finally {
      setActingOn(null);
    }
  };

  const handleDelete = async (courseId: string) => {
    setActingOn(courseId);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/courses/${courseId}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Course deleted permanently");
        onRefresh?.();
      } else {
        const { error } = await res.json();
        toast.error(error ?? "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setActingOn(null);
      setDeleteConfirmId(null);
    }
  };

  const filtered = useMemo(() => {
    let result = [...courses];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }
    if (filterDifficulty !== null) {
      result = result.filter((c) => c.difficulty === filterDifficulty);
    }
    if (filterStatus !== null) {
      result = result.filter((c) => getEffectiveStatus(c) === filterStatus);
    }
    result.sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
    return result;
  }, [courses, searchQuery, filterDifficulty, filterStatus, sortBy, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortBy !== field) return null;
    return sortDir === "desc" ? (
      <ChevronDown className="h-3 w-3 inline ml-0.5" />
    ) : (
      <ChevronUp className="h-3 w-3 inline ml-0.5" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Course Performance</h3>
          <p className="text-sm text-muted-foreground">
            Enrollment, completion, and engagement metrics per course
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[null, "approved", "hidden", "pending_review", "rejected", "draft"].map((s) => (
              <button
                key={s ?? "all"}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  filterStatus === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent border-border"
                }`}
              >
                {s === null ? "All" : statusLabels[s] ?? s}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {[null, 1, 2, 3].map((d) => (
              <button
                key={d ?? "all"}
                onClick={() => setFilterDifficulty(d)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  filterDifficulty === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent border-border"
                }`}
              >
                {d === null ? "All" : difficultyLabels[d]}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-52"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Course</th>
                <th className="py-2 pr-3">Status</th>
                <th
                  className="py-2 pr-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("enrollments")}
                >
                  <Users className="h-3.5 w-3.5 inline mr-1" />
                  Enrolled
                  {sortIcon("enrollments")}
                </th>
                <th
                  className="py-2 pr-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("completions")}
                >
                  <GraduationCap className="h-3.5 w-3.5 inline mr-1" />
                  Completed
                  {sortIcon("completions")}
                </th>
                <th
                  className="py-2 pr-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("completionRate")}
                >
                  Rate
                  {sortIcon("completionRate")}
                </th>
                <th
                  className="py-2 pr-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("avgProgress")}
                >
                  Avg Progress
                  {sortIcon("avgProgress")}
                </th>
                <th
                  className="py-2 pr-3 cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => toggleSort("xpGenerated")}
                >
                  <Zap className="h-3.5 w-3.5 inline mr-1" />
                  XP
                  {sortIcon("xpGenerated")}
                </th>
                <th className="py-2 pr-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((course) => {
                const effectivelyActive = course.isActive !== false;
                return (
                <tr
                  key={course.courseId}
                  className="border-b border-border/50 hover:bg-accent/30"
                >
                  <td className="py-3 pr-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[250px]">{course.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className={difficultyColors[course.difficulty] ?? ""} variant="outline">
                          {difficultyLabels[course.difficulty] ?? "N/A"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {course.lessonCount} lessons
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    {(() => {
                      const effectiveStatus = getEffectiveStatus(course);
                      return (
                        <Badge className={statusColors[effectiveStatus] ?? ""} variant="outline">
                          {statusLabels[effectiveStatus] ?? effectiveStatus}
                        </Badge>
                      );
                    })()}
                  </td>
                  <td className="py-3 pr-3 tabular-nums font-medium">{course.enrollments}</td>
                  <td className="py-3 pr-3 tabular-nums">{course.completions}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={`tabular-nums font-medium ${
                        course.completionRate >= 50
                          ? "text-emerald-600 dark:text-emerald-400"
                          : course.completionRate >= 25
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {course.completionRate}%
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <Progress value={course.avgProgress} className="h-1.5 w-16" />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {course.avgProgress}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 tabular-nums">
                    {course.xpGenerated.toLocaleString()}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={actingOn === course.courseId}
                        title={effectivelyActive ? "Hide course" : "Show course"}
                        onClick={() => handleToggleHide(course.courseId, effectivelyActive)}
                      >
                        {effectivelyActive ? (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>

                      {deleteConfirmId === course.courseId ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs px-2"
                            disabled={actingOn === course.courseId}
                            onClick={() => handleDelete(course.courseId)}
                          >
                            {actingOn === course.courseId ? "..." : "Yes"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            disabled={actingOn === course.courseId}
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={actingOn === course.courseId}
                          title="Delete course"
                          onClick={() => setDeleteConfirmId(course.courseId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No courses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
