"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { CourseListItem } from "@/sanity/lib/queries";

export function CoursesFilter({ courses }: { courses: CourseListItem[] }) {
    const t = useTranslations("courses");
    const [filter, setFilter] = useState<string>("all");

    const tracks = ["all", "rust", "anchor", "security", "solana"];

    // Filter courses by track
    const filteredCourses = filter === "all"
        ? courses
        : courses.filter(c => c.track?.toLowerCase() === filter.toLowerCase());

    const getDifficultyIcon = (difficulty?: string) => {
        switch (difficulty?.toLowerCase()) {
            case "beginner": return "bar_chart_4_bars";
            case "intermediate": return "bar_chart";
            case "advanced": return "signal_cellular_alt";
            default: return "bar_chart";
        }
    };

    return (
        <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 no-scrollbar">
                {tracks.map((track) => (
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

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-text-secondary">
                        {filter === "all" ? t("none_available") : t("none_found", { filter: t(`filters.${filter}`) })}
                    </div>
                ) : (
                    filteredCourses.map((course) => (
                        <Link key={course._id} href={`/courses/${course.slug}`}>
                            <div className="glass-panel group rounded-xl overflow-hidden flex flex-col h-full cursor-pointer relative border border-white/5 bg-[#0D0D0E] hover:border-solana/30 hover:bg-white/[0.03] transition-all duration-300">
                                <div className={`h-48 w-full relative overflow-hidden bg-gradient-to-br ${course.track === "rust" ? "from-rust/10" : course.track === "solana" ? "from-solana/10" : "from-purple-500/10"} to-void`}>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:scale-105 transition-transform duration-500">
                                        <span className={`material-symbols-outlined notranslate text-[100px] ${course.track === "rust" ? "text-rust/40" : course.track === "solana" ? "text-solana/40" : "text-purple-500/40"}`}>
                                            {course.track === "rust" ? "terminal" : course.track === "anchor" ? "anchor" : "code"}
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] to-transparent opacity-60"></div>
                                </div>
                                <div className="p-5 flex flex-col flex-1 gap-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-display text-xl font-bold text-white leading-tight group-hover:text-solana transition-colors">{course.title}</h3>
                                        <div className="size-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-solana group-hover:text-void transition-colors">
                                            <span className="material-symbols-outlined notranslate text-[18px]">arrow_outward</span>
                                        </div>
                                    </div>
                                    <p className="text-text-secondary text-sm line-clamp-2">{course.description || "No description available."}</p>
                                    <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-4 text-xs font-mono text-text-secondary">
                                        <span className="flex items-center gap-1.5 text-solana">
                                            <span className="material-symbols-outlined notranslate text-[14px]">{getDifficultyIcon(course.difficulty)}</span>
                                            {course.difficulty ? t(course.difficulty.toLowerCase() as any) : t("beginner")}
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
                    ))
                )}
            </div>
        </>
    );
}
