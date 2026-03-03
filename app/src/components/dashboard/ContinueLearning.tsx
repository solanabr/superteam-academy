"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { AllEnrollmentItem } from "@/store/enrollment-store";
import type { CourseListItem } from "@/sanity/lib/queries";
import { ArrowRight, Terminal, Anchor, Shield, Code2, GraduationCap } from "lucide-react";

const TRACK_COLORS: Record<string, string> = {
    rust: "from-rust/20 to-void border-rust/20 text-rust",
    anchor: "from-blue-500/20 to-void border-blue-500/20 text-blue-400",
    security: "from-purple-500/20 to-void border-purple-500/20 text-purple-400",
    solana: "from-solana/20 to-void border-solana/20 text-solana",
};

const REC_TRACK_COLORS: Record<string, string> = {
    rust: "text-rust border-rust/20 bg-rust/10",
    anchor: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    security: "text-purple-400 border-purple-500/20 bg-purple-500/10",
    solana: "text-solana border-solana/20 bg-solana/10",
};

const TRACK_ICONS: Record<string, any> = {
    rust: Terminal,
    anchor: Anchor,
    security: Shield,
    solana: Code2,
};

type Props = {
    enrollments: AllEnrollmentItem[];
    isLoading: boolean;
    allCourses: CourseListItem[];
};

export function ContinueLearning({ enrollments, isLoading, allCourses }: Props) {
    const t = useTranslations("dashboard");

    // Only in-progress courses (not completed)
    const inProgress = enrollments
        .filter((e) => !e.completedAt)
        .slice(0, 3);

    if (isLoading) {
        return (
            <section>
                <h3 className="text-lg font-display font-semibold text-white mb-4 uppercase tracking-[0.1em] text-[15px] opacity-80">
                    {t("continue_learning")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="glass-panel rounded-xl p-5 border border-white/5 animate-pulse h-36"
                        />
                    ))}
                </div>
            </section>
        );
    }

    if (inProgress.length === 0) {
        const enrolledIds = new Set(enrollments.map((e) => e.courseId));
        const learningTracks = new Set(
            enrollments.map((e) => e.track?.toLowerCase()).filter(Boolean) as string[]
        );

        // Filter and Rank: same track first, then by difficulty
        const DIFFICULTY_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
        const recommended = allCourses
            .filter((c) => !enrolledIds.has(c._id))
            .map((c) => ({
                course: c,
                score: (learningTracks.has(c.track?.toLowerCase() ?? "") ? 2 : 0) +
                    (1 - (DIFFICULTY_ORDER[c.difficulty?.toLowerCase() ?? "beginner"] ?? 0) * 0.1),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((s) => s.course);

        return (
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-display font-semibold text-white uppercase tracking-[0.1em] text-[15px] opacity-80">
                        {recommended.length > 0 ? t("recommended_courses") : t("continue_learning")}
                    </h3>
                    <Link
                        href="/courses"
                        prefetch={true}
                        className="text-[10px] font-mono text-text-muted hover:text-solana transition-colors uppercase tracking-[0.2em] font-bold"
                    >
                        {t("browse_courses")} →
                    </Link>
                </div>

                {recommended.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommended.map((course) => {
                            const trackKey = course.track?.toLowerCase() ?? "solana";
                            const trackColor = REC_TRACK_COLORS[trackKey] ?? REC_TRACK_COLORS.solana;

                            return (
                                <Link
                                    key={course._id}
                                    href={`/courses/${course.slug}`}
                                    prefetch={true}
                                    className="group glass-panel rounded-xl p-5 border border-white/5 hover:border-solana/30 transition-all duration-300 flex flex-col gap-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <p className="text-sm font-display font-semibold text-white leading-tight line-clamp-2 group-hover:text-solana transition-colors">
                                                {course.title}
                                            </p>
                                            {course.difficulty && (
                                                <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                                                    {course.difficulty}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between gap-2">
                                        {course.track && (
                                            <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border ${trackColor}`}>
                                                {course.track}
                                            </span>
                                        )}
                                        <span className="text-[10px] font-mono text-text-muted group-hover:text-solana transition-colors flex items-center gap-0.5 font-bold uppercase tracking-wider">
                                            Enroll
                                            <ArrowRight size={12} className="ml-0.5" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="glass-panel rounded-xl p-8 border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                        <div className="size-12 rounded-full bg-white/5 flex items-center justify-center">
                            <GraduationCap size={24} className="text-text-muted" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-white font-medium">{t("no_enrollments")}</p>
                            <p className="text-xs text-text-muted max-w-[280px]">
                                Start your journey by exploring our curriculum and enrolling in your first course.
                            </p>
                        </div>
                    </div>
                )}
            </section>
        );
    }

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold text-white">
                    {t("continue_learning")}
                </h3>
                <Link
                    href="/courses"
                    prefetch={true}
                    className="text-xs font-mono text-text-muted hover:text-solana transition-colors uppercase tracking-widest"
                >
                    {t("browse_courses")} →
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgress.map((course) => {
                    const trackKey = course.track?.toLowerCase() ?? "solana";
                    const colorClass = TRACK_COLORS[trackKey] ?? TRACK_COLORS.solana;
                    const Icon = TRACK_ICONS[trackKey] ?? Code2;

                    return (
                        <Link
                            key={course.courseId}
                            href={`/courses/${course.slug}`}
                            prefetch={true}
                            className="group glass-panel rounded-xl p-5 border border-white/5 hover:border-solana/30 transition-all duration-300 flex flex-col gap-3 relative overflow-hidden"
                        >
                            {/* Track accent */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]} opacity-40 pointer-events-none`}
                            />

                            <div className="relative flex items-start gap-3">
                                <div className="flex-shrink-0 size-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                    <Icon size={18} className="text-text-secondary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-display font-semibold text-white leading-tight line-clamp-2 group-hover:text-solana transition-colors">
                                        {course.title}
                                    </p>
                                    {course.difficulty && (
                                        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                                            {course.difficulty}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="relative space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-text-muted font-mono">
                                        {course.completedLessons}/{course.totalLessons || "?"} lessons
                                    </span>
                                    <span className="text-xs font-mono font-bold text-solana">
                                        {course.progressPercent}%
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-solana rounded-full transition-all duration-700"
                                        style={{ width: `${course.progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Continue CTA */}
                            <div className="flex items-center justify-end">
                                <span className="text-[10px] font-mono text-solana/70 group-hover:text-solana flex items-center gap-1 transition-colors uppercase tracking-widest">
                                    Continue
                                    <ArrowRight size={14} />
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
