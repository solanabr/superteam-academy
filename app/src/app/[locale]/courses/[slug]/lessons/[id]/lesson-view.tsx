"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Play,
  RotateCcw,
  Lightbulb,
  Eye,
  BookOpen,
  Code,
  Star,
  ChevronLeft,
  ChevronRight,
  Circle,
} from "lucide-react";
import dynamic from "next/dynamic";
import type Monaco from "monaco-editor";
import type { editor } from "monaco-editor";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { useEnrollment } from "@/hooks/use-enrollment";
import { configureMonaco } from "@/lib/editor/monaco-config";
import { runChallenge } from "@/lib/editor/run-challenge";
import { getCoursePDA } from "@/lib/solana/enrollments";
import type { Course, Lesson, Module } from "@/types/course";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    ),
  },
);

interface LessonViewProps {
  lesson: Lesson;
  mod: Module;
  course: Course;
  slug: string;
  id: string;
}

export default function LessonView({ lesson, mod, course, slug, id }: LessonViewProps) {
  const t = useTranslations("lessons");
  const tc = useTranslations("common");
  const router = useRouter();

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIdx = allLessons.findIndex((l) => l.id === lesson.id);

  const { isLessonComplete, refreshEnrollment } = useEnrollment(course.courseId, allLessons.length);

  const [code, setCode] = useState(lesson.challenge?.starterCode ?? "");
  const [output, setOutput] = useState<string>("");
  const [testResults, setTestResults] = useState<
    { label: string; passed: boolean; expected: string; actual: string }[]
  >([]);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  const isChallenge = lesson.type === "challenge" && lesson.challenge;

  // Seed `completed` from the on-chain enrollment bitmap
  useEffect(() => {
    if (isLessonComplete(currentIdx)) {
      setCompleted(true);
    }
  }, [isLessonComplete, currentIdx]);

  // Set Monaco error markers when test results change
  useEffect(() => {
    const m = monacoRef.current;
    const e = editorRef.current;
    if (!m || !e) return;
    const model = e.getModel();
    if (!model) return;
    const markers = testResults
      .filter((r) => !r.passed)
      .map((r) => ({
        severity: m.MarkerSeverity.Error,
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: model.getLineMaxColumn(1),
        message: `${r.label}: expected "${r.expected}", got "${r.actual}"`,
        source: "tests",
      }));
    m.editor.setModelMarkers(model, "tests", markers);
    if (testResults.length > 0 && testResults.every((r) => r.passed)) {
      m.editor.setModelMarkers(model, "tests", []);
    }
  }, [testResults]);

  // Guard against double-submission (e.g. rapid clicks)
  const markingRef = useRef(false);

  /**
   * Records lesson completion on-chain via the backend signer.
   * Shows a toast with XP earned. Safe to call multiple times.
   */
  const markComplete = useCallback(async () => {
    if (markingRef.current || !course.courseId) return;
    markingRef.current = true;
    setCompleting(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.courseId, lessonIndex: currentIdx }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error ?? "Failed to record lesson completion.");
      } else {
        const data = await res.json() as { xpEarned?: number; finalized?: boolean };
        setCompleted(true);
        refreshEnrollment();
        toast.success(`+${data.xpEarned ?? 0} ${tc("xp")} earned!`);
        if (data.finalized) {
          toast.success("Course Complete! 🎓", {
            description: "You've completed all lessons.",
            duration: 8000,
          });
        }
      }
    } catch {
      toast.error("Failed to reach the server. Check your connection.");
    } finally {
      markingRef.current = false;
      setCompleting(false);
    }
  }, [course.courseId, currentIdx]);

  const runCode = useCallback(async () => {
    if (!lesson.challenge) return;
    setRunning(true);
    setOutput("");
    setTestResults([]);
    await new Promise((r) => setTimeout(r, 200));

    const { results, allPassed } = await runChallenge(code, lesson.challenge);

    setTestResults(results);
    setOutput(
      allPassed
        ? t("allTestsPassed")
        : `${results.filter((r) => r.passed).length}/${results.length} tests passed`,
    );
    if (allPassed) {
      setCompleted(true);
      trackEvent(ANALYTICS_EVENTS.CHALLENGE_PASS, { courseSlug: slug, lessonId: id, xp: course.xpPerLesson ?? 0 });
      trackEvent(ANALYTICS_EVENTS.LESSON_COMPLETE, { courseSlug: slug, lessonId: id, type: "challenge" });
      markComplete();
    } else {
      trackEvent(ANALYTICS_EVENTS.CHALLENGE_FAIL, {
        courseSlug: slug,
        lessonId: id,
        passed: results.filter((r) => r.passed).length,
        total: results.length,
      });
    }
    setRunning(false);
  }, [code, lesson, t, slug, id]);

  return (
    <div className="relative flex h-[calc(100vh-4.5rem)]">
      {/* ── Navigator Sidebar ── */}
      <div
        className={`flex flex-col border-r bg-card/50 transition-[width] duration-200 overflow-hidden shrink-0
          ${sidebarOpen ? "w-64" : "w-0"}`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {course.title}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Accordion type="multiple" defaultValue={[mod.id]}>
            {course.modules.map((m, mIdx) => (
              <AccordionItem key={m.id} value={m.id} className="border-b-0">
                <AccordionTrigger className="px-3 py-2 text-xs font-medium hover:no-underline">
                  <span className="text-left">
                    Module {mIdx + 1}: {m.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  {m.lessons.map((l) => {
                    const globalIdx = allLessons.findIndex((a) => a.id === l.id);
                    // For the current lesson use local state (instant); others use on-chain bitmap.
                    const done = l.id === lesson.id ? completed : isLessonComplete(globalIdx);
                    const current = l.id === lesson.id;
                    return (
                      <Link key={l.id} href={`/courses/${slug}/lessons/${l.id}`}>
                        <div
                          className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors
                            ${current
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted text-muted-foreground"
                            }`}
                        >
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="flex-1 truncate">{l.title}</span>
                          {l.type === "challenge" && (
                            <Code className="h-3 w-3 shrink-0 opacity-50" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* ── Sidebar open button (when collapsed) ── */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-16 z-10 h-8 w-6 rounded-l-none border border-l-0"
          onClick={() => setSidebarOpen(true)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* ── Lesson content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-3">
            <Link href={`/courses/${slug}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                {t("backToCourse")}
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">
              {mod.title} / {lesson.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {completed && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t("lessonComplete")}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Star className="h-3 w-3" />
              {course.xpPerLesson ?? 0} {tc("xp")}
            </Badge>
          </div>
        </div>

        {/* Content area */}
        {isChallenge ? (
          <ResizablePanelGroup orientation="horizontal" className="flex-1">
            <ResizablePanel defaultSize={40} minSize={25}>
              <div className="h-full overflow-y-auto p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="h-5 w-5 text-primary" />
                  <h1 className="text-xl font-bold">{lesson.title}</h1>
                </div>
                <Badge variant="secondary" className="mb-4">
                  {lesson.challenge!.language === "typescript" ? "TypeScript" : "Rust"}
                </Badge>
                <div className="max-w-none">
                  <MarkdownRenderer content={lesson.challenge!.prompt} />
                </div>

                <div className="mt-6">
                  {!showHint ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowHint(true)}
                    >
                      <Lightbulb className="h-4 w-4" />
                      {t("showHint")}
                    </Button>
                  ) : (
                    <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2.5 text-sm">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <div className="flex-1">
                        <span className="text-xs font-medium text-muted-foreground/70">
                          Hint {hintIndex + 1}/{lesson.challenge!.hints.length}
                        </span>
                        <p className="mt-0.5 text-muted-foreground">
                          {lesson.challenge!.hints[hintIndex]}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {hintIndex > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setHintIndex((i) => i - 1)}
                          >
                            Prev
                          </Button>
                        )}
                        {hintIndex < lesson.challenge!.hints.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setHintIndex((i) => i + 1)}
                          >
                            Next
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowSolution(!showSolution)}
                  >
                    <Eye className="h-4 w-4" />
                    {showSolution ? "Hide Solution" : t("showSolution")}
                  </Button>
                  {showSolution && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-[#373e47] bg-[#22272e]">
                      <div className="flex items-center border-b border-[#373e47] bg-[#2d333b] px-4 py-2">
                        <span className="text-xs font-medium text-[#768390]">Solution</span>
                      </div>
                      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-[#adbac7]">
                        <code>{lesson.challenge!.solution}</code>
                      </pre>
                    </div>
                  )}
                </div>

                {testResults.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-sm mb-2">{output}</h3>
                    <div className="space-y-2">
                      {testResults.map((r, i) => (
                        <div
                          key={i}
                          className={`rounded-lg p-3 text-sm ${
                            r.passed
                              ? "bg-green-500/10 text-green-700 dark:text-green-400"
                              : "bg-red-500/10 text-red-700 dark:text-red-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`h-4 w-4 ${r.passed ? "" : "opacity-30"}`} />
                            <span className="font-medium">{r.label}</span>
                          </div>
                          {!r.passed && (
                            <div className="mt-1 text-xs">
                              <p>{t("expected")}: {r.expected}</p>
                              <p>{t("actual")}: {r.actual}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={60} minSize={30}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <span className="text-sm font-medium">
                    {lesson.challenge!.language === "typescript" ? "TypeScript" : "Rust"}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setCode(lesson.challenge!.starterCode);
                        setTestResults([]);
                        setOutput("");
                        setCompleted(false);
                      }}
                    >
                      <RotateCcw className="h-3 w-3" />
                      {t("resetCode")}
                    </Button>
                    <Button size="sm" className="gap-1" onClick={runCode} disabled={running}>
                      <Play className="h-3 w-3" />
                      {running ? "Running..." : t("runCode")}
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <MonacoEditor
                    height="100%"
                    language={lesson.challenge!.language}
                    value={code}
                    onChange={(v) => setCode(v ?? "")}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      scrollBeyondLastLine: false,
                      padding: { top: 16 },
                      automaticLayout: true,
                    }}
                    beforeMount={(m) => {
                      monacoRef.current = m;
                      configureMonaco(m);
                    }}
                    onMount={(e) => {
                      editorRef.current = e;
                    }}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-8">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold">{lesson.title}</h1>
              </div>
              {lesson.videoUrl && (
                <div className="mb-8 aspect-video w-full overflow-hidden rounded-lg border bg-black">
                  <iframe
                    src={lesson.videoUrl}
                    title={lesson.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              <MarkdownRenderer content={lesson.content ?? ""} />
              <div className="mt-8">
                <Button
                  className="gap-2"
                  disabled={completed || completing}
                  onClick={() => {
                    trackEvent(ANALYTICS_EVENTS.LESSON_COMPLETE, {
                      courseSlug: slug,
                      lessonId: id,
                      type: "content",
                      xp: course.xpPerLesson ?? 0,
                    });
                    markComplete();
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {completed
                    ? t("lessonComplete")
                    : completing
                      ? "Submitting..."
                      : `Mark as Complete (+${course.xpPerLesson ?? 0} ${tc("xp")})`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          {prevLesson ? (
            <Link href={`/courses/${slug}/lessons/${prevLesson.id}`}>
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                {tc("previous")}
              </Button>
            </Link>
          ) : (
            <div />
          )}
          <span className="text-xs text-muted-foreground">
            {currentIdx + 1} / {allLessons.length}
          </span>
          {nextLesson ? (
            <Link href={`/courses/${slug}/lessons/${nextLesson.id}`}>
              <Button size="sm" className="gap-1">
                {tc("next")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href={`/courses/${slug}`}>
              <Button size="sm" variant="outline">
                {t("backToCourse")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
