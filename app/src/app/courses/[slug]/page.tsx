"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import {
    BookOpen,
    Clock,
    Zap,
    Star,
    ChevronDown,
    ChevronRight,
    Check,
    Lock,
    Play,
    Code,
    Users,
    Award,
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { CourseService, LearningProgressService } from "@/services";

export default function CourseDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    const t = useTranslations("courses");
    const tCommon = useTranslations("common");
    const { connected, publicKey } = useWallet();
    const { setVisible } = useWalletModal();
    const [expandedModule, setExpandedModule] = useState<string | null>("m1");
    const [enrolling, setEnrolling] = useState(false);

    const course = CourseService.getCourseBySlug(slug);
    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Course not found</p>
            </div>
        );
    }

    const totalLessons = course.modules.reduce(
        (sum, m) => sum + m.lessons.length,
        0
    );

    const handleEnroll = async () => {
        if (!connected) {
            setVisible(true);
            return;
        }
        setEnrolling(true);
        await LearningProgressService.enrollInCourse(
            publicKey?.toBase58() || "",
            course.courseId
        );
        setEnrolling(false);
    };

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative py-16 overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(135deg, ${course.trackColor}15 0%, transparent 60%)`,
                    }}
                />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Course Info */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <span
                                    className="px-2 py-1 rounded-md text-xs font-medium"
                                    style={{
                                        backgroundColor: `${course.trackColor}20`,
                                        color: course.trackColor,
                                    }}
                                >
                                    {course.track}
                                </span>
                                <span
                                    className={cn(
                                        "px-2 py-1 rounded-md text-xs font-medium",
                                        course.difficulty === "beginner" &&
                                        "bg-emerald-500/20 text-emerald-400",
                                        course.difficulty === "intermediate" &&
                                        "bg-amber-500/20 text-amber-400",
                                        course.difficulty === "advanced" &&
                                        "bg-red-500/20 text-red-400"
                                    )}
                                >
                                    {course.difficulty}
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                                {course.title}
                            </h1>
                            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                {course.longDescription}
                            </p>

                            {/* Instructor */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                    {course.instructor.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </div>
                                <div>
                                    <div className="font-medium text-sm">
                                        {course.instructor.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {course.instructor.title}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4" />
                                    {totalLessons} {t("lessons")}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    {formatDuration(course.duration)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4" />
                                    {course.enrolledCount.toLocaleString()} {t("enrolled")}
                                </span>
                                <span className="flex items-center gap-1.5 text-amber-400">
                                    <Star className="w-4 h-4 fill-amber-400" />
                                    {course.rating}
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-400">
                                    <Zap className="w-4 h-4" />+{course.xpReward} XP
                                </span>
                            </div>
                        </div>

                        {/* Sidebar Card */}
                        <div className="lg:col-span-1">
                            <div className="glass rounded-2xl p-6 sticky top-24">
                                {/* Thumbnail */}
                                <div
                                    className="h-36 rounded-xl mb-5 flex items-center justify-center"
                                    style={{
                                        background: `linear-gradient(135deg, ${course.trackColor}30 0%, ${course.trackColor}10 100%)`,
                                    }}
                                >
                                    <Award className="w-12 h-12 opacity-30" style={{ color: course.trackColor }} />
                                </div>

                                <button
                                    onClick={handleEnroll}
                                    disabled={enrolling}
                                    className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 disabled:opacity-50 mb-4"
                                >
                                    {enrolling
                                        ? tCommon("loading")
                                        : connected
                                            ? t("enrollNow")
                                            : tCommon("connectWallet")}
                                </button>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("difficulty")}</span>
                                        <span className="font-medium capitalize">{course.difficulty}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("duration")}</span>
                                        <span className="font-medium">{formatDuration(course.duration)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("lessons")}</span>
                                        <span className="font-medium">{totalLessons}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("xpReward")}</span>
                                        <span className="font-medium text-emerald-400">+{course.xpReward}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("prerequisites")}</span>
                                        <span className="font-medium">
                                            {course.prerequisites.length > 0
                                                ? course.prerequisites.join(", ")
                                                : t("noPrerequisites")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Course Content */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Objectives */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4">{t("whatYouLearn")}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {course.objectives.map((obj, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-muted-foreground">{obj}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modules */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4">{t("modules")}</h2>
                            <div className="space-y-3">
                                {course.modules.map((mod) => (
                                    <div key={mod.id} className="glass rounded-xl overflow-hidden">
                                        <button
                                            onClick={() =>
                                                setExpandedModule(
                                                    expandedModule === mod.id ? null : mod.id
                                                )
                                            }
                                            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <ChevronDown
                                                    className={cn(
                                                        "w-4 h-4 transition-transform",
                                                        expandedModule === mod.id && "rotate-180"
                                                    )}
                                                />
                                                <div className="text-left">
                                                    <h3 className="font-medium text-sm">{mod.title}</h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {mod.lessons.length} lessons
                                                    </p>
                                                </div>
                                            </div>
                                        </button>

                                        {expandedModule === mod.id && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: "auto" }}
                                                className="border-t border-border"
                                            >
                                                {mod.lessons.map((lesson) => (
                                                    <Link
                                                        key={lesson.id}
                                                        href={`/courses/${slug}/lessons/${lesson.id}`}
                                                        className="flex items-center gap-3 px-6 py-3 hover:bg-secondary/20 transition-colors border-b border-border last:border-0"
                                                    >
                                                        {lesson.type === "challenge" ? (
                                                            <Code className="w-4 h-4 text-amber-400" />
                                                        ) : (
                                                            <Play className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium">
                                                                {lesson.title}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatDuration(lesson.duration)} &middot; +{lesson.xpReward} XP
                                                            </div>
                                                        </div>
                                                        {lesson.type === "challenge" && (
                                                            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                                                                Challenge
                                                            </span>
                                                        )}
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                    </Link>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
