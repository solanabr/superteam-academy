"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Code2,
    Play,
    RotateCcw,
    BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/app";
import {
    getLessonById,
    getAllLessonsFlat,
} from "@/lib/services/content-service";

export default function LessonPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>;
}) {
    const { slug, id } = use(params);
    const [result, setResult] = useState<Awaited<ReturnType<typeof getLessonById>>>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [testOutput, setTestOutput] = useState<string | null>(null);
    const [code, setCode] = useState("");

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
    const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
    const nextLesson =
        lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

    const isChallenge = lesson.type === "challenge";

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

                {/* Right: Code editor pane (challenges only) */}
                {isChallenge && (
                    <div className="flex w-1/2 flex-col overflow-hidden">
                        {/* Code editor area */}
                        <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Editor
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-7 text-xs"
                                >
                                    <RotateCcw className="mr-1 h-3 w-3" />
                                    Reset
                                </Button>
                            </div>
                            <textarea
                                className="w-full min-h-[300px] rounded-lg border border-border bg-background p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                value={code || lesson.challengeCode || ""}
                                onChange={(e) => setCode(e.target.value)}
                                spellCheck={false}
                            />
                        </div>

                        {/* Test output */}
                        <div className="border-t border-border bg-background p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Test Output
                                </span>
                                <Button size="sm" onClick={handleRunTests} className="h-7">
                                    <Play className="mr-1 h-3 w-3" />
                                    Run Tests
                                </Button>
                            </div>
                            <pre className="min-h-[80px] rounded-lg bg-muted/30 p-3 text-xs font-mono text-muted-foreground">
                                {testOutput ?? "Click 'Run Tests' to check your solution."}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
