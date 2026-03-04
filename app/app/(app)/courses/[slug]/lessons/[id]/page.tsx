"use client";
/* @refresh reset */

import { use, useEffect, useMemo, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Code2,
    Loader2,
    RotateCcw,
    BookOpen,
    Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar, CodeEditor, MarkdownContent, CourseCompleteModal } from "@/components/app";
import {
    getLessonById,
    getAllLessonsFlat,
    getCourseIdForProgram,
} from "@/lib/services/content-service";
import { useEnrollment, useCompleteLesson, useCourse, useCredentialCollectionsList } from "@/hooks";
import { getLessonFlagsFromEnrollment, getCompletedAtFromEnrollment } from "@/lib/lesson-bitmap";
import { getEffectiveLessonCount } from "@/lib/services/content-service";
import { urlFor } from "@/lib/sanity/client";
import { BN } from "@coral-xyz/anchor";
import { toast } from "sonner";

function toSafeNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
    if (typeof value === "bigint") return Number(value);
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return Math.trunc(parsed);
    }
    if (
        value &&
        typeof value === "object" &&
        "toNumber" in value &&
        typeof (value as { toNumber?: unknown }).toNumber === "function"
    ) {
        try {
            const parsed = (value as { toNumber: () => number }).toNumber();
            if (Number.isFinite(parsed)) return Math.trunc(parsed);
        } catch {
            return null;
        }
    }
    return null;
}

function resolveTrackIdFromCourseAccount(courseAccount: unknown): number | null {
    if (!courseAccount || typeof courseAccount !== "object") return null;
    const account = courseAccount as Record<string, unknown>;
    const value = account.track_id ?? account.trackId;
    const parsed = toSafeNumber(value);
    return parsed != null && parsed >= 0 ? parsed : null;
}

type LessonPageData = NonNullable<Awaited<ReturnType<typeof getLessonById>>>;

export default function LessonPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>;
}) {
    const { slug, id } = use(params);
    const [result, setResult] = useState<Awaited<ReturnType<typeof getLessonById>>>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        void getLessonById(slug, id).then((data) => {
            if (cancelled) return;
            setResult(data);
            setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [slug, id]);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            </div>
        );
    }

    if (!result) return notFound();

    return <LessonPageContent key={`${slug}:${id}`} slug={slug} result={result as LessonPageData} />;
}

