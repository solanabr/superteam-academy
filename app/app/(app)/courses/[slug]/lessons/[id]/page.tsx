"use client";

import { use, useState } from "react";
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
import { ProgressBar, SolanaPlayground } from "@/components/app";
import {
    getLessonById,
    getAllLessonsFlat,
} from "@/lib/services/mock-content";
import { toast } from "sonner";

export default function LessonPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>;
}) {
    const { slug, id } = use(params);
    const result = getLessonById(slug, id);

    if (!result) return notFound();

    const { course, lesson, moduleTitle, lessonIndex } = result;
    const allLessons = getAllLessonsFlat(course);
    const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
    const nextLesson =
        lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

    const isChallenge = lesson.type === "challenge";

    // Debug logging
    console.log("Lesson data:", {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        isChallenge,
        hasChallengeCode: !!lesson.challengeCode,
    });

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
                        max={course.lessonCount}
                        size="sm"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {lessonIndex + 1}/{course.lessonCount}
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

                {/* Right: Solana Playground (challenges only) */}
                {isChallenge ? (
                    <div className="flex w-1/2 flex-col overflow-hidden border-l border-border bg-background">
                        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
                            <div className="flex items-center gap-2">
                                <Code2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Solana Playground</span>
                            </div>
                            {lesson.challengeCode && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(lesson.challengeCode || "");
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
                        <div className="flex-1 overflow-hidden relative">
                            <SolanaPlayground starterCode={lesson.challengeCode} />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
