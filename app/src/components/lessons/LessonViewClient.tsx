"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { CourseDetail, LessonRef, ModuleRef } from "@/sanity/lib/queries";
import { ChallengeRunner } from "./ChallengeRunner";
import { CodeEditor, SupportedLanguage } from "./CodeEditor";
import { TerminalOutput } from "./TerminalOutput";
import { useAppUser } from "@/hooks/useAppUser";
import { Link } from "@/i18n/routing";
import { useLessonStore } from "@/store/lesson-store";
import { usePlaygroundStore } from "@/store/playground-store";
import { useTranslations } from "next-intl";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

type LessonViewClientProps = {
  course: CourseDetail;
  lesson: LessonRef;
};

function flattenLessons(modules: ModuleRef[] | undefined) {
  const list: Array<{ lesson: LessonRef; index: number }> = [];
  if (!modules) return list;
  let idx = 0;
  for (const mod of modules.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))) {
    const lessons = mod.lessons ?? [];
    for (const lesson of lessons.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))) {
      list.push({ lesson, index: idx });
      idx++;
    }
  }
  return list;
}

function portableTextToParagraphs(content: unknown): string[] {
  if (!Array.isArray(content)) return [];
  return (content as any[])
    .filter((b) => b && b._type === "block")
    .map((b) =>
      (Array.isArray(b.children) ? b.children : [])
        .map((c: any) => c?.text ?? "")
        .join("")
        .trim()
    )
    .filter(Boolean);
}

const EMPTY_STATS: { memory?: string; cpuTime?: string } = {};

