"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { CourseDetail, LessonRef, ModuleRef } from "@/sanity/lib/queries";
import { ChallengeRunner } from "./ChallengeRunner";
import dynamic from "next/dynamic";
import type { SupportedLanguage } from "./CodeEditor";

const CodeEditor = dynamic(() => import("./CodeEditor").then((mod) => mod.CodeEditor), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-void/50 flex items-center justify-center text-text-muted text-sm font-mono">Loading Editor...</div>
});
import { TerminalOutput } from "./TerminalOutput";
import { useAppUser } from "@/hooks/useAppUser";
import { Link, useRouter } from "@/i18n/routing";
import { useLessonStore } from "@/store/lesson-store";
import { useWallets, useSignTransaction } from "@privy-io/react-auth/solana";
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

import {
  CodeXml,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Code2,
  RotateCcw,
  Settings,
  FlaskConical,
  ChevronDown
} from "lucide-react";

export function LessonViewClient({ course, lesson }: LessonViewClientProps) {
  const t = useTranslations("lessons");
  const router = useRouter();
  const lessonId = lesson._id;
  const getCodeFromEditorRef = useRef<(() => string) | null>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "checking" | "passed" | "failed">("idle");
  const [testExpected, setTestExpected] = useState<string>("");
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();

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
    state.isLessonCompleted(course._id, currentIndex)
  );
  const isCompleting = useLessonStore((state) =>
    state.loading[course._id] ?? false
  );
  const markComplete = useLessonStore((state) => state.markComplete);
  const fetchCompletionStatus = useLessonStore((state) => state.fetchCompletionStatus);

  // Fetch completion status on mount (cached in store)
  useEffect(() => {
    if (user?.walletAddress) {
      fetchCompletionStatus(user.walletAddress, course._id);
    }
  }, [user?.walletAddress, course._id, fetchCompletionStatus]);

  const handleComplete = async () => {
    if (!user?.walletAddress || isCompleting || isCompleted) return;

    try {
      await markComplete(user.walletAddress, course._id, currentIndex);
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
    setTestResult("idle");
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

      // --- Test case comparison (independent from lesson completion) ---
      const testCases = lesson.challenge?.testCases;
      if (testCases && testCases.length > 0) {
        const firstCase = testCases[0];
        const expected = (firstCase.expected ?? "").trim();

        // If expected is empty/null, auto-pass (creator left it blank — no output checking required)
        if (!expected) {
          setTestResult("checking");
          await new Promise((r) => setTimeout(r, 400));
          setTestResult("passed");
        } else if (combinedOutput) {
          // Only compare if there's actual output to compare against
          setTestResult("checking");
          await new Promise((r) => setTimeout(r, 600)); // brief spinner for UX
          const actual = combinedOutput.trim();
          setTestExpected(expected);
          setTestResult(actual === expected ? "passed" : "failed");
        }
      }
    } catch (err) {
      console.error("run-code error", err);
      setStatus(lessonId, "error");
      setOutput(lessonId, `> error: ${err instanceof Error ? err.message : "Failed to contact runner API"}\n`);
    }
  };

  const isChallenge = lesson.lessonType === "challenge";

  // Default boilerplate code per language when user switches
  const LANGUAGE_BOILERPLATE: Record<string, string> = {
    rust: `fn main() {
    println!("Hello from Solana!");
}
`,
    javascript: `// JavaScript
console.log("Hello from Superteam Academy!");
`,
    typescript: `// TypeScript
console.log("Hello from Superteam Academy!");
`,
    json: `{}`,
  };

  // Language display info
  const LANGUAGE_INFO: Record<string, { label: string; file: string }> = {
    rust: { label: "Rust", file: "lib.rs" },
    javascript: { label: "JavaScript", file: "index.js" },
    typescript: { label: "TypeScript", file: "index.ts" },
    json: { label: "JSON", file: "data.json" },
  };

  const SUPPORTED_LANGUAGES: Array<"rust" | "javascript" | "typescript"> = ["rust", "javascript", "typescript"];

  const handleLanguageSwitch = (newLang: "rust" | "javascript" | "typescript") => {
    if (newLang === language) return;
    setLanguage(lessonId, newLang);
    // Only set boilerplate if editor is empty or has the default placeholder
    const currentCode = getCodeFromEditorRef.current?.() || playgroundCode;
    if (!currentCode || currentCode === "// Write your Solana program here...") {
      setCode(lessonId, LANGUAGE_BOILERPLATE[newLang] || "");
    }
    // Reset test result on language change
    setTestResult("idle");
  };

  const langInfo = LANGUAGE_INFO[language] || LANGUAGE_INFO["rust"];

  return (
    <div className="bg-[#0A0A0B] text-[#EDEDEF] font-body overflow-hidden flex flex-col relative selection:bg-solana/20 selection:text-solana mx-auto max-w-[1600px] my-4 rounded-2xl border border-white/5 shadow-2xl" style={{ height: 'calc(100vh - 2rem)' }}>
      {/* Ambient Noise Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-noise opacity-15 mix-blend-overlay"></div>

      {/* Top Navigation */}
      <header className="relative z-20 flex items-center justify-between border-b border-white/10 bg-[#0A0A0B]/80 backdrop-blur-md px-6 py-3 h-16 shrink-0">
        <div className="flex items-center gap-6">
          {/* Logo Area */}
          <Link href="/dashboard" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
            <div className="size-6 text-solana">
              <CodeXml size={24} />
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

                  {/* Challenge Objectives Section */}
                  {isChallenge && (
                    <div className="mt-8 p-5 rounded-xl bg-solana/5 border border-solana/10 relative overflow-hidden group/obj">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/obj:opacity-20 transition-opacity">
                        <FlaskConical size={48} className="text-solana" />
                      </div>
                      <h3 className="text-sm font-bold text-solana uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-solana animate-pulse"></span>
                        Challenge Objectives
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="size-5 rounded-full bg-solana/20 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 size={12} className="text-solana" />
                          </div>
                          <p className="text-sm text-text-primary leading-relaxed font-medium">
                            Implement the logic to produce the exact expected output shown in the terminal validation.
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="size-5 rounded-full bg-solana/20 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 size={12} className="text-solana" />
                          </div>
                          <p className="text-sm text-text-primary leading-relaxed font-medium">
                            Ensure your code returns the correct result to pass the automated test case.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer Navigation */}
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B] to-transparent border-t border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  {prevLesson ? (
                    <Link href={`/courses/${course.slug}/lessons/${prevLesson._id}`} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                      <ArrowLeft size={18} />
                      {t("previous")}
                    </Link>
                  ) : <div></div>}

                  {isCompleted && !nextLesson ? (
                    /* Last lesson completed — finished state */
                    <Link
                      href={`/courses/${course.slug}`}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-solana text-[#0A0A0B] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)]"
                    >
                      <CheckCircle2 size={18} />
                      Return to Course Page
                    </Link>
                  ) : isCompleted && nextLesson ? (
                    /* Lesson completed — go to next */
                    <Link
                      href={`/courses/${course.slug}/lessons/${nextLesson._id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-solana text-[#0A0A0B] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)]"
                    >
                      {t("next_lesson")}
                      <ArrowRight size={18} />
                    </Link>
                  ) : (
                    /* Not completed yet */
                    <Button
                      onClick={async () => {
                        if (!isCompleted) await handleComplete();
                      }}
                      disabled={isCompleting}
                      variant="default"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-solana text-[#0A0A0B] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)] disabled:opacity-50"
                    >
                      {isCompleting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          {t("completing")}
                        </>
                      ) : (
                        <>
                          {nextLesson ? t("continue") : t("finish_course")}
                          <ArrowRight size={18} />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </section>
          </ResizablePanel>

          <ResizableHandle withHandle className="w-1 bg-white/5 hover:bg-solana/30 transition-colors cursor-col-resize active:bg-solana/50" />

          {/* RIGHT PANE: Editor & Terminal */}
          <ResizablePanel defaultSize={60} minSize={30} className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#0A0A0B]">
              <div className="flex-1 flex flex-col min-h-0">
                <section className="flex-1 flex flex-col bg-[#050506] relative">
                  {/* Lesson Completed Overlay */}
                  {isCompleted && (
                    <div className="absolute inset-0 z-30 bg-[#050506]/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                      <div className="size-20 rounded-full bg-solana/10 flex items-center justify-center border border-solana/20 shadow-[0_0_40px_rgba(20,241,149,0.15)]">
                        <CheckCircle2 size={48} className="text-solana" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-2xl font-display font-bold text-white mb-2">{t("lesson_completed")}</h3>
                        <p className="text-text-secondary text-sm max-w-xs">
                          {nextLesson
                            ? t("next_lesson_cta")
                            : t("course_complete_cta")}
                        </p>
                      </div>
                      {nextLesson ? (
                        <Link
                          href={`/courses/${course.slug}/lessons/${nextLesson._id}`}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-solana text-[#0A0A0B] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)]"
                        >
                          {t("next_lesson")}
                          <ArrowRight size={18} />
                        </Link>
                      ) : (
                        <Link
                          href={`/courses/${course.slug}`}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-solana text-[#0A0A0B] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)]"
                        >
                          Return to Course Page
                          <CheckCircle2 size={18} />
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Editor Top Bar */}
                  <div className="h-11 flex items-center justify-between bg-[#0A0A0B] border-b border-white/10 px-2 select-none">
                    {/* Custom Language Selector Dropdown */}
                    <div className="flex items-center h-full px-3 gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                          disabled={isCompleted}
                          className="flex items-center gap-2 bg-[#0A0A0B]/80 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-[11px] font-mono font-medium text-white/90 hover:bg-white/5 hover:border-white/20 transition-all focus:outline-none"
                        >
                          <span>{LANGUAGE_INFO[language]?.label} ({LANGUAGE_INFO[language]?.file})</span>
                          <ChevronDown size={12} className={`transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isLangMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)} />
                            <div className="absolute top-full left-0 mt-2 w-52 bg-[#0A0A0B] border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top">
                              {SUPPORTED_LANGUAGES.map((lang) => (
                                <button
                                  key={lang}
                                  onClick={() => {
                                    handleLanguageSwitch(lang as any);
                                    setIsLangMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-[11px] font-mono transition-colors hover:bg-white/5 ${language === lang ? 'text-solana bg-solana/5' : 'text-white/70'}`}
                                >
                                  {LANGUAGE_INFO[lang]?.label} ({LANGUAGE_INFO[lang]?.file})
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                      {!isCompleted && (
                        <>
                          <button
                            onClick={handleRunCode}
                            disabled={playgroundStatus === "running"}
                            className="flex items-center gap-2 px-4 py-1.5 bg-solana/10 hover:bg-solana/20 border border-solana/40 text-solana rounded-lg text-xs font-bold font-mono transition-all hover:shadow-[0_0_12px_rgba(20,241,149,0.2)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                          >
                            {playgroundStatus === "running" ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Settings size={13} className="group-hover:animate-spin" />
                            )}
                            {playgroundStatus === "running" ? "Running..." : "Run Code"}
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-text-secondary hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                            onClick={() => {
                              setCode(lessonId, LANGUAGE_BOILERPLATE[language] || "");
                              setTestResult("idle");
                            }}
                            title={t("reset_code")}
                          >
                            <RotateCcw size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Code Editor Area */}
                  <div className="flex-1 relative overflow-hidden flex font-mono text-[15px] leading-relaxed bg-[#050506]">
                    <CodeEditor
                      initialValue={playgroundCode || lesson.challenge?.starterCode || LANGUAGE_BOILERPLATE[language] || "// Write your code here..."}
                      language={language}
                      onChange={(code) => setCode(lessonId, code)}
                      onGetCode={(getCode) => { getCodeFromEditorRef.current = getCode; }}
                      className="h-full w-full"
                    />

                  </div>
                </section>

                {/* TERMINAL & TEST RESULTS AREA */}
                <div className="shrink-0 border-t border-white/10 bg-[#020202] flex flex-col">
                  {/* Terminal Pane - height adjusted to be more compact */}
                  <div className="h-56 flex flex-col relative overflow-hidden">
                    <TerminalOutput
                      output={playgroundOutput}
                      status={playgroundStatus}
                      executionStats={executionStats}
                      dailyLimitReached={dailyLimitReached}
                      onClear={() => { setOutput(lessonId, ""); setTestResult("idle"); }}
                    />
                  </div>

                  {/* Test Result Banner - flush with terminal */}
                  {testResult !== "idle" && lesson.challenge?.testCases && lesson.challenge.testCases.length > 0 && (
                    <div className={`shrink-0 h-[68px] border-t px-6 flex items-center gap-4 transition-all z-20 ${testResult === "checking"
                      ? "border-white/10 bg-white/3"
                      : testResult === "passed"
                        ? "border-solana/30 bg-solana/10"
                        : "border-red-500/30 bg-red-500/10"
                      }`}>
                      {testResult === "checking" ? (
                        <div className="flex items-center gap-3">
                          <Loader2 size={18} className="shrink-0 text-text-muted animate-spin" />
                          <span className="text-sm font-mono text-text-muted tracking-tight">Checking output against test cases...</span>
                        </div>
                      ) : testResult === "passed" ? (
                        <div className="flex items-center gap-4 w-full">
                          <div className="size-8 rounded-full bg-solana/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={20} className="text-solana" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold font-mono text-solana tracking-wide">TEST PASSED</span>
                            <span className="text-xs font-mono text-text-secondary">
                              {lesson.challenge.testCases[0].name || "Challenge 1"} — output matches expected
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="size-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                            <XCircle size={20} className="text-red-400" />
                          </div>
                          <div className="flex flex-col max-w-2xl">
                            <span className="text-sm font-bold font-mono text-red-400 tracking-wide">TEST FAILED</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-text-secondary truncate">
                                {lesson.challenge.testCases[0].name || "Challenge 1"}
                              </span>
                              {testExpected && (
                                <span className="text-[11px] font-mono text-text-muted border-l border-white/10 pl-2">
                                  Expected: <span className="text-white/60 font-medium italic">"{testExpected.slice(0, 40)}{testExpected.length > 40 ? "…" : ""}"</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
