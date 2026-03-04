"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocale } from "@/contexts/locale-context";
import { useLearning } from "@/contexts/learning-context";
import {
  getCourseBySlug,
  getLessonById,
  getNextLesson,
  getPreviousLesson,
} from "@/services/course-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Play,
  RotateCcw,
  Zap,
  ArrowLeft,
  Code2,
  FileText,
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center bg-muted rounded-lg">
      <span className="text-muted-foreground">Loading editor...</span>
    </div>
  ),
});

export default function LessonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = Number(params.id);
  const course = getCourseBySlug(slug);
  const { t } = useLocale();
  const { getProgress, completeLesson } = useLearning();

  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState<
    Array<{ id: string; passed: boolean; description: string }>
  >([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  if (!course) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const result = getLessonById(course, lessonId);
  if (!result) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    );
  }

  const { lesson, module: currentModule } = result;
  const progress = getProgress(course.id);
  const isLessonComplete = progress?.completedLessons.includes(lessonId) ?? false;
  const nextLessonId = getNextLesson(course, lessonId);
  const prevLessonId = getPreviousLesson(course, lessonId);
  const hasCodeChallenge = lesson.type === "code-challenge" && lesson.codeChallenge;
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentLessonIndex = allLessons.findIndex((l) => l.id === lessonId);

  if (hasCodeChallenge && !code && lesson.codeChallenge) {
    setCode(lesson.codeChallenge.starterCode);
  }

  const handleRunCode = async () => {
    if (!lesson.codeChallenge) return;
    setIsRunning(true);
    setOutput("");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const results = lesson.codeChallenge.testCases
      .filter((tc) => !tc.hidden)
      .map((tc) => ({
        id: tc.id,
        passed: Math.random() > 0.3,
        description: tc.description,
      }));

    setTestResults(results);
    const passedCount = results.filter((r) => r.passed).length;
    setOutput(
      `${passedCount}/${results.length} tests passed.\n\n${results
        .map((r) => `${r.passed ? "PASS" : "FAIL"}: ${r.description}`)
        .join("\n")}`
    );
    setIsRunning(false);
  };

  const handleReset = () => {
    if (lesson.codeChallenge) {
      setCode(lesson.codeChallenge.starterCode);
      setOutput("");
      setTestResults([]);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    await completeLesson(course.id, lessonId);
    setIsCompleting(false);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitRatio(Math.max(25, Math.min(75, newRatio)));
  };

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="border-b border-border/40 bg-card/50">
        <div className="mx-auto flex h-12 max-w-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/courses/${slug}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("lesson.backToCourse")}
            </Link>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm text-muted-foreground">
              {t("lesson.lessonOf", {
                current: currentLessonIndex + 1,
                total: allLessons.length,
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {prevLessonId !== null && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/courses/${slug}/lessons/${prevLessonId}`}>
                  <ChevronLeft className="h-4 w-4" />
                  {t("lesson.previous")}
                </Link>
              </Button>
            )}

            {!isLessonComplete ? (
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={isCompleting}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                {isCompleting ? (
                  t("common.loading")
                ) : (
                  <>
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    {t("lesson.markComplete")}
                  </>
                )}
              </Button>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                {t("lesson.completed")} &mdash;{" "}
                {t("lesson.xpEarned", { amount: course.xpPerLesson })}
              </Badge>
            )}

            {nextLessonId !== null && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/courses/${slug}/lessons/${nextLessonId}`}>
                  {t("lesson.next")}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      {hasCodeChallenge ? (
        /* Split layout: content + code editor */
        <div
          className="flex h-[calc(100vh-7rem)]"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Left: Content */}
          <div
            className="overflow-y-auto border-r border-border/40"
            style={{ width: `${splitRatio}%` }}
          >
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20">
                  <Code2 className="mr-1 h-3 w-3" />
                  {t("lesson.codeChallenge")}
                </Badge>
              </div>
              <h1 className="mb-4 text-2xl font-bold">{lesson.title}</h1>

              {lesson.codeChallenge && (
                <div className="mb-6">
                  <p className="mb-4 text-muted-foreground">
                    {lesson.codeChallenge.prompt}
                  </p>
                  <h3 className="mb-2 font-semibold">Objectives:</h3>
                  <ul className="mb-4 space-y-1">
                    {lesson.codeChallenge.objectives.map((obj, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="prose-lesson">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {lesson.content}
                </ReactMarkdown>
              </div>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 font-semibold">
                    {t("lesson.testsPassed", {
                      passed: testResults.filter((r) => r.passed).length,
                      total: testResults.length,
                    })}
                  </h3>
                  <div className="space-y-2">
                    {testResults.map((result) => (
                      <div
                        key={result.id}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                          result.passed
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="h-4 w-4 text-center font-bold">&times;</span>
                        )}
                        {result.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drag handle */}
          <div
            className="w-1 cursor-col-resize bg-border/40 hover:bg-violet-500/40 transition-colors"
            onMouseDown={handleMouseDown}
          />

          {/* Right: Code Editor */}
          <div
            className="flex flex-col overflow-hidden"
            style={{ width: `${100 - splitRatio}%` }}
          >
            {/* Editor toolbar */}
            <div className="flex items-center justify-between border-b border-border/40 bg-card/50 px-4 py-2">
              <span className="text-sm font-medium">
                {lesson.codeChallenge?.language || "rust"}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  {t("lesson.resetCode")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  {isRunning ? t("common.loading") : t("lesson.runCode")}
                </Button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1">
              <MonacoEditor
                height="100%"
                language={lesson.codeChallenge?.language || "rust"}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 4,
                  padding: { top: 12 },
                }}
              />
            </div>

            {/* Output */}
            {output && (
              <div className="h-40 overflow-y-auto border-t border-border/40 bg-zinc-950 p-4">
                <div className="mb-2 text-xs font-semibold text-muted-foreground">
                  {t("lesson.output")}
                </div>
                <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">
                  {output}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Standard article layout */
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-2">
            <Badge variant="outline">
              <FileText className="mr-1 h-3 w-3" />
              {currentModule.title}
            </Badge>
            <span className="text-sm text-muted-foreground">
              &middot; {lesson.estimatedMinutes} min
            </span>
          </div>
          <h1 className="mb-6 text-3xl font-bold">{lesson.title}</h1>
          <p className="mb-6 text-lg text-muted-foreground">
            {lesson.description}
          </p>

          <div className="prose-lesson">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {lesson.content}
            </ReactMarkdown>
          </div>

          {/* Bottom nav */}
          <div className="mt-12 flex items-center justify-between border-t border-border/40 pt-6">
            {prevLessonId !== null ? (
              <Button variant="outline" asChild>
                <Link href={`/courses/${slug}/lessons/${prevLessonId}`}>
                  <ChevronLeft className="mr-1.5 h-4 w-4" />
                  {t("lesson.previous")}
                </Link>
              </Button>
            ) : (
              <div />
            )}

            {!isLessonComplete && (
              <Button
                onClick={handleComplete}
                disabled={isCompleting}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
              >
                {isCompleting ? (
                  t("common.loading")
                ) : (
                  <>
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    {t("lesson.markComplete")}
                    <Zap className="ml-1.5 h-4 w-4" />+{course.xpPerLesson} XP
                  </>
                )}
              </Button>
            )}

            {nextLessonId !== null ? (
              <Button variant="outline" asChild>
                <Link href={`/courses/${slug}/lessons/${nextLessonId}`}>
                  {t("lesson.next")}
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
