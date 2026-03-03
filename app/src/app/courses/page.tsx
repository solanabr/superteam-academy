"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Search, BookOpen, Clock, Zap, Star, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseService } from "@/services";

const difficulties = ["all", "beginner", "intermediate", "advanced"] as const;

export default function CoursesPage() {
    const t = useTranslations("courses");
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState<string>("all");

    const courses = useMemo(
        () => CourseService.filterCourses({ difficulty, search }),
        [difficulty, search]
    );

    const difficultyLabels: Record<string, string> = {
        all: t("filterAll"),
        beginner: t("filterBeginner"),
        intermediate: t("filterIntermediate"),
        advanced: t("filterAdvanced"),
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <section className="relative py-16 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4">{t("title")}</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">{t("subtitle")}</p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("searchPlaceholder")}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Difficulty Filter */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-border">
                        <Filter className="w-4 h-4 text-muted-foreground ml-2 mr-1" />
                        {difficulties.map((d) => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    difficulty === d
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                {difficultyLabels[d]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Course Grid */}
                {courses.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">{t("noResults")}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course, i) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link
                                    href={`/courses/${course.slug}`}
                                    className="group block rounded-2xl overflow-hidden glass card-hover h-full"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-40 overflow-hidden">
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                background: `linear-gradient(135deg, ${course.trackColor}40 0%, ${course.trackColor}10 100%)`,
                                            }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <BookOpen className="w-14 h-14 opacity-20" style={{ color: course.trackColor }} />
                                        </div>
                                        <div className="absolute top-3 left-3">
                                            <span
                                                className={cn(
                                                    "px-2 py-1 rounded-md text-xs font-medium",
                                                    course.difficulty === "beginner" && "bg-emerald-500/20 text-emerald-400",
                                                    course.difficulty === "intermediate" && "bg-amber-500/20 text-amber-400",
                                                    course.difficulty === "advanced" && "bg-red-500/20 text-red-400"
                                                )}
                                            >
                                                {difficultyLabels[course.difficulty]}
                                            </span>
                                        </div>
                                        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs bg-black/30 text-white px-2 py-1 rounded-md backdrop-blur-sm">
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            {course.rating}
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="text-xs font-medium mb-1" style={{ color: course.trackColor }}>
                                            {course.track}
                                        </div>
                                        <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                                            {course.description}
                                        </p>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" />
                                                    {course.lessonCount} {t("lessons")}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {Math.floor(course.duration / 60)}h
                                                </span>
                                            </div>
                                            <span className="flex items-center gap-1 font-medium text-emerald-400">
                                                <Zap className="w-3 h-3" />
                                                +{course.xpReward}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