function LessonPageContent({
    slug,
    result,
}: {
    slug: string;
    result: LessonPageData;
}) {
    const { course, lesson, moduleTitle, lessonIndex } = result;
    const [code, setCode] = useState(result.lesson.challengeCode ?? "");
    const [isSavingOffline, setIsSavingOffline] = useState(false);
    const [courseCompleteData, setCourseCompleteData] = useState<{
        courseId: string;
        courseName: string;
        xpEarned: number;
    } | null>(null);
    const router = useRouter();

    const courseId = getCourseIdForProgram(course);
    const { data: enrollment } = useEnrollment(courseId);
    const { data: onChainCourse, isLoading: isCourseLoading } = useCourse(courseId);
    const { data: credentialCollectionsList, isLoading: isCollectionsLoading } = useCredentialCollectionsList();
    const completeLesson = useCompleteLesson();
    const lessonFlags = getLessonFlagsFromEnrollment(enrollment ?? undefined);

    const isFlagComplete = (targetLessonIndex: number): boolean => {
        if (!Number.isInteger(targetLessonIndex) || targetLessonIndex < 0) return false;
        const wordIndex = Math.floor(targetLessonIndex / 64);
        const bitIndex = targetLessonIndex % 64;
        const rawWord = lessonFlags[wordIndex] as unknown;
        if (!rawWord) return false;
        try {
            const word = rawWord instanceof BN ? rawWord : new BN(String(rawWord));
            return word.testn(bitIndex);
        } catch {
            return false;
        }
    };

    const trackId = useMemo(() => resolveTrackIdFromCourseAccount(onChainCourse), [onChainCourse]);
    const trackCollection = useMemo(() => {
        if (trackId == null || !credentialCollectionsList?.length) return "";
        const row = credentialCollectionsList.find((item) => item.trackId === trackId);
        return row?.collectionAddress ?? "";
    }, [credentialCollectionsList, trackId]);

    const allLessons = getAllLessonsFlat(course);
    const contentCount = allLessons.length;
    const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] ?? null : null;
    const nextLesson = lessonIndex < contentCount - 1 ? allLessons[lessonIndex + 1] ?? null : null;

    const isChallenge = lesson.type === "challenge";
    const isEnrolled = !!enrollment;
    const isCompleted = isEnrolled && isFlagComplete(lessonIndex);
    const prevLessonCompleted = lessonIndex === 0 || (isEnrolled && isFlagComplete(lessonIndex - 1));
    const canAccessLesson = !isEnrolled || prevLessonCompleted;
    const completedAt = getCompletedAtFromEnrollment(enrollment ?? undefined);
    const isCourseComplete = completedAt != null;
    const lessonImageUrl = lesson.image
        ? urlFor(lesson.image).width(1024).height(512).url()
        : null;

    const handleSaveOffline = async () => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            toast.error("Offline download is not supported in this browser.");
            return;
        }

        setIsSavingOffline(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const activeWorker = navigator.serviceWorker.controller ?? registration.active;
            if (!activeWorker) {
                toast.error("Offline cache is not ready yet. Try again in a few seconds.");
                return;
            }

            const urls = [
                window.location.pathname,
                `/courses/${slug}`,
                prevLesson ? `/courses/${slug}/lessons/${prevLesson.id}` : null,
                nextLesson ? `/courses/${slug}/lessons/${nextLesson.id}` : null,
                lessonImageUrl,
            ].filter((value): value is string => Boolean(value));

            activeWorker.postMessage({
                type: "CACHE_URLS",
                urls: Array.from(new Set(urls)),
            });
            toast.success("Lesson downloaded for offline access.");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to download lesson.";
            toast.error(message);
        } finally {
            setIsSavingOffline(false);
        }
    };

    return (
        <>
            <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden -m-4 sm:-m-6">
                {/* Top nav bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border bg-background px-3 sm:px-4 py-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Link
                            href={`/courses/${slug}`}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="truncate max-w-[120px] sm:max-w-[200px]">{course.title}</span>
                        </Link>
                        <span className="text-muted-foreground/50 shrink-0">·</span>
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">{moduleTitle}</span>
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
                <div className="flex flex-1 flex-col md:flex-row overflow-hidden w-full max-w-5xl mx-auto">
                    {/* Left: Content pane */}
                    <div
                        className={`flex flex-col overflow-y-auto border-b md:border-b-0 md:border-r border-border bg-background ${isChallenge ? "w-full md:w-1/2 md:min-w-0" : "w-full min-w-0"
                            }`}
                    >
                        <div className="p-4 sm:p-6 lg:p-8 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="font-game text-sm"
                                    onClick={handleSaveOffline}
                                    disabled={isSavingOffline}
                                >
                                    <Download className="mr-1 h-3.5 w-3.5" />
                                    {isSavingOffline ? "Saving..." : "Download Offline"}
                                </Button>
                            </div>

                            <h1 className="text-xl font-bold">{lesson.title}</h1>

                            {lesson.image && (
                                <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/40">
                                    <Image
                                        src={urlFor(lesson.image).width(1024).height(512).url()}
                                        alt={lesson.image.alt ?? lesson.title}
                                        width={1024}
                                        height={512}
                                        className="h-auto w-full object-cover"
                                        priority={false}
                                    />
                                </div>
                            )}

                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <MarkdownContent content={lesson.content} />
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

                            {/* Access / Completion status */}
                            {!isEnrolled ? (
                                <Card className="bg-amber-500/10 border-amber-500/20 p-4">
                                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                                        Enroll in this course to track progress and earn XP.
                                    </p>
                                    <Button asChild variant="pixel" size="sm" className="font-game">
                                        <Link href={`/courses/${slug}`}>Enroll on course page</Link>
                                    </Button>
                                </Card>
                            ) : !canAccessLesson ? (
                                <Card className="bg-amber-500/10 border-amber-500/20 p-4">
                                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-2 font-game">
                                        Complete the previous lesson to unlock this one.
                                    </p>
                                    <Button asChild variant="pixel" size="sm" className="font-game">
                                        <Link href={prevLesson ? `/courses/${slug}/lessons/${prevLesson.id}` : `/courses/${slug}`}>
                                            {prevLesson ? "Go to previous lesson" : "Back to course"}
                                        </Link>
                                    </Button>
                                </Card>
                            ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                    {isCompleted ? (
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 gap-1 font-game">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Completed
                                        </Badge>
                                    ) : (
                                        <Button
                                            variant="pixel"
                                            size="sm"
                                            className="font-game text-md"
                                            onClick={() => {
                                                const effectiveCount = getEffectiveLessonCount(course, onChainCourse ?? null);
                                                const xpPerLesson = course.xpPerLesson ?? 0;
                                                const isLastLesson =
                                                    effectiveCount > 0 && lessonIndex === effectiveCount - 1;
                                                const xpEarned = isLastLesson
                                                    ? xpPerLesson +
                                                      Math.floor((xpPerLesson * effectiveCount) / 2)
                                                    : xpPerLesson;
                                                completeLesson.mutate(
                                                    {
                                                        courseId,
                                                        lessonIndex,
                                                        xpEarned: xpEarned > 0 ? xpEarned : undefined,
                                                        effectiveCount,
                                                        onCourseComplete: isLastLesson
                                                            ? () => {
                                                                  const xp = (course.xpPerLesson ?? 0);
                                                                  const totalXp =
                                                                      effectiveCount * xp +
                                                                      Math.floor((xp * effectiveCount) / 2);
                                                                  setCourseCompleteData({
                                                                      courseId,
                                                                      courseName: course.title,
                                                                      xpEarned: totalXp,
                                                                  });
                                                              }
                                                            : undefined,
                                                    },
                                                    {
                                                        onSuccess: () => {
                                                            if (!isLastLesson && nextLesson) {
                                                                router.push(`/courses/${slug}/lessons/${nextLesson.id}`);
                                                            }
                                                        },
                                                    }
                                                );
                                            }}
                                            disabled={completeLesson.isPending}
                                        >
                                            {completeLesson.isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Completing…
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Complete lesson
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom nav — Previous/Next cards like reference */}
                        <div className="mt-auto border-t border-border p-4 sm:p-6 lg:p-8 flex items-center justify-between gap-4">
                            {prevLesson ? (
                                <Link
                                    href={`/courses/${slug}/lessons/${prevLesson.id}`}
                                    className="flex-1 min-w-0 rounded-xl border-2 border-border bg-card p-4 transition-colors hover:bg-muted/50 hover:border-primary/30"
                                >
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-1 mb-1">
                                        <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
                                        Previous
                                    </p>
                                    <p className="font-game text-base sm:text-lg text-primary truncate">
                                        {prevLesson.title}
                                    </p>
                                </Link>
                            ) : (
                                <div className="flex-1 min-w-0" />
                            )}

                            {nextLesson && isCompleted ? (
                                <Link
                                    href={`/courses/${slug}/lessons/${nextLesson.id}`}
                                    className="flex-1 min-w-0 rounded-xl border-2 border-border bg-card p-4 transition-colors hover:bg-muted/50 hover:border-primary/30 text-right"
                                >
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center justify-end gap-1 mb-1">
                                        Next
                                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                    </p>
                                    <p className="font-game text-base sm:text-lg text-primary truncate">
                                        {nextLesson.title}
                                    </p>
                                </Link>
                            ) : nextLesson && !isCompleted ? (
                                <div className="flex-1 min-w-0 rounded-xl border-2 border-border bg-muted/30 p-4 text-right opacity-75">
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">
                                        Next
                                    </p>
                                    <p className="font-game text-base sm:text-lg text-muted-foreground truncate">
                                        {nextLesson.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Complete this lesson to unlock</p>
                                </div>
                            ) : !nextLesson ? (
                                <Link
                                    href={`/courses/${slug}`}
                                    className="flex-1 min-w-0 rounded-xl border-2 border-border bg-card p-4 transition-colors hover:bg-muted/50 hover:border-primary/30 text-right"
                                >
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center justify-end gap-1 mb-1">
                                        {isCourseComplete ? "Course complete — " : ""}Back to course
                                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                    </p>
                                    <p className="font-game text-base sm:text-lg text-primary truncate">
                                        {course.title}
                                    </p>
                                </Link>
                            ) : (
                                <div className="flex-1 min-w-0" />
                            )}
                        </div>
                    </div>

                    {/* Right: Code editor (challenges only) */}
                    {isChallenge ? (
                        <div className="flex flex-1 flex-col overflow-hidden border-t md:border-t-0 md:border-l border-border bg-background min-h-[280px] md:min-h-0 w-full md:w-1/2">
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
                                            } catch {
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

            {courseCompleteData && (
                <CourseCompleteModal
                    courseId={courseCompleteData.courseId}
                    courseName={courseCompleteData.courseName}
                    xpEarned={courseCompleteData.xpEarned}
                    trackCollection={trackCollection}
                    isTrackCollectionLoading={
                        isCourseLoading || (isCollectionsLoading && trackId != null)
                    }
                    onClose={() => setCourseCompleteData(null)}
                />
            )}
        </>
    );
}
