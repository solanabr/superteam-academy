"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Terminal,
  Lightbulb,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Video,
  BookOpen,
  Clock,
} from "lucide-react";
import { MissionRail } from "@/components/lesson/mission-rail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { challengeExecutionService } from "@/services/challenge-execution-service";
import { contentService } from "@/services/content-service";
import { learningProgressService } from "@/services/learning-progress-service";
import type { CourseDetail, Lesson } from "@/types/domain";
import { useUserStore } from "@/store/user-store";
import { trackEvent } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-background animate-pulse flex items-center justify-center text-muted-foreground font-mono text-sm border border-border/50 rounded-xl">
      ...
    </div>
  ),
});

export default function LessonPage(): React.JSX.Element {
  const { t } = useLocale();
  const { data: session } = useSession();
  const params = useParams<{ slug: string; id: string }>();
  const walletAddress = useUserStore((state) => state.walletAddress);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState(t("lesson.initialOutput"));
  const [running, setRunning] = useState(false);
  const [completion, setCompletion] = useState(25);
  const [testCases, setTestCases] = useState<
    Array<{ id: string; label: string; passed: boolean }>
  >([]);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [editorPaneRatio, setEditorPaneRatio] = useState(56);
  const [isResizing, setIsResizing] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  const actorKey = session?.user?.id ?? walletAddress ?? "guest";
  const lessonStoragePrefix = useMemo(
    () => `lesson:${actorKey}:${params.slug}:${params.id}`,
    [actorKey, params.id, params.slug],
  );
  const draftStorageKey = `${lessonStoragePrefix}:draft`;
  const stateStorageKey = `${lessonStoragePrefix}:state`;
  const layoutStorageKey = `lesson-layout:${actorKey}`;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(layoutStorageKey);
    const parsed = raw ? Number(raw) : NaN;
    if (!Number.isFinite(parsed)) {
      return;
    }
    setEditorPaneRatio(Math.min(75, Math.max(35, parsed)));
  }, [layoutStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(layoutStorageKey, String(editorPaneRatio));
  }, [editorPaneRatio, layoutStorageKey]);

  useEffect(() => {
    if (!params.slug) return;

    void contentService.getCourseBySlug(params.slug).then((data) => {
      setCourse(data);
      const targetLesson =
        data?.lessons.find((entry) => entry.id === params.id) ?? null;
      setLesson(targetLesson);

      if (typeof window === "undefined") {
        setCode(targetLesson?.starterCode ?? t("lesson.fallbackStarter"));
        return;
      }

      const persistedDraft = window.localStorage.getItem(draftStorageKey);
      const parsedState = window.localStorage.getItem(stateStorageKey);
      setCode(
        persistedDraft ??
          targetLesson?.starterCode ??
          t("lesson.fallbackStarter"),
      );

      if (parsedState) {
        try {
          const state = JSON.parse(parsedState) as {
            completion?: number;
            readingProgress?: number;
            showHints?: boolean;
            showSolution?: boolean;
          };
          if (Number.isFinite(state.completion)) {
            setCompletion(Math.min(100, Math.max(0, state.completion ?? 25)));
          }
          if (Number.isFinite(state.readingProgress)) {
            setReadingProgress(
              Math.min(100, Math.max(0, state.readingProgress ?? 0)),
            );
          }
          setShowHints(Boolean(state.showHints));
          setShowSolution(Boolean(state.showSolution));
        } catch {
          // Ignore malformed persisted state and continue with defaults.
        }
      } else {
        setCompletion(25);
        setReadingProgress(0);
        setShowHints(false);
        setShowSolution(false);
      }
    });
  }, [draftStorageKey, params.id, params.slug, stateStorageKey, t]);

  useEffect(() => {
    if (!lesson) return;
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(draftStorageKey, code);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [code, draftStorageKey, lesson]);

  useEffect(() => {
    if (!lesson || typeof window === "undefined") {
      return;
    }
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(
        stateStorageKey,
        JSON.stringify({
          completion,
          readingProgress,
          showHints,
          showSolution,
        }),
      );
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [
    completion,
    lesson,
    readingProgress,
    showHints,
    showSolution,
    stateStorageKey,
  ]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    function onMouseMove(event: MouseEvent): void {
      const container = splitContainerRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const next = ((event.clientX - rect.left) / rect.width) * 100;
      setEditorPaneRatio(Math.min(75, Math.max(35, next)));
    }

    function onMouseUp(): void {
      setIsResizing(false);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing]);

  const missionSteps = useMemo(() => {
    if (lesson?.type === "video") {
      return [
        { id: "1", title: t("lesson.missionWatch"), done: completion >= 50 },
        { id: "2", title: t("lesson.missionRead"), done: completion >= 75 },
        { id: "3", title: t("lesson.missionSubmit"), done: completion >= 100 },
      ];
    }
    if (lesson?.type === "reading") {
      return [
        {
          id: "1",
          title: t("lesson.missionRead"),
          done: readingProgress >= 90,
        },
        { id: "2", title: t("lesson.missionSubmit"), done: completion >= 100 },
      ];
    }
    return [
      { id: "1", title: t("lesson.missionRead"), done: true },
      { id: "2", title: t("lesson.missionCode"), done: completion >= 65 },
      { id: "3", title: t("lesson.missionSubmit"), done: completion >= 100 },
    ];
  }, [completion, lesson?.type, readingProgress, t]);

  const lessonIndex = useMemo(() => {
    if (!course) return -1;
    return course.lessons.findIndex((entry) => entry.id === params.id);
  }, [course, params.id]);

  const previousLesson =
    lessonIndex > 0 && course ? course.lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex >= 0 && course && lessonIndex < course.lessons.length - 1
      ? course.lessons[lessonIndex + 1]
      : null;

  async function handleRunCode(): Promise<void> {
    if (!lesson || !course) return;

    setRunning(true);
    setOutput(t("lesson.compiling"));

    // Simulate compilation delay for UX
    await new Promise((r) => setTimeout(r, 800));

    try {
      const runInput = {
        challengeId: lesson.id,
        courseId: course.id,
        lessonId: lesson.id,
        code,
        language: lesson.language ?? "rust",
      } as const;

      const result = await challengeExecutionService.runChallenge(
        runInput,
        session?.backendToken,
      );
      trackEvent("challenge_run", {
        courseId: course.id,
        lessonId: lesson.id,
        passed: result.passed,
      });

      setOutput(result.output);
      setTestCases(result.testCases);
      if (result.passed) {
        setCompletion(65);
      }
    } catch (error) {
      setOutput(
        error instanceof Error ? error.message : t("lesson.challengeFailed"),
      );
    } finally {
      setRunning(false);
    }
  }

  async function handleMarkComplete(): Promise<void> {
    if (!lesson || !course) return;
    if (!walletAddress) {
      setOutput(
        (current) => `${current}\n[ERROR] ${t("lesson.connectWalletError")}`,
      );
      return;
    }

    // Simulate Tx Confirmation
    setRunning(true);
    setOutput((current) => `${current}\n\n==>\n${t("lesson.requestStatus")}`);

    try {
      const response = await learningProgressService.completeLesson(
        {
          courseId: course.id,
          lessonId: lesson.id,
          xpReward: 40,
        },
        session?.backendToken,
      );
      trackEvent("lesson_completion_requested", {
        courseId: course.id,
        lessonId: lesson.id,
        requestId: response.requestId,
      });

      await new Promise((r) => setTimeout(r, 1200));

      setCompletion(100);
      setOutput(
        (current) => `${current}\n[SUCCESS] ${t("lesson.completionSuccess")}`,
      );
    } catch {
      setOutput(
        (current) => `${current}\n[ERROR] ${t("lesson.completionFailed")}`,
      );
    } finally {
      setRunning(false);
    }
  }

  function handleReadingScroll(e: React.UIEvent<HTMLDivElement>): void {
    const el = e.currentTarget;
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 0) return;
    const progress = Math.min(
      100,
      Math.round((el.scrollTop / scrollable) * 100),
    );
    setReadingProgress(progress);
    if (progress >= 90) {
      setCompletion((prev) => Math.max(prev, 75));
    }
  }

  if (!course || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground space-y-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
          <div className="absolute inset-2 rounded-full border-t-2 border-secondary animate-spin opacity-50" />
        </div>
        <p className="font-medium font-mono animate-pulse">
          {t("lesson.connectingRuntime")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto pb-10 xl:h-[calc(100vh-8rem)]">
      <MissionRail
        courseTitle={course.title}
        xpReward={40}
        completion={completion}
        steps={missionSteps}
      />

      <div className="flex-1 flex flex-col min-w-0 space-y-4 h-full">
        {/* Header Ribbon */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-background/50 border border-border/50 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full shrink-0"
              asChild
            >
              <Link href={`/courses/${course.slug}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="w-px h-6 bg-border/50 hidden sm:block" />
            <div>
              <Badge variant="outline" className="mb-1 text-[10px] py-0">
                {lesson.module}
              </Badge>
              <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                {lesson.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {completion === 100 && (
              <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/30 py-1.5 px-3">
                <CheckCircle2 className="h-4 w-4 mr-1.5" />{" "}
                {t("lesson.completed")}
              </Badge>
            )}
            {lesson.type === "challenge" && (
              <Button
                variant={completion >= 65 ? "secondary" : "default"}
                className="font-bold relative overflow-hidden group"
                onClick={handleRunCode}
                disabled={running || completion === 100}
              >
                {running && completion < 65 ? (
                  t("lesson.compiling")
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2 fill-current group-hover:scale-110 transition-transform" />
                    {t("lesson.runCode")}
                  </>
                )}
              </Button>
            )}

            <Button
              className={`font-bold transition-all ${
                lesson.type === "video" || lesson.type === "reading"
                  ? completion >= 75 && completion < 100
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(52,211,153,0.4)] animate-pulse"
                    : ""
                  : completion >= 65 && completion < 100
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(52,211,153,0.4)] animate-pulse"
                    : ""
              }`}
              onClick={handleMarkComplete}
              disabled={
                (lesson.type === "video" || lesson.type === "reading"
                  ? completion < 75
                  : completion < 65) ||
                completion === 100 ||
                running
              }
            >
              {running && completion >= (lesson.type === "video" ? 75 : 65)
                ? t("lesson.submittingTx")
                : t("lesson.submitMission")}
            </Button>
          </div>
        </header>

        {/* Split Editor/Content Area */}
        {lesson.type === "reading" ? (
          /* ── Reading lesson layout ── */
          <div className="flex-1 rounded-2xl border border-border/50 bg-background/40 backdrop-blur overflow-hidden flex flex-col min-h-[500px] xl:min-h-0">
            {/* Scroll progress bar */}
            <div className="h-[3px] bg-border/20 relative shrink-0">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary transition-[width] duration-300 ease-out"
                style={{ width: `${readingProgress}%` }}
              />
            </div>

            {/* Header */}
            <div className="px-6 py-3 border-b border-border/50 bg-muted/20 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                {t("lesson.briefingDocument")}
              </span>
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground/50">
                  <Clock className="h-3 w-3" />
                  ~5 min read
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setShowHints((v) => !v)}
                >
                  <Lightbulb className="h-3.5 w-3.5 mr-1" />
                  {t("lesson.hints")}
                </Button>
              </div>
            </div>

            {/* Content */}
            <div
              className="flex-1 overflow-y-auto custom-scrollbar"
              onScroll={handleReadingScroll}
            >
              <div className="max-w-3xl mx-auto px-6 py-10 sm:px-10 sm:py-14">
                <div className="prose prose-invert prose-lg prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline prose-headings:font-display prose-headings:font-bold prose-code:text-secondary prose-code:bg-secondary/10 prose-code:rounded prose-pre:bg-black/60 prose-pre:border prose-pre:border-border/40 max-w-none">
                  <ReactMarkdown>{lesson.markdown}</ReactMarkdown>
                </div>

                {showHints && (
                  <div className="mt-10 p-5 rounded-xl bg-primary/5 border border-primary/20 flex gap-3">
                    <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-primary mb-1">
                        {t("lesson.hints")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("lesson.hintText")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-10 flex items-center justify-between text-xs text-muted-foreground/40 border-t border-border/20 pt-6">
                  <span className="uppercase tracking-widest">
                    {lesson.module}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" />
                    {readingProgress < 100
                      ? `${readingProgress}% read`
                      : "Read complete"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : lesson.type === "video" ? (
          /* ── Video lesson layout ── */
          <div className="flex flex-col gap-6 flex-1 min-h-[500px] xl:min-h-0">
            {/* Video Player */}
            <div className="rounded-2xl border border-border/50 bg-black overflow-hidden shadow-2xl">
              <div className="p-2 border-b border-border/20 bg-black/60 flex items-center gap-2">
                <span className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/50" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/50" />
                  <span className="h-3 w-3 rounded-full bg-green-500/50" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5 ml-2">
                  <Video className="h-3.5 w-3.5" /> {t("lesson.videoContent")}
                </span>
              </div>
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  src={lesson.videoUrl}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                  onLoad={() => setCompletion((prev) => Math.max(prev, 50))}
                />
              </div>
            </div>

            {/* Markdown Description */}
            <div className="rounded-2xl border border-border/50 bg-background/40 backdrop-blur overflow-hidden flex flex-col">
              <div className="p-3 border-b border-border/50 bg-muted/20">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("lesson.briefingDocument")}
                </span>
              </div>
              <div
                className="p-6 sm:p-8 overflow-y-auto prose prose-invert prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:underline prose-headings:font-display max-w-none custom-scrollbar"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const scrolledToBottom =
                    el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
                  if (scrolledToBottom) {
                    setCompletion((prev) => Math.max(prev, 75));
                  }
                }}
              >
                <ReactMarkdown>{lesson.markdown}</ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          /* ── Reading / Challenge layout ── */
          <div
            ref={splitContainerRef}
            className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px] xl:min-h-0"
          >
            {/* Markdown Content */}
            <div
              className="rounded-2xl border border-border/50 bg-background/40 backdrop-blur overflow-hidden flex flex-col min-w-0"
              style={{
                flexBasis: `calc(${100 - editorPaneRatio}% - 12px)`,
              }}
            >
              <div className="p-3 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  {t("lesson.briefingDocument")}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowHints((value) => !value)}
                  >
                    <Lightbulb className="h-4 w-4 mr-1" /> {t("lesson.hints")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSolution((value) => !value)}
                  >
                    <FlaskConical className="h-4 w-4 mr-1" />{" "}
                    {t("lesson.solution")}
                  </Button>
                </div>
              </div>
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 prose prose-invert prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:underline prose-headings:font-display max-w-none custom-scrollbar pb-10">
                <ReactMarkdown>{lesson.markdown}</ReactMarkdown>
                {showHints ? (
                  <Card className="mt-6 p-4 bg-primary/5 border-primary/20">
                    <p className="text-sm">
                      <strong>{t("lesson.hints")}:</strong>{" "}
                      {t("lesson.hintText")}
                    </p>
                  </Card>
                ) : null}
                {showSolution ? (
                  <Card className="mt-4 p-4 bg-secondary/5 border-secondary/20">
                    <p className="text-sm mb-2">
                      <strong>{t("lesson.referenceDirection")}</strong>
                    </p>
                    <pre className="text-xs whitespace-pre-wrap">
                      {lesson.starterCode ?? t("lesson.hiddenSolution")}
                    </pre>
                  </Card>
                ) : null}
              </div>
            </div>

            <div
              className="hidden lg:flex w-3 items-stretch justify-center cursor-col-resize select-none"
              onMouseDown={() => setIsResizing(true)}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize lesson editor panes"
            >
              <div className="w-[3px] rounded-full bg-border/70 hover:bg-primary transition-colors my-10" />
            </div>

            {/* Code Editor & Terminal */}
            <div
              className="flex flex-col gap-4 min-h-0 h-full min-w-0"
              style={{
                flexBasis: `calc(${editorPaneRatio}% - 12px)`,
              }}
            >
              <div className="flex-1 rounded-2xl border border-border/50 overflow-hidden relative shadow-lg bg-[#1e1e1e] flex flex-col min-h-[400px]">
                <div className="p-2 border-b border-border/20 bg-black/40 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-red-500/50" />
                      <span className="h-3 w-3 rounded-full bg-yellow-500/50" />
                      <span className="h-3 w-3 rounded-full bg-green-500/50" />
                    </span>
                    <span className="text-xs font-mono ml-4 text-muted-foreground/50">
                      {lesson.language === "rust" ? "lib.rs" : "index.ts"}
                    </span>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <MonacoEditor
                    defaultLanguage={lesson.language ?? "rust"}
                    value={code}
                    onChange={(value) => setCode(value ?? "")}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "var(--font-mono)",
                      scrollBeyondLastLine: false,
                      padding: { top: 20 },
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      renderLineHighlight: "all",
                    }}
                    className="absolute inset-0"
                  />
                </div>
              </div>

              {/* Terminal Output */}
              <div className="h-48 shrink-0 rounded-2xl border border-border/50 bg-black/90 p-4 flex flex-col shadow-inner">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  <Terminal className="h-4 w-4" /> {t("lesson.buildOutput")}
                </div>
                <pre className="flex-1 overflow-y-auto font-mono text-[13px] text-green-400/90 whitespace-pre-wrap custom-scrollbar">
                  {output}
                </pre>
              </div>

              {testCases.length > 0 ? (
                <Card className="p-4 bg-background/50 border-border/50">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    {t("lesson.testCases")}
                  </h3>
                  <div className="space-y-2">
                    {testCases.map((testCase) => (
                      <div
                        key={testCase.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{testCase.label}</span>
                        <Badge
                          variant={
                            testCase.passed ? "secondary" : "destructive"
                          }
                        >
                          {testCase.passed
                            ? t("lesson.passed")
                            : t("lesson.failed")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            disabled={!previousLesson}
            asChild={Boolean(previousLesson)}
          >
            {previousLesson ? (
              <Link
                href={`/courses/${course.slug}/lessons/${previousLesson.id}`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />{" "}
                {t("lesson.previousLesson")}
              </Link>
            ) : (
              <span>
                <ChevronLeft className="h-4 w-4 mr-1" />{" "}
                {t("lesson.previousLesson")}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            disabled={!nextLesson}
            asChild={Boolean(nextLesson)}
          >
            {nextLesson ? (
              <Link href={`/courses/${course.slug}/lessons/${nextLesson.id}`}>
                {t("lesson.nextLesson")}{" "}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            ) : (
              <span>
                {t("lesson.nextLesson")}{" "}
                <ChevronRight className="h-4 w-4 ml-1" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
