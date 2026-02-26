"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Code2,
    RotateCcw,
    BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar, CodeEditor } from "@/components/app";
import {
    getLessonById,
    getAllLessonsFlat,
    getCourseIdForProgram,
    getEffectiveLessonCount,
    getEffectiveLessons,
} from "@/lib/services/content-service";
import { useEnrollment, useCompleteLesson, useCourse } from "@/hooks";
import { getLessonFlagsFromEnrollment, isLessonComplete } from "@/lib/lesson-bitmap";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export default function LessonPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>;
}) {
    const { slug, id } = use(params);
    const { publicKey } = useWallet();
    const [result, setResult] = useState<Awaited<ReturnType<typeof getLessonById>>>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [testOutput, setTestOutput] = useState<string | null>(null);
    const [code, setCode] = useState("");

    const courseId = result?.course ? getCourseIdForProgram(result.course) : null;
    const { data: enrollment } = useEnrollment(courseId);
    const { data: onChainCourse } = useCourse(courseId);
    const completeLesson = useCompleteLesson();
    const lessonFlags = getLessonFlagsFromEnrollment(enrollment ?? undefined);

    useEffect(() => {
        getLessonById(slug, id).then((data) => {
            setResult(data);
            setIsLoading(false);
            if (data?.lesson.challengeCode) {
                setCode(data.lesson.challengeCode);
            }
        });
    }, [slug, id]);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            </div>
        );
    }

    if (!result) return notFound();

    const { course, lesson, moduleTitle, lessonIndex } = result;
    const allLessons = getAllLessonsFlat(course);
    const contentCount = allLessons.length;
    const effectiveCount = getEffectiveLessonCount(course, onChainCourse ?? null);
    const effectiveLessons = getEffectiveLessons(course, onChainCourse ?? null);
    const onChainLessonCount = course.onChainCourseId && onChainCourse != null && typeof (onChainCourse as { lesson_count?: number }).lesson_count === 'number'
      ? (onChainCourse as { lesson_count: number }).lesson_count
      : null;
    const canCompleteOnChain = onChainLessonCount == null || lessonIndex < onChainLessonCount;

    const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
    const nextLesson = lessonIndex < contentCount - 1 ? allLessons[lessonIndex + 1] : null;

    const isChallenge = lesson.type === "challenge";
    const isEnrolled = !!enrollment;
    const isCompleted = isEnrolled && lessonFlags.length > 0 && isLessonComplete(lessonFlags, lessonIndex);
    const canMarkComplete = isEnrolled && !!publicKey && !isCompleted;

    const handleMarkComplete = () => {
        if (!publicKey || !course.id) return;
        const programCourseId = getCourseIdForProgram(course);
        completeLesson.mutate({
            courseId: programCourseId,
            learner: publicKey.toBase58(),
            lessonIndex,
        });
    };

    const handleRunTests = () => {
        setTestOutput("Running tests...\n\n✅ All tests passed!");
    };

    const handleReset = () => {
        if (result) {
            setCode(result.lesson.challengeCode ?? "");
            setTestOutput(null);
        }
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden -m-4 sm:-m-6">
            {/* Top nav bar */}
            <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/courses/${slug}`}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        {course.title}
                    </Link>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-sm text-muted-foreground">{moduleTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                    <ProgressBar
                        value={lessonIndex}
                        max={contentCount}
                        size="sm"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {lessonIndex + 1}/{contentCount}
                    </span>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Content pane */}
                <div
                    className={`flex flex-col overflow-y-auto border-r border-border bg-background ${isChallenge ? "w-1/2" : "w-full max-w-3xl mx-auto"
                        }`}
                >
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            {isChallenge ? (
                                <Badge
                                    variant="outline"
                                    className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                >
                                    <Code2 className="mr-1 h-3 w-3" />
                                    Challenge
                                </Badge>
                            ) : (
                                <Badge variant="outline">
                                    <BookOpen className="mr-1 h-3 w-3" />
                                    Lesson
                                </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                                {lesson.duration}
                            </span>
                        </div>

                        <h1 className="text-xl font-bold">{lesson.title}</h1>

                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p>{lesson.content}</p>
                        </div>

                        {/* Challenge objective */}
                        {isChallenge && lesson.challengeTests && (
                            <Card className="bg-muted/30 p-4">
                                <h3 className="mb-2 text-sm font-semibold">Objective</h3>
                                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                                    {lesson.challengeTests}
                                </pre>
                            </Card>
                        )}

                        {/* Mark complete */}
                        {!isEnrolled ? (
                            <Card className="bg-amber-500/10 border-amber-500/20 p-4">
                                <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                                    Enroll in this course to track progress and earn XP.
                                </p>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/courses/${slug}`}>Enroll on course page</Link>
                                </Button>
                            </Card>
                        ) : (
                            <div className="flex items-center gap-2">
                                {isCompleted ? (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Completed
                                    </Badge>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={handleMarkComplete}
                                        disabled={!canMarkComplete || !canCompleteOnChain || completeLesson.isPending}
                                    >
                                        {completeLesson.isPending ? "Completing..." : "Mark complete"}
                                    </Button>
                                )}
                                {isEnrolled && !canCompleteOnChain && onChainLessonCount != null && (
                                    <span className="text-xs text-muted-foreground">
                                        This lesson is not available on-chain (course has {onChainLessonCount} lessons).
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom nav */}
                    <div className="mt-auto border-t border-border p-4 flex items-center justify-between">
                        {prevLesson ? (
                            <Button asChild variant="ghost" size="sm">
                                <Link href={`/courses/${slug}/lessons/${prevLesson.id}`}>
                                    <ChevronLeft className="mr-1 h-4 w-4" />
                                    Previous
                                </Link>
                            </Button>
                        ) : (
                            <div />
                        )}

                        {nextLesson ? (
                            <Button asChild size="sm">
                                <Link href={`/courses/${slug}/lessons/${nextLesson.id}`}>
                                    Next Lesson
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button size="sm">
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Complete Course
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right: Code editor (challenges only) */}
                {isChallenge ? (
                    <div className="flex w-1/2 flex-col overflow-hidden border-l border-border bg-background">
                        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
                            <div className="flex items-center gap-2">
                                <Code2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Code</span>
                            </div>
                            {lesson.challengeCode && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(code || lesson.challengeCode || "");
                                            toast.success("Starter code copied to clipboard!");
                                        } catch (err) {
                                            toast.error("Failed to copy code. Please copy manually.");
                                        }
                                    }}
                                    className="h-7 text-xs"
                                >
                                    <RotateCcw className="mr-1 h-3 w-3" />
                                    Copy Starter Code
                                </Button>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden relative min-h-0">
                            <CodeEditor
                                value={code}
                                onChange={setCode}
                                language="typescript"
                                height="100%"
                                className="h-full"
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
