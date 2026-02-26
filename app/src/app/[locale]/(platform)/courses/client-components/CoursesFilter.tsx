"use client";

import { useState, useRef, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useEnrollmentStore } from "@/store/enrollment-store";
import type { CourseListItem } from "@/sanity/lib/queries";

const TRACK_OPTIONS = ["all", "rust", "anchor", "security", "solana"];

const DIFFICULTY_ICON_MAP: Record<string, string> = {
    beginner: "bar_chart_4_bars",
    intermediate: "bar_chart",
    advanced: "signal_cellular_alt",
};

const TRACK_ICON_MAP: Record<string, string> = {
    rust: "terminal",
    anchor: "anchor",
    security: "security",
    solana: "code",
};

const TRACK_GRADIENT_MAP: Record<string, string> = {
    rust: "from-rust/10",
    anchor: "from-blue-500/10",
    security: "from-purple-500/10",
    solana: "from-solana/10",
};

const TRACK_ICON_COLOR_MAP: Record<string, string> = {
    rust: "text-rust/40",
    anchor: "text-blue-400/40",
    security: "text-purple-500/40",
    solana: "text-solana/40",
};

export function CoursesFilter({ courses }: { courses: CourseListItem[] }) {
    const t = useTranslations("courses");
    const [filter, setFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Read enrollment progress from store (populated when user is logged in)
    const allEnrollments = useEnrollmentStore((s) => s.allEnrollments);
    const enrollmentMap = Object.fromEntries(
        allEnrollments.map((e) => [e.courseId, e])
    );

    // Debounced search handler
    const handleSearch = useCallback((value: string) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setSearchQuery(value);
        }, 200);
    }, []);

    // Filter: track + full-text search (AND logic)
    const filteredCourses = courses.filter((c) => {
        const matchesTrack =
            filter === "all" || c.track?.toLowerCase() === filter.toLowerCase();
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !query ||
            c.title?.toLowerCase().includes(query) ||
            c.description?.toLowerCase().includes(query);
        return matchesTrack && matchesSearch;
    });

    const resultCount = filteredCourses.length;

    return (
        <>
            {/* Search + Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Search Input */}
                <div className="relative flex-1 max-w-sm">
                    <span className="material-symbols-outlined notranslate absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                        search
                    </span>
                    <input
                        type="text"
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={t("search_courses")}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-1 focus:ring-solana/50 focus:border-solana/30 transition-all"
                    />
                </div>

                {/* Track Filter Buttons */}
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {TRACK_OPTIONS.map((track) => (
                        <Button
                            key={track}
                            variant={filter === track ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(track)}
                            className="uppercase tracking-wider text-[11px] font-mono h-8"
                        >
                            {t(`filters.${track}`)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Result count (shown only when search is active) */}
            {searchQuery.trim() && (
                <p className="text-xs font-mono text-text-muted">
                    {resultCount === 1
                        ? t("results_count", { count: resultCount })
                        : t("results_count_plural", { count: resultCount })}
                </p>
            )}

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-text-secondary">
                        {searchQuery.trim()
                            ? t("no_search_results", { query: searchQuery.trim() })
                            : filter === "all"
                                ? t("none_available")
                                : t("none_found", { filter: t(`filters.${filter}`) })}
                    </div>
                ) : (
                    filteredCourses.map((course) => {
                        const trackKey = course.track?.toLowerCase() ?? "solana";
                        const gradient = TRACK_GRADIENT_MAP[trackKey] ?? TRACK_GRADIENT_MAP.solana;
                        const icon = TRACK_ICON_MAP[trackKey] ?? "code";
                        const iconColor = TRACK_ICON_COLOR_MAP[trackKey] ?? TRACK_ICON_COLOR_MAP.solana;

                        const enrollment = enrollmentMap[course._id];
                        const isEnrolled = !!enrollment;
                        const progressPct = enrollment?.progressPercent ?? 0;
                        const isCompleted = !!enrollment?.completedAt;

                        return (
                            <Link key={course._id} href={`/courses/${course.slug}`}>
                                <div className="glass-panel group rounded-xl overflow-hidden flex flex-col h-full cursor-pointer relative border border-white/5 bg-[#0D0D0E] hover:border-solana/30 hover:bg-white/[0.03] transition-all duration-300">
                                    {/* Completed badge */}
                                    {isCompleted && (
                                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-solana/20 border border-solana/30 rounded-full px-2 py-0.5">
                                            <span className="material-symbols-outlined notranslate text-solana text-[12px]">verified</span>
                                            <span className="text-[10px] font-mono font-bold text-solana uppercase tracking-widest">Completed</span>
                                        </div>
                                    )}

                                    {/* Course Cover */}
                                    <div className={`h-48 w-full relative overflow-hidden bg-gradient-to-br ${gradient} to-void`}>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:scale-105 transition-transform duration-500">
                                            <span className={`material-symbols-outlined notranslate text-[100px] ${iconColor}`}>
                                                {icon}
                                            </span>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] to-transparent opacity-60"></div>

                                        {/* Enrollment progress bar overlay */}
                                        {isEnrolled && !isCompleted && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                                                <div
                                                    className="h-full bg-solana transition-all duration-700"
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 flex flex-col flex-1 gap-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-display text-xl font-bold text-white leading-tight group-hover:text-solana transition-colors">
                                                {course.title}
                                            </h3>
                                            <div className="size-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-solana group-hover:text-void transition-colors flex-shrink-0">
                                                <span className="material-symbols-outlined notranslate text-[18px]">
                                                    {isEnrolled ? "play_arrow" : "arrow_outward"}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-text-secondary text-sm line-clamp-2">
                                            {course.description || "No description available."}
                                        </p>

                                        {/* Progress text for enrolled courses */}
                                        {isEnrolled && !isCompleted && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-solana/60 rounded-full"
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-mono text-solana font-bold whitespace-nowrap">
                                                    {progressPct}%
                                                </span>
                                            </div>
                                        )}

                                        <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-4 text-xs font-mono text-text-secondary">
                                            <span className="flex items-center gap-1.5 text-solana">
                                                <span className="material-symbols-outlined notranslate text-[14px]">
                                                    {DIFFICULTY_ICON_MAP[course.difficulty?.toLowerCase() ?? ""] ?? "bar_chart"}
                                                </span>
                                                {course.difficulty
                                                    ? t(course.difficulty.toLowerCase() as any)
                                                    : t("beginner")}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-[#1F1F1F]"></span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined notranslate text-[14px]">schedule</span>
                                                {course.duration || t("duration_tbd")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </>
    );
}
