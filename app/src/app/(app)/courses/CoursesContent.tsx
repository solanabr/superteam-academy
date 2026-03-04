"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { getLearningProgressService } from "@/lib/services/learning-progress";
import { CloseEnrollmentButton } from "@/components/course/CloseEnrollmentButton";
import type { Course, Track } from "@/lib/cms/schemas";
import type { Enrollment } from "@/lib/types/learning";

type SortOption = "newest" | "difficulty" | "duration";
type DifficultyFilter = "all" | "beginner" | "intermediate" | "advanced";

const DIFFICULTY_ORDER: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

function parseDurationMinutes(duration: string | undefined): number {
  if (!duration) return 0;
  const hours = duration.match(/(\d+)\s*h/i);
  const mins = duration.match(/(\d+)\s*m/i);
  return (hours ? parseInt(hours[1]) * 60 : 0) + (mins ? parseInt(mins[1]) : 0);
}

export function CoursesContent({
  courses,
  tracks,
  initialQuery,
}: {
  courses: Course[];
  tracks: Track[];
  initialQuery?: string;
}) {
  const { t } = useI18n();
  const { user } = useAuth();

  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyFilter>("all");
  const [enrolledOnly, setEnrolledOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(
    new Set()
  );
  const [enrollmentMap, setEnrollmentMap] = useState<Map<string, Enrollment>>(
    new Map()
  );

  useEffect(() => {
    if (!user) return;
    const service = getLearningProgressService();
    service.getEnrollments(user.id).then((enrollments) => {
      setEnrolledCourseIds(new Set(enrollments.map((e) => e.courseId)));
      setEnrollmentMap(new Map(enrollments.map((e) => [e.courseId, e])));
    });
  }, [user]);

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Track filter
    if (activeTrack) {
      result = result.filter((c) => c.track?._id === activeTrack);
    }

    // Difficulty filter
    if (activeDifficulty !== "all") {
      result = result.filter((c) => c.difficulty === activeDifficulty);
    }

    // Enrolled filter
    if (enrolledOnly) {
      result = result.filter((c) => enrolledCourseIds.has(c._id));
    }

    // Sort
    switch (sortBy) {
      case "difficulty":
        result.sort(
          (a, b) =>
            (DIFFICULTY_ORDER[a.difficulty] ?? 1) -
            (DIFFICULTY_ORDER[b.difficulty] ?? 1)
        );
        break;
      case "duration":
        result.sort(
          (a, b) =>
            parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration)
        );
        break;
      case "newest":
      default:
        break;
    }

    return result;
  }, [courses, activeTrack, activeDifficulty, enrolledOnly, sortBy, enrolledCourseIds, searchQuery]);

  const handleUnenrolled = (courseId: string) => {
    setEnrolledCourseIds((prev) => {
      const next = new Set(prev);
      next.delete(courseId);
      return next;
    });
    setEnrollmentMap((prev) => {
      const next = new Map(prev);
      next.delete(courseId);
      return next;
    });
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
          {t("courses.title")}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-base leading-relaxed">
          {t("courses.subtitle")}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search courses..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Track filters */}
        <button
          onClick={() => setActiveTrack(null)}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
            activeTrack === null
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
              : "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          {t("courses.all")}
        </button>
        {tracks.map((track) => (
          <button
            key={track._id}
            onClick={() =>
              setActiveTrack(activeTrack === track._id ? null : track._id)
            }
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              activeTrack === track._id
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                : "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            {track.title}
          </button>
        ))}

        {/* Separator */}
        <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 hidden sm:block" />

        {/* Difficulty filters */}
        {(["beginner", "intermediate", "advanced"] as const).map((diff) => (
          <button
            key={diff}
            onClick={() => setActiveDifficulty(activeDifficulty === diff ? "all" : diff)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors capitalize ${
              activeDifficulty === diff
                ? diff === "beginner"
                  ? "bg-emerald-600 text-white"
                  : diff === "intermediate"
                  ? "bg-amber-600 text-white"
                  : "bg-rose-600 text-white"
                : "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            {diff}
          </button>
        ))}

        {/* Separator */}
        <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 hidden sm:block" />

        {/* Enrolled toggle */}
        {user && (
          <button
            onClick={() => setEnrolledOnly(!enrolledOnly)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              enrolledOnly
                ? "bg-emerald-600 text-white"
                : "border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Enrolled
          </button>
        )}

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="ml-auto px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-600 dark:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
        >
          <option value="newest">Newest</option>
          <option value="difficulty">Difficulty</option>
          <option value="duration">Duration</option>
        </select>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {filteredCourses.length} result{filteredCourses.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
        </p>
      )}

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-neutral-400 text-lg mb-2">
            {searchQuery
              ? `No courses matching "${searchQuery}"`
              : enrolledOnly
              ? "No enrolled courses found"
              : t("courses.noCourses")}
          </p>
          <p className="text-neutral-400 text-sm">{t("courses.checkBack")}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              isEnrolled={enrolledCourseIds.has(course._id)}
              progressPercent={enrollmentMap.get(course._id)?.completionPercent}
              onUnenrolled={() => handleUnenrolled(course._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  isEnrolled,
  progressPercent,
  onUnenrolled,
}: {
  course: Course;
  isEnrolled: boolean;
  progressPercent?: number;
  onUnenrolled?: () => void;
}) {
  const { t } = useI18n();

  const difficultyColors: Record<string, string> = {
    beginner:
      "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    intermediate:
      "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    advanced:
      "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  };

  return (
    <div className="group">
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg transition-all duration-300 h-full flex flex-col relative">
        {/* Enrolled badge */}
        {isEnrolled && (
          <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
            Enrolled
          </span>
        )}

        {/* Thumbnail Placeholder */}
        <div className="w-full h-40 rounded-xl bg-gradient-to-br from-neutral-100 dark:from-neutral-800 to-neutral-50 dark:to-neutral-900 mb-5 flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
          <div className="text-5xl opacity-20">
            {course.difficulty === "beginner"
              ? "S"
              : course.difficulty === "advanced"
              ? "A"
              : "I"}
          </div>
        </div>

        {/* Track & Difficulty */}
        <div className="flex items-center gap-2 mb-3">
          {course.track && (
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">
              {course.track.title}
            </span>
          )}
          {course.difficulty && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                difficultyColors[course.difficulty] ||
                "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
              }`}
            >
              {course.difficulty}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-semibold mb-2 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors leading-tight">
          {course.title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4 flex-1 line-clamp-3">
          {course.description}
        </p>

        {/* Progress bar for enrolled courses */}
        {isEnrolled && progressPercent !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
              <span>Progress</span>
              <span className="font-mono font-semibold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            {course.duration && (
              <span className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {course.duration}
              </span>
            )}
            {course.moduleCount !== undefined && (
              <span>
                {course.moduleCount} {t("courses.modules")}
              </span>
            )}
          </div>
          {course.xpReward && (
            <span className="font-mono font-semibold text-neutral-600 dark:text-neutral-300">
              +{course.xpReward} XP
            </span>
          )}
        </div>

        <div className="pt-3 flex items-center justify-between gap-2">
          <Link
            href={`/courses/${course.slug?.current ?? course._id}`}
            className="px-3 py-1.5 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 rounded-full transition-colors"
          >
            Open Course
          </Link>
          {isEnrolled && (
            <CloseEnrollmentButton
              courseId={course._id}
              courseSlug={course.slug?.current}
              onChainCourseId={course.onChainCourseId}
              onClosed={onUnenrolled}
              className="px-3 py-1.5 text-[11px] font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          )}
        </div>
      </div>
    </div>
  );
}
