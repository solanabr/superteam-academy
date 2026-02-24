"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { CourseAnalytics } from "@/types/admin";
import { Search, ChevronDown, ChevronUp, Users, GraduationCap, Zap } from "lucide-react";

interface CourseTableProps {
  courses: CourseAnalytics[];
  loading: boolean;
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
};

type SortField = "enrollments" | "completions" | "completionRate" | "avgProgress" | "xpGenerated";

export function CourseTable({ courses, loading }: CourseTableProps) {
  const [sortBy, setSortBy] = useState<SortField>("enrollments");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let result = [...courses];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }
    if (filterDifficulty !== null) {
      result = result.filter((c) => c.difficulty === filterDifficulty);
    }
    result.sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
    return result;
  }, [courses, searchQuery, filterDifficulty, sortBy, sortDir]);

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
              </tr>
            </thead>
            <tbody>
              {filtered.map((course) => (
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
                    <Badge className={statusColors[course.status] ?? ""} variant="outline">
                      {course.status?.replace("_", " ") ?? "—"}
                    </Badge>
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
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
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
