"use client";

import { use } from "react";
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
import { getCourseBySlug, getAllLessonsFlat } from "@/lib/services/mock-content";
import { useEnroll, useEnrollment } from "@/hooks";
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
    const course = getCourseBySlug(slug);
    const { publicKey } = useWallet();
    const enroll = useEnroll();
    const { data: enrollment } = useEnrollment(course?.id ?? null);

    if (!course) return notFound();

    const allLessons = getAllLessonsFlat(course);
    const totalXp = course.lessonCount * course.xpPerLesson;
    const isEnrolled = !!enrollment;

    const handleEnroll = () => {
        if (!publicKey) {
            toast.error("Connect your wallet to enroll.");
            return;
        }
        enroll.mutate({ courseId: course.id });
    };

    return (
        <div className="space-y-6">
            {/* Back link */}
            <Link
                href="/courses"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ChevronLeft className="h-4 w-4" />
                All Courses
            </Link>

            {/* Course header */}
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className={difficultyColors[course.difficulty]}
                            >
                                {course.difficulty}
                            </Badge>
                            {course.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                            {course.title}
                        </h1>
                        <p className="max-w-2xl text-muted-foreground">
                            {course.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
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

                    <div className="shrink-0">
                        {isEnrolled ? (
                            <div className="space-y-3">
                                <ProgressBar value={0} max={course.lessonCount} label="Progress" />
                                <Button asChild className="w-full">
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
                <h2 className="text-lg font-semibold">Course Content</h2>

                {course.modules.map((mod, mi) => (
                    <Card key={mi} className="overflow-hidden">
                        <div className="border-b border-border bg-muted/30 px-5 py-3">
                            <h3 className="text-sm font-semibold">
                                Module {mi + 1}: {mod.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {mod.lessons.length} lesson{mod.lessons.length === 1 ? "" : "s"}
                            </p>
                        </div>
                        <div className="divide-y divide-border">
                            {mod.lessons.map((lesson) => (
                                <div
                                    key={lesson.id}
                                    className="flex items-center justify-between px-5 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        {isEnrolled ? (
                                            <Circle className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Lock className="h-4 w-4 text-muted-foreground/50" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">{lesson.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {lesson.type === "challenge" ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Code2 className="h-3 w-3" /> Challenge
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
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/courses/${slug}/lessons/${lesson.id}`}>
                                                Start
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
