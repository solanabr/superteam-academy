"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Check,
    Play,
    Code,
    Lightbulb,
    Eye,
    RotateCcw,
    BookOpen,
    Zap,
    CheckCircle,
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { CourseService, LearningProgressService } from "@/services";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="h-full flex items-center justify-center bg-[#1e1e1e] rounded-lg">
            <div className="animate-pulse text-gray-500">Loading editor...</div>
        </div>
    ),
});

export default function LessonPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>;
}) {
    const { slug, id } = use(params);
    const t = useTranslations("lesson");
    const course = CourseService.getCourseBySlug(slug);
    const [showHint, setShowHint] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [code, setCode] = useState("");
    const [output, setOutput] = useState("");
    const [testResults, setTestResults] = useState<{ name: string; passed: boolean }[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [xpEarned, setXpEarned] = useState(0);

    const allLessons = useMemo(() => {
        if (!course) return [];
        return course.modules.flatMap((m) => m.lessons);
    }, [course]);

    const lesson = allLessons.find((l) => l.id === id);
    const lessonIndex = allLessons.findIndex((l) => l.id === id);
    const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
    const nextLesson = lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

    const currentModule = course?.modules.find((m) =>
        m.lessons.some((l) => l.id === id)
    );

    if (!course || !lesson) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Lesson not found</p>
            </div>
        );
    }

    const isChallenge = lesson.type === "challenge" && lesson.challenge;

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput("");
        setTestResults([]);

        // Simulate code execution
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (lesson.challenge) {
            const results = lesson.challenge.testCases.map((tc) => ({
                name: tc.name,
                passed: Math.random() > 0.3, // Simulate with 70% pass rate for demo
            }));
            setTestResults(results);
            const allPassed = results.every((r) => r.passed);
            setOutput(
                allPassed
                    ? "✅ All test cases passed!"
                    : "❌ Some test cases failed. Check the results above."
            );

            if (allPassed && !completed) {
                setCompleted(true);
                const result = await LearningProgressService.completeLesson(
                    "",
                    course.courseId,
                    lessonIndex
                );
                setXpEarned(result.xpEarned);
            }
        }
        setIsRunning(false);
    };

    const handleComplete = async () => {
        if (completed) return;
        setCompleted(true);
        const result = await LearningProgressService.completeLesson(
            "",
            course.courseId,
            lessonIndex
        );
        setXpEarned(result.xpEarned);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top Bar */}
            <div className="glass-strong border-b border-border px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/courses/${slug}`}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {course.title}
                    </Link>
                    <span className="text-border">/</span>
                    <span className="text-sm font-medium">{lesson.title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {lessonIndex + 1} / {allLessons.length}
                    </span>
                    {lesson.type === "challenge" && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                            Challenge
                        </span>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className={cn("flex-1 flex", isChallenge ? "flex-col lg:flex-row" : "flex-col")}>
                {/* Content Panel */}
                <div
                    className={cn(
                        "overflow-y-auto p-6",
                        isChallenge ? "lg:w-1/2 lg:border-r border-border" : "max-w-4xl mx-auto w-full"
                    )}
                >
                    <div className="max-w-none prose prose-invert prose-sm">
                        <h1 className="text-2xl font-bold mb-4 text-foreground">{lesson.title}</h1>
                        <p className="text-muted-foreground mb-6">{lesson.description}</p>

                        {lesson.content && (
                            <div
                                className="text-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_p]:mb-4 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:space-y-1 [&_li]:text-muted-foreground [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-emerald-400 [&_pre]:bg-[#1e1e1e] [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_strong]:text-foreground [&_strong]:font-semibold"
                                dangerouslySetInnerHTML={{
                                    __html: lesson.content
                                        .replace(/^### (.*$)/gm, "<h3>$1</h3>")
                                        .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                                        .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                                        .replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
                                        .replace(/`([^`]+)`/g, "<code>$1</code>")
                                        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                                        .replace(/^- (.*$)/gm, "<li>$1</li>")
                                        .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
                                        .replace(/^(?!<[huplo])(.*\S.*)$/gm, "<p>$1</p>")
                                        .replace(/\n\n/g, ""),
                                }}
                            />
                        )}

                        {isChallenge && lesson.challenge && (
                            <div className="mt-6 space-y-4">
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                    <h3 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
                                        <Code className="w-4 h-4" />
                                        Challenge
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {lesson.challenge.prompt}
                                    </p>
                                    <ul className="space-y-1">
                                        {lesson.challenge.objectives.map((obj, i) => (
                                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Hint */}
                                {lesson.challenge.hints.length > 0 && (
                                    <div>
                                        <button
                                            onClick={() => setShowHint(!showHint)}
                                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Lightbulb className="w-4 h-4 text-amber-400" />
                                            {t("hint")}
                                        </button>
                                        {showHint && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-sm text-muted-foreground"
                                            >
                                                {lesson.challenge.hints.map((hint, i) => (
                                                    <p key={i}>💡 {hint}</p>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* Solution toggle */}
                                <button
                                    onClick={() => setShowSolution(!showSolution)}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    {t("solution")}
                                </button>
                                {showSolution && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-4 rounded-lg bg-[#1e1e1e] overflow-x-auto"
                                    >
                                        <pre className="text-sm text-gray-300">
                                            <code>{lesson.challenge.solution}</code>
                                        </pre>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Module overview */}
                    {currentModule && (
                        <div className="mt-8 p-4 rounded-xl glass">
                            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                {t("moduleOverview")}: {currentModule.title}
                            </h3>
                            <div className="space-y-1">
                                {currentModule.lessons.map((l) => (
                                    <Link
                                        key={l.id}
                                        href={`/courses/${slug}/lessons/${l.id}`}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                            l.id === id
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                                        )}
                                    >
                                        {l.type === "challenge" ? (
                                            <Code className="w-3.5 h-3.5" />
                                        ) : (
                                            <Play className="w-3.5 h-3.5" />
                                        )}
                                        {l.title}
                                        <span className="ml-auto text-xs">{formatDuration(l.duration)}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Code Editor Panel (for challenges) */}
                {isChallenge && lesson.challenge && (
                    <div className="lg:w-1/2 flex flex-col min-h-[400px] lg:min-h-0">
                        {/* Editor toolbar */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[#1e1e1e]">
                            <span className="text-xs text-gray-400 font-mono">
                                {lesson.challenge.language === "rust" ? "main.rs" : lesson.challenge.language === "typescript" ? "solution.ts" : "data.json"}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCode(lesson.challenge!.starterCode)}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    {t("resetCode")}
                                </button>
                                <button
                                    onClick={handleRunCode}
                                    disabled={isRunning}
                                    className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                                >
                                    <Play className="w-3 h-3" />
                                    {isRunning ? "Running..." : t("runCode")}
                                </button>
                            </div>
                        </div>

                        {/* Monaco Editor */}
                        <div className="flex-1 min-h-[300px]">
                            <MonacoEditor
                                height="100%"
                                language={lesson.challenge.language === "rust" ? "rust" : "typescript"}
                                theme="vs-dark"
                                value={code || lesson.challenge.starterCode}
                                onChange={(v) => setCode(v || "")}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: "on",
                                    renderLineHighlight: "line",
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    padding: { top: 12, bottom: 12 },
                                    tabSize: 2,
                                }}
                            />
                        </div>

                        {/* Test Results & Output */}
                        <div className="border-t border-border bg-[#1e1e1e] max-h-48 overflow-y-auto">
                            {testResults.length > 0 && (
                                <div className="p-3 space-y-1">
                                    <h4 className="text-xs font-medium text-gray-400 mb-2">
                                        {t("testCases")}
                                    </h4>
                                    {testResults.map((result, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "flex items-center gap-2 text-xs px-2 py-1.5 rounded",
                                                result.passed ? "text-emerald-400" : "text-red-400"
                                            )}
                                        >
                                            {result.passed ? (
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            ) : (
                                                <span className="w-3.5 h-3.5 rounded-full border-2 border-red-400" />
                                            )}
                                            {result.name} — {result.passed ? t("passed") : t("failed")}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {output && (
                                <div className="px-3 pb-3">
                                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                        {output}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Completion Banner */}
            {completed && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
                >
                    <div className="glass-strong rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">{t("completed")}</div>
                            <div className="text-xs text-emerald-400 font-medium">
                                +{xpEarned} XP
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Bottom Navigation */}
            <div className="glass-strong border-t border-border px-4 py-3 flex items-center justify-between">
                <div>
                    {prevLesson ? (
                        <Link
                            href={`/courses/${slug}/lessons/${prevLesson.id}`}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            {t("previous")}
                        </Link>
                    ) : (
                        <span />
                    )}
                </div>

                {!isChallenge && !completed && (
                    <button
                        onClick={handleComplete}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Check className="w-4 h-4" />
                        {t("complete")}
                    </button>
                )}

                <div>
                    {nextLesson ? (
                        <Link
                            href={`/courses/${slug}/lessons/${nextLesson.id}`}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t("next")}
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <Link
                            href={`/courses/${slug}`}
                            className="flex items-center gap-1 text-sm text-primary font-medium"
                        >
                            Back to Course
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
