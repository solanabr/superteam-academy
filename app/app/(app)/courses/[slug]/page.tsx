"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    BookOpen,
    Sparkles,
    Clock,
    CheckCircle2,
    Circle,
    Lock,
    ChevronLeft,
    Play,
    Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader, ProgressBar } from "@/components/app";
import { getCourseBySlug, getAllLessonsFlat, getCourseIdForProgram } from "@/lib/services/content-service";
import { useEnroll, useEnrollment } from "@/hooks";
import { getLessonFlagsFromEnrollment, countCompletedLessons, isLessonComplete } from "@/lib/lesson-bitmap";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

const difficultyColors = {
    beginner: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    intermediate: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    advanced: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export default function CourseDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    const [course, setCourse] = useState<Awaited<ReturnType<typeof getCourseBySlug>>>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const { publicKey } = useWallet();
    const enroll = useEnroll();
    const { data: enrollment } = useEnrollment(course ? getCourseIdForProgram(course) : null);

    useEffect(() => {
        getCourseBySlug(slug).then((data) => {
            setCourse(data);
            setIsLoading(false);
        });
    }, [slug]);

    if (isLoading) {
        return (
            <div className="space-y-4 sm:space-y-6">
                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                <div className="h-48 sm:h-64 animate-pulse rounded-2xl border-4 border-border bg-card" />
            </div>
        );
    }

    if (!course) return notFound();

    const allLessons = getAllLessonsFlat(course);
    const totalXp = course.lessonCount * course.xpPerLesson;
    const isEnrolled = !!enrollment;
    const lessonFlags = getLessonFlagsFromEnrollment(enrollment ?? undefined);
    const completedCount = lessonFlags.length > 0 ? countCompletedLessons(lessonFlags) : 0;

    const handleEnroll = () => {
        if (!publicKey) {
            toast.error("Connect your wallet to enroll.");
            return;
        }
        enroll.mutate({ courseId: getCourseIdForProgram(course) });
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Back link */}
            <Link
                href="/courses"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-game"
            >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                All Courses
            </Link>

            {/* Course header */}
            <div className="rounded-2xl border-4 border-border bg-card p-4 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className={difficultyColors[course.difficulty]}
                            >
                                {course.difficulty}
                            </Badge>
                            {course.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs border-border font-game">
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        <h1 className="font-game text-2xl tracking-tight lg:text-3xl">
                            {course.title}
                        </h1>
                        <p className="max-w-2xl text-muted-foreground font-game text-lg">
                            {course.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-5 text-lg text-muted-foreground font-game">
                            <span className="inline-flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4" />
                                {course.lessonCount} lessons
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4" />
                                {totalXp} XP
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {course.duration}
                            </span>
                        </div>
                    </div>

                    <div className="shrink-0 w-full lg:w-auto">
                        {isEnrolled ? (
                            <div className="space-y-3">
                                <ProgressBar value={completedCount} max={course.lessonCount} label="Progress" />
                                <Button asChild className="w-full font-game text-lg">
                                    <Link href={`/courses/${slug}/lessons/${allLessons[0]?.id}`}>
                                        <Play className="mr-2 h-4 w-4" />
                                        Continue Learning
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <Button
                                size="lg"
                                onClick={handleEnroll}
                                disabled={enroll.isPending}
                            >
                                {enroll.isPending ? "Enrolling..." : "Enroll Now"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Module/Lesson List */}
            <div className="space-y-4">
                <h2 className="font-game text-2xl">Course Content</h2>

                {course.modules.map((mod, mi) => {
                    const lessonIndexStart = course.modules.slice(0, mi).reduce((sum, m) => sum + m.lessons.length, 0);
                    return (
                        <Card key={mi} className="overflow-hidden border-4 rounded-2xl border-border py-0 gap-0">
                            <div className="border-b border-border bg-muted/30 px-3 sm:px-5 py-3 sm:py-4">
                                <h3 className="font-game text-base sm:text-xl font-semibold tracking-wider break-words">
                                    Module {mi + 1}: {mod.title}
                                </h3>
                                <p className="font-game text-sm text-muted-foreground">
                                    {mod.lessons.length} lesson{mod.lessons.length === 1 ? "" : "s"}
                                </p>
                            </div>
                            <div className="divide-y divide-border">
                                {mod.lessons.map((lesson, li) => {
                                    const flatIndex = lessonIndexStart + li;
                                    const completed = isEnrolled && isLessonComplete(lessonFlags, flatIndex);
                                    return (
                                        <div
                                            key={lesson.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 sm:px-5 py-3 sm:py-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isEnrolled ? (
                                                    completed ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                                    )
                                                ) : (
                                                    <Lock className="h-5 w-5 text-muted-foreground/50" />
                                                )}
                                                <div>
                                                    <p className="text-lg font-medium font-game">{lesson.title}</p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-game">
                                                        {lesson.type === "challenge" ? (
                                                            <span className="inline-flex items-center gap-1">
                                                                <Code2 className="h-4 w-4" /> Challenge
                                                            </span>
                                                        ) : (
                                                            <span>Lesson</span>
                                                        )}
                                                        <span>·</span>
                                                        <span>{lesson.duration}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isEnrolled && (
                                                <Button asChild variant="pixel" size="sm" className="font-game">
                                                    <Link href={`/courses/${slug}/lessons/${lesson.id}`}>
                                                        {completed ? "Review" : "Start"}
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
