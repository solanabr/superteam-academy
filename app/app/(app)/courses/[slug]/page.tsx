"use client";

import { ProgressBar } from "@/components/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEnroll, useEnrollment } from "@/hooks";
import { countCompletedLessons, getCompletedAtFromEnrollment, getLessonFlagsFromEnrollment } from "@/lib/lesson-bitmap";
import { urlFor } from "@/lib/sanity/client";
import { getAllLessonsFlat, getCourseBySlug, getCourseIdForProgram } from "@/lib/services/content-service";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    Circle,
    CircleCheck,
    Clock3,
    Code2,
    Flame,
    Gauge,
    Layers3,
    Lock,
    Medal,
    Play,
    Sparkles,
    Trophy,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
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
            <div className="space-y-5">
                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                <div className="h-56 animate-pulse rounded-2xl border border-border bg-card/70" />
                <div className="h-48 animate-pulse rounded-2xl border border-border bg-card/70" />
            </div>
        );
    }

    if (!course) return notFound();

    const allLessons = getAllLessonsFlat(course);
    const totalXp = course.lessonCount * course.xpPerLesson;
    const challengeCount = allLessons.filter((lesson) => lesson.type === "challenge").length;
    const isEnrolled = !!enrollment || enroll.isSuccess;
    const lessonFlags = getLessonFlagsFromEnrollment(enrollment ?? undefined);
    const completedAt = getCompletedAtFromEnrollment(enrollment ?? undefined);
    const isCourseComplete = completedAt != null;
    const completedCount = lessonFlags.length > 0 ? countCompletedLessons(lessonFlags) : 0;
    const progressMax = Math.max(course.lessonCount, allLessons.length);

    const isFlagComplete = (lessonIndex: number): boolean => {
        if (!Number.isInteger(lessonIndex) || lessonIndex < 0) return false;
        const wordIndex = Math.floor(lessonIndex / 64);
        const bitIndex = lessonIndex % 64;
        const rawWord = lessonFlags[wordIndex] as unknown;
        if (!rawWord) return false;
        try {
            const word = rawWord instanceof BN ? rawWord : new BN(String(rawWord));
            return word.testn(bitIndex);
        } catch {
            return false;
        }
    };

    const nextLessonIndex = allLessons.findIndex((_, idx) => !isFlagComplete(idx));
    const continueLesson = allLessons[nextLessonIndex >= 0 ? nextLessonIndex : 0] ?? allLessons[0] ?? null;
    const continueHref = continueLesson ? `/courses/${slug}/lessons/${continueLesson.id}` : `/courses/${slug}`;

    const learningHighlights = allLessons
        .slice(0, 8)
        .map((lesson) => lesson.title.trim())
        .filter(Boolean);
    const displayHighlights =
        learningHighlights.length > 0
            ? learningHighlights
            : ["Learn core Solana concepts", "Build practical on-chain skills"];

    const handleEnroll = () => {
        if (!publicKey) {
            toast.error("Connect your wallet to enroll.");
            return;
        }
        enroll.mutate({ courseId: getCourseIdForProgram(course) });
    };

    return (
        <div className="space-y-6 sm:space-y-7">
            <Link
                href="/courses"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground font-game"
            >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                All Courses
            </Link>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-5">
                    <section className="overflow-hidden rounded-2xl border border-border bg-card/85">
                        <div className="grid lg:grid-cols-[1.05fr_1fr]">
                            {course.image && (
                                <div className="relative min-h-[240px] border-b border-border bg-muted/40 lg:min-h-[340px] lg:border-b-0 lg:border-r">
                                    <Image
                                        src={urlFor(course.image).width(2200).height(1240).quality(90).url()}
                                        alt={course.title}
                                        width={1200}
                                        height={680}
                                        className="h-full w-full object-cover"
                                        priority
                                    />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent lg:bg-gradient-to-r lg:from-black/15 lg:to-transparent" />
                                </div>
                            )}

                            <div className="flex min-w-0 flex-col justify-between gap-4 p-5 sm:p-6">
                                <div className="space-y-3 min-w-0">
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Course overview</p>
                                    <h1 className="font-game text-3xl leading-tight sm:text-4xl">{course.title}</h1>
                                    <p className="text-base text-muted-foreground sm:text-lg">{course.description}</p>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={`text-sm font-game capitalize ${difficultyColors[course.difficulty]}`}
                                        >
                                            <Gauge className="mr-1 h-3.5 w-3.5" />
                                            {course.difficulty}
                                        </Badge>
                                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                            <Clock3 className="h-4 w-4" />
                                            {course.duration}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                            <BookOpen className="h-4 w-4" />
                                            {course.lessonCount} lessons
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-sm text-yellow-300">
                                            <Sparkles className="h-4 w-4" />
                                            {totalXp} XP
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    {isEnrolled ? (
                                        <>
                                            <ProgressBar value={completedCount} max={progressMax} label="Progress" className="font-game text-sm" />
                                            {isCourseComplete ? (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-sm font-game">
                                                        <Trophy className="mr-1 h-4 w-4" />
                                                        Course Complete
                                                    </Badge>
                                                    <Button asChild variant="pixel" className="font-game">
                                                        <Link href="/certificates">View Certificates</Link>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button asChild variant="pixel" className="w-full sm:w-auto font-game">
                                                    <Link href={continueHref}>
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Continue Learning
                                                    </Link>
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <Button
                                            variant="pixel"
                                            size="lg"
                                            onClick={handleEnroll}
                                            disabled={enroll.isPending}
                                            className="w-full sm:w-auto font-game"
                                        >
                                            {enroll.isPending ? "Enrolling..." : "Enroll now"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                        <section className="rounded-2xl border border-border bg-card/80 p-5 sm:p-6">
                            <h2 className="font-game text-2xl sm:text-3xl">What you'll learn</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {displayHighlights.map((item) => (
                                    <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground sm:text-base">
                                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-border bg-card/80 p-5 sm:p-6">
                            <h2 className="font-game text-2xl sm:text-3xl">Course stats</h2>
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                        <Layers3 className="h-4 w-4" />
                                        Modules
                                    </span>
                                    <span className="font-medium">{course.modules.length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                        <Code2 className="h-4 w-4" />
                                        Challenges
                                    </span>
                                    <span className="font-medium">{challengeCount}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                        <Sparkles className="h-4 w-4" />
                                        Total XP
                                    </span>
                                    <span className="font-medium text-yellow-300">{totalXp}</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    <section className="space-y-4">
                        <h2 className="font-game text-2xl sm:text-3xl">Syllabus</h2>

                        {course.modules.map((mod, mi) => {
                            const lessonIndexStart = course.modules
                                .slice(0, mi)
                                .reduce((sum, m) => sum + m.lessons.length, 0);

                            return (
                                <Card key={mi} className="overflow-hidden rounded-2xl border border-border py-0 gap-0 bg-gradient-to-b from-card/90 to-card/70">
                                    <div className="border-b border-border bg-muted/15 px-4 py-3 sm:px-5 sm:py-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="space-y-2">
                                                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                    Module {mi + 1}
                                                </span>
                                                <h3 className="font-game text-lg font-semibold sm:text-xl">
                                                    {mod.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-1">
                                                        <BookOpen className="h-3.5 w-3.5" />
                                                        {mod.lessons.length} lesson{mod.lessons.length === 1 ? "" : "s"}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-1">
                                                        <Code2 className="h-3.5 w-3.5" />
                                                        {mod.lessons.filter((lesson) => lesson.type === "challenge").length} challenge{mod.lessons.filter((lesson) => lesson.type === "challenge").length === 1 ? "" : "s"}
                                                    </span>
                                                </div>
                                            </div>

                                            {isEnrolled && (
                                                <div className="min-w-[110px] rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-right">
                                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Progress</p>
                                                    <p className="text-lg font-semibold">
                                                        {
                                                            mod.lessons.reduce((count, _, li) => {
                                                                const flatIndex = lessonIndexStart + li;
                                                                return count + (isFlagComplete(flatIndex) ? 1 : 0);
                                                            }, 0)
                                                        }
                                                        /{mod.lessons.length}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 p-2 sm:p-3">
                                        {mod.lessons.map((lesson, li) => {
                                            const flatIndex = lessonIndexStart + li;
                                            const completed = isEnrolled && isFlagComplete(flatIndex);
                                            const prevCompleted = flatIndex === 0 || (isEnrolled && isFlagComplete(flatIndex - 1));
                                            const canAccess = !isEnrolled ? false : prevCompleted;

                                            return (
                                                <div
                                                    key={lesson.id}
                                                    className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/45 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {isEnrolled ? (
                                                            completed ? (
                                                                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                                                            ) : canAccess ? (
                                                                <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                                            ) : (
                                                                <Lock className="mt-0.5 h-5 w-5 text-muted-foreground/60" />
                                                            )
                                                        ) : (
                                                            <Lock className="mt-0.5 h-5 w-5 text-muted-foreground/60" />
                                                        )}

                                                            <div>
                                                            <p className="text-base font-medium sm:text-lg">{lesson.title}</p>
                                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                                {lesson.type === "challenge" ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-xs sm:text-sm">
                                                                        <Code2 className="h-4 w-4" />
                                                                        Challenge
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-xs sm:text-sm">
                                                                        Lesson
                                                                    </span>
                                                                )}
                                                                <span>·</span>
                                                                <span>{lesson.duration}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isEnrolled && (
                                                        canAccess ? (
                                                            <Button asChild variant="pixel" size="sm" className="font-game">
                                                                <Link href={`/courses/${slug}/lessons/${lesson.id}`}>
                                                                    {completed ? "Review" : "Start"}
                                                                </Link>
                                                            </Button>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                                                <Flame className="h-4 w-4" />
                                                                Complete previous lesson
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            );
                        })}
                    </section>
                </div>

                <aside className="space-y-4 xl:sticky xl:top-20 xl:h-fit">
                    <div className="overflow-hidden rounded-2xl border border-border bg-card/80">
                        <div className="relative min-h-[240px] overflow-hidden border-b border-border bg-[#0a0c12]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.12),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(255,205,86,0.22),transparent_38%),linear-gradient(140deg,#0f121a_8%,#121826_46%,#090b12_100%)]" />
                            <div className="absolute -left-10 top-12 h-24 w-24 rounded-full border border-white/10 bg-white/5 blur-sm" />
                            <div className="absolute -right-12 bottom-8 h-28 w-28 rounded-full border border-amber-100/10 bg-amber-200/5 blur-sm" />
                            <div className="absolute inset-0 grid place-items-center p-5">
                                <div className="w-full max-w-[220px] rounded-2xl border border-amber-300/30 bg-gradient-to-br from-zinc-900/90 via-zinc-800/80 to-zinc-900/90 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
                                    <div className="border-b border-amber-200/15 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-zinc-300">
                                        Superteam Academy
                                    </div>
                                    <div className="px-4 py-5 text-center">
                                        <Medal className="mx-auto h-9 w-9 text-amber-300" />
                                        <p className="mt-2 text-sm font-semibold text-zinc-100">
                                            Course Completion NFT
                                        </p>
                                        <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-400">
                                            Soulbound Credential
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-amber-200/15 px-4 py-2 text-[10px] uppercase tracking-wide text-zinc-400">
                                        <span>SBT</span>
                                        <span>Non-transferable</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute left-3 top-3 rounded-full border border-border/80 bg-black/65 px-2.5 py-1 text-[11px] uppercase tracking-wide text-zinc-200">
                                Mock Preview
                            </div>
                            <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-xl border border-border/80 bg-black/55 px-3 py-2 text-zinc-100">
                                <Medal className="h-4 w-4 text-yellow-300" />
                                <div>
                                    <p className="text-sm font-medium">Completion Certificate NFT</p>
                                    <p className="text-xs text-zinc-300">Soulbound course credential</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 p-4">
                            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <Badge
                                    variant="outline"
                                    className={
                                        isCourseComplete
                                            ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                                            : "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300"
                                    }
                                >
                                    {isCourseComplete ? "Unlocked" : "Locked"}
                                </Badge>
                            </div>
                            {isCourseComplete ? (
                                <Button asChild variant="pixel" className="w-full font-game">
                                    <Link href="/certificates">Open Certificates</Link>
                                </Button>
                            ) : (
                                <Button disabled variant="outline" className="w-full">
                                    Complete course to unlock
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card/80 p-4">
                        <h3 className="font-game text-xl">Quick Actions</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {isEnrolled
                                ? "Jump back into your learning path and keep your streak active."
                                : "Enroll to unlock lessons, complete challenges, and earn XP."}
                        </p>
                        <div className="mt-4 space-y-2">
                            {isEnrolled ? (
                                <Button asChild variant="pixel" className="w-full font-game">
                                    <Link href={isCourseComplete ? "/certificates" : continueHref}>
                                        {isCourseComplete ? "View Certificates" : "Continue Learning"}
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    variant="pixel"
                                    onClick={handleEnroll}
                                    disabled={enroll.isPending}
                                    className="w-full font-game"
                                >
                                    {enroll.isPending ? "Enrolling..." : "Enroll now"}
                                </Button>
                            )}
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/courses">Browse other courses</Link>
                            </Button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