export function LessonViewClient({ course, lesson }: LessonViewClientProps) {
  const t = useTranslations("lessons");
  const lessonId = lesson._id;
  const getCodeFromEditorRef = useRef<(() => string) | null>(null);

  const flattened = useMemo(() => flattenLessons(course.modules), [course.modules]);
  const current = flattened.find((l) => l.lesson._id === lesson._id);
  const currentIndex = current?.index ?? 0;
  const prevLesson = flattened[currentIndex - 1]?.lesson;
  const nextLesson = flattened[currentIndex + 1]?.lesson;

  const { user } = useAppUser();
  const contentParagraphs = portableTextToParagraphs(lesson.content);

  // Use playground store for persisted editor state across lesson navigation
  const playgroundCode = usePlaygroundStore((s) => s.code[lessonId] ?? "");
  const playgroundOutput = usePlaygroundStore((s) => s.output[lessonId] ?? "");
  const playgroundStatus = usePlaygroundStore((s) => s.status[lessonId] ?? "idle");
  const executionStats = usePlaygroundStore((s) => s.stats[lessonId] ?? EMPTY_STATS);
  const dailyLimitReached = usePlaygroundStore((s) => s.dailyLimitReached);
  const language = usePlaygroundStore((s) => s.language[lessonId]) ??
    ((lesson.lessonType === "challenge" && (lesson.challenge?.language as SupportedLanguage)) || "rust");

  const setCode = usePlaygroundStore((s) => s.setCode);
  const setOutput = usePlaygroundStore((s) => s.setOutput);
  const setStatus = usePlaygroundStore((s) => s.setStatus);
  const setStats = usePlaygroundStore((s) => s.setStats);
  const setLanguage = usePlaygroundStore((s) => s.setLanguage);
  const setDailyLimitReached = usePlaygroundStore((s) => s.setDailyLimitReached);

  // Use lesson store for instant completion state (fixes flicker bug)
  const isCompleted = useLessonStore((state) =>
    state.isLessonCompleted(course.slug, currentIndex)
  );
  const isCompleting = useLessonStore((state) =>
    state.loading[course.slug] ?? false
  );
  const markComplete = useLessonStore((state) => state.markComplete);
  const fetchCompletionStatus = useLessonStore((state) => state.fetchCompletionStatus);

  // Fetch completion status on mount (cached in store)
  useEffect(() => {
    if (user?.walletAddress) {
      fetchCompletionStatus(user.walletAddress, course.slug);
    }
  }, [user?.walletAddress, course.slug, fetchCompletionStatus]);

  const handleComplete = async () => {
    if (!user?.walletAddress || isCompleting || isCompleted) return;

    try {
      await markComplete(user.walletAddress, course.slug, currentIndex);
    } catch (error) {
      console.error("Failed to mark lesson complete:", error);
    }
  };

  const handleRunCode = async () => {
    const codeToRun = getCodeFromEditorRef.current?.() || playgroundCode;
    if (!codeToRun.trim()) {
      setOutput(lessonId, t("error_no_code") + "\n");
      setStatus(lessonId, "error");
      return;
    }
    setStatus(lessonId, "running");
    setOutput(lessonId, "");
    setStats(lessonId, {});
    setDailyLimitReached(false);
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code: codeToRun }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setStatus(lessonId, "error");
        setOutput(lessonId, `> error: ${errorData.stderr || errorData.error || "API request failed"}\n`);
        return;
      }
      const data = await res.json();
      setDailyLimitReached(Boolean(data.dailyLimitReached));
      const lines: string[] = [];
      if (data.stdout) lines.push(data.stdout);
      if (data.stderr) lines.push(data.stderr);
      const combinedOutput = lines.join("\n");
      setOutput(lessonId, combinedOutput || (data.passed ? t("no_output") + "\n" : t("execution_failed") + "\n"));
      if (data.memory || data.cpuTime) {
        setStats(lessonId, { memory: data.memory, cpuTime: data.cpuTime });
      }
      setStatus(lessonId, data.passed ? "success" : "error");
    } catch (err) {
      console.error("run-code error", err);
      setStatus(lessonId, "error");
      setOutput(lessonId, `> error: ${err instanceof Error ? err.message : "Failed to contact runner API"}\n`);
    }
  };

  const isChallenge = lesson.lessonType === "challenge";

  return (
    <div className="bg-[#0A0A0B] text-[#EDEDEF] font-body overflow-hidden h-screen flex flex-col relative selection:bg-solana/20 selection:text-solana">
      {/* Ambient Noise Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-noise opacity-40 mix-blend-overlay"></div>

      {/* Top Navigation */}
      <header className="relative z-20 flex items-center justify-between border-b border-white/10 bg-[#0A0A0B]/80 backdrop-blur-md px-6 py-3 h-16 shrink-0">
        <div className="flex items-center gap-6">
          {/* Logo Area */}
          <Link href="/dashboard" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
            <div className="size-6 text-solana">
              <span className="material-symbols-outlined text-2xl">code_blocks</span>
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight">Superteam</h2>
          </Link>
          {/* Breadcrumbs */}
          <div className="hidden md:flex items-center gap-2 ml-4">
            <span className="text-white/20">/</span>
            <Link className="text-text-secondary hover:text-solana text-sm font-medium transition-colors" href="/courses">{t("breadcrumb_courses")}</Link>
            <span className="text-white/20">/</span>
            <Link className="text-text-secondary hover:text-solana text-sm font-medium transition-colors" href={`/courses/${course.slug}`}>{course.title}</Link>
            <span className="text-white/20">/</span>
            <span className="text-white text-sm font-medium bg-white/5 px-2 py-0.5 rounded border border-white/10 truncate max-w-[200px]">{lesson.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Progress Pill */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <span className="text-xs text-text-secondary font-mono">XP: 8,420</span>
            <div className="w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-1 text-rust text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
              5
            </div>
          </div>
          {/* Profile */}
          <div className="size-9 rounded-full bg-solana/20 flex items-center justify-center border border-white/10 text-xs font-bold text-solana">
            {user?.walletAddress ? user.walletAddress.slice(0, 2).toUpperCase() : "??"}
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="relative z-10 flex flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          {/* LEFT PANE: Lesson Content */}
          <ResizablePanel defaultSize={40} minSize={25} className="bg-[#0A0A0B]/50">
            <section className="flex flex-col h-full border-r border-white/10 overflow-hidden relative group/lesson">
              {/* Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-8 pb-32 custom-scrollbar">
                {/* Lesson Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-rust/20 text-rust border border-rust/30">{t("module_label", { index: currentIndex + 1 })}</span>
                    <span className="text-text-secondary text-xs font-mono">{t("est_time", { mins: 15 })}</span>
                  </div>
                  <h1 className="font-display text-4xl font-bold leading-tight mb-4 text-white tracking-tight">{lesson.title}</h1>
                  {contentParagraphs.length > 0 && (
                    <p className="text-[15px] text-text-secondary leading-[1.7] mb-6">
                      {contentParagraphs[0]}
                    </p>
                  )}
                </div>

                {/* Lesson Body */}
                <div className="space-y-8 text-[#EDEDEF]">
                  <div className="prose prose-invert max-w-none text-[15px] leading-relaxed">
                    {contentParagraphs.slice(1).map((p, idx) => (
                      <p key={idx} className="text-text-secondary leading-[1.7] mb-6">{p}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky Footer Navigation */}
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B] to-transparent border-t border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  {prevLesson ? (
                    <Link href={`/courses/${course.slug}/lessons/${prevLesson._id}`} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                      <span className="material-symbols-outlined text-lg">arrow_back</span>
                      {t("previous")}
                    </Link>
                  ) : <div></div>}

                  {isCompleted && !nextLesson ? (
                    /* Last lesson completed — finished state */
                    <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-solana/20 text-solana border border-solana/30 cursor-default">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      {t("course_complete_grad")}
                    </div>
                  ) : isCompleted && nextLesson ? (
                    /* Lesson completed — go to next */
                    <Link
                      href={`/courses/${course.slug}/lessons/${nextLesson._id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-solana text-[#0A0A0B] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)]"
                    >
                      {t("next_lesson")}
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </Link>
                  ) : (
                    /* Not completed yet */
                    <button
                      onClick={async () => {
                        if (!isCompleted) await handleComplete();
                        if (nextLesson) {
                          window.location.href = `/courses/${course.slug}/lessons/${nextLesson._id}`;
                        }
                      }}
                      disabled={isCompleting}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-solana text-[#0A0A0B] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)] disabled:opacity-50"
                    >
                      {isCompleting ? t("completing") : (nextLesson ? t("continue") : t("finish_course"))}
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          </ResizablePanel>

          <ResizableHandle withHandle className="w-1 bg-white/5 hover:bg-solana/30 transition-colors cursor-col-resize active:bg-solana/50" />

          {/* RIGHT PANE: Editor & Terminal */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize={75} minSize={40}>
                <section className="flex flex-col h-full bg-[#050506] relative">
                  {/* Lesson Completed Overlay */}
                  {isCompleted && (
                    <div className="absolute inset-0 z-30 bg-[#050506]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                      <div className="size-20 rounded-full bg-solana/10 flex items-center justify-center border border-solana/20 shadow-[0_0_40px_rgba(20,241,149,0.15)]">
                        <span className="material-symbols-outlined text-5xl text-solana">check_circle</span>
                      </div>
                      <div className="text-center">
                        <h3 className="text-2xl font-display font-bold text-white mb-2">{t("lesson_completed")}</h3>
                        <p className="text-text-secondary text-sm max-w-xs">
                          {nextLesson
                            ? t("next_lesson_cta")
                            : t("course_complete_cta")}
                        </p>
                      </div>
                      {nextLesson && (
                        <Link
                          href={`/courses/${course.slug}/lessons/${nextLesson._id}`}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-solana text-[#0A0A0B] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)]"
                        >
                          {t("next_lesson")}
                          <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Editor Top Bar */}
                  <div className="h-10 flex items-center justify-between bg-[#0A0A0B] border-b border-white/10 px-2 select-none">
                    <div className="flex items-center h-full pt-2">
                      <div className="h-full px-4 flex items-center gap-2 bg-[#050506] border-t border-x border-solana/30 rounded-t text-sm font-mono text-white relative group">
                        <span className="material-symbols-outlined text-base text-rust">code</span>
                        lib.rs
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-solana shadow-[0_0_8px_rgba(20,240,148,0.6)]"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pr-2">
                      {!isCompleted && (
                        <button className="text-text-secondary hover:text-white transition-colors p-1 rounded hover:bg-white/5" onClick={() => setCode(lessonId, "")} title={t("reset_code")}>
                          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Code Editor Area */}
                  <div className="flex-1 relative overflow-hidden flex font-mono text-[15px] leading-relaxed bg-[#050506]">
                    <CodeEditor
                      initialValue={playgroundCode || lesson.challenge?.starterCode || "// Write your Solana program here..."}
                      language={language}
                      onChange={(code) => setCode(lessonId, code)}
                      onGetCode={(getCode) => { getCodeFromEditorRef.current = getCode; }}
                      className="h-full w-full"
                    />

                    {/* Floating Run Action — hidden when completed */}
                    {!isCompleted && (
                      <div className="absolute bottom-6 right-6 z-20">
                        <button
                          onClick={handleRunCode}
                          disabled={playgroundStatus === "running"}
                          className="flex items-center gap-3 pl-5 pr-6 py-3.5 bg-white text-black rounded-xl font-bold shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all group disabled:opacity-70"
                        >
                          <span className={`material-symbols-outlined ${playgroundStatus === "running" ? "animate-spin" : "group-hover:animate-spin"}`}>
                            {playgroundStatus === "running" ? "progress_activity" : "settings"}
                          </span>
                          <span>{playgroundStatus === "running" ? t("building") : t("build_deploy")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </ResizablePanel>

              <ResizableHandle withHandle className="h-1 bg-white/5 hover:bg-solana/30 transition-colors cursor-row-resize active:bg-solana/50" />

              <ResizablePanel defaultSize={25} minSize={15}>
                {/* Terminal Pane */}
                <div className="h-full bg-[#020202] flex flex-col relative overflow-hidden">
                  <TerminalOutput
                    output={playgroundOutput}
                    status={playgroundStatus}
                    executionStats={executionStats}
                    dailyLimitReached={dailyLimitReached}
                    onClear={() => setOutput(lessonId, "")}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
