"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  Zap,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  BookOpen,
  Code2,
  Trophy,
  Menu,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PortableText } from "@portabletext/react";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { completeLesson } from "@/services/learning-progress";
import { useEnrollment } from "@/hooks/useEnrollment";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { SanityLesson, SanityModule, SanityTestCase } from "@/types";

// ─── Portable Text renderer ───────────────────────────────────────────────────

const ptComponents = {
  types: {
    code: ({ value }: { value: { code: string; language?: string } }) => (
      <div className="my-4 rounded border border-border overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-elevated border-b border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {value.language ?? "code"}
          </span>
        </div>
        <pre className="overflow-x-auto p-4 bg-card text-sm font-mono text-foreground leading-relaxed">
          <code>{value.code}</code>
        </pre>
      </div>
    ),
  },
  block: {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="font-mono text-xl font-bold text-foreground mt-8 mb-3">{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="font-mono text-lg font-bold text-foreground mt-6 mb-2 border-b border-border pb-1">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="font-mono text-base font-semibold text-foreground mt-5 mb-2">{children}</h3>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-2 border-[#14F195]/40 pl-4 my-4 text-sm text-muted-foreground italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-none space-y-1.5 mb-4 pl-0">{children}</ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside space-y-1.5 mb-4 text-sm text-muted-foreground">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <li className="flex gap-2 text-sm text-muted-foreground">
        <span className="text-[#14F195] mt-0.5 shrink-0">·</span>
        <span>{children}</span>
      </li>
    ),
  },
  marks: {
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="font-mono text-[#14F195] bg-[#14F195]/10 px-1.5 py-0.5 rounded text-xs">
        {children}
      </code>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-muted-foreground">{children}</em>
    ),
    link: ({ children, value }: { children?: React.ReactNode; value?: { href: string } }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#14F195] hover:underline"
      >
        {children}
      </a>
    ),
  },
};

// ─── Code Runner ─────────────────────────────────────────────────────────────

interface TestResult {
  description: string;
  passed: boolean;
  output?: string;
  error?: string;
}

/**
 * Pattern-based test runner.
 * input field in Sanity = keyword/pattern to search in code.
 * expectedOutput = "true" (pattern must exist) or "false" (must not exist).
 * For non-pattern tests, attempts simple JS eval.
 */
function runPatternTests(code: string, testCases: SanityTestCase[]): TestResult[] {
  return testCases.map((tc) => {
    const pattern = tc.input?.toString() ?? "";
    const expected = tc.expectedOutput?.toString().toLowerCase().trim();

    // Pattern existence check
    if (expected === "true" || expected === "false") {
      const normalizedCode = code.toLowerCase();
      const normalizedPattern = pattern.toLowerCase();
      const found = normalizedCode.includes(normalizedPattern);
      const passed = expected === "true" ? found : !found;
      return {
        description: tc.description,
        passed,
        output: found
          ? `Found \`${pattern}\` in your code`
          : `\`${pattern}\` not found in your code`,
      };
    }

    // Try simple eval for basic functions
    try {
      // Wrap in IIFE and call with input
      const fn = new Function(
        `"use strict";\n${code}\nif (typeof solution !== "undefined") return solution(${JSON.stringify(pattern)}); return null;`
      );
      const result = fn();
      const passed = String(result).trim() === String(tc.expectedOutput).trim();
      return {
        description: tc.description,
        passed,
        output: String(result),
      };
    } catch (err) {
      return {
        description: tc.description,
        passed: false,
        error: err instanceof Error ? err.message : "Runtime error",
      };
    }
  });
}

// ─── Success Celebration ──────────────────────────────────────────────────────

function SuccessCelebration({ xp }: { xp: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-end justify-end p-8">
      {/* XP toast */}
      <div
        className="pointer-events-auto flex items-center gap-3 bg-[#14F195] text-black font-mono font-bold text-base px-6 py-3.5 rounded-lg shadow-2xl shadow-[#14F195]/30"
        style={{ animation: "celebrateSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)" }}
      >
        <Trophy className="h-5 w-5" />
        <span>+{xp} XP earned!</span>
      </div>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              background: ["#14F195", "#9945FF", "#F5A623", "#FFFFFF"][i % 4],
              animation: `particleFall ${0.8 + Math.random() * 1.2}s ${Math.random() * 0.3}s ease-out forwards`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes celebrateSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes particleFall {
          0%   { transform: translateY(0)   scale(0); opacity: 1; }
          60%  { transform: translateY(-60px) scale(1.2); opacity: 1; }
          100% { transform: translateY(40px) scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Module Sidebar ───────────────────────────────────────────────────────────

function ModuleSidebar({
  modules,
  courseSlug,
  currentLessonId,
  completedIds,
  open,
  onClose,
}: {
  modules: SanityModule[];
  courseSlug: string;
  currentLessonId: string;
  completedIds: Set<string>;
  open: boolean;
  onClose: () => void;
}) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(() => {
    // Auto-expand the module that contains the current lesson
    const set = new Set<number>();
    modules.forEach((m, i) => {
      if (m.lessons?.some((l) => l._id === currentLessonId)) set.add(i);
    });
    if (set.size === 0) set.add(0);
    return set;
  });

  const toggle = (i: number) =>
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-10 left-0 bottom-0 w-60 bg-card border-r border-border z-30 flex flex-col transition-transform duration-200",
          "lg:relative lg:top-auto lg:translate-x-0 lg:z-auto lg:flex-shrink-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button mobile */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-y-auto flex-1 py-2">
          {modules.map((module, mi) => {
            const isExpanded = expandedModules.has(mi);
            const completed = module.lessons?.filter((l) => completedIds.has(l._id)).length ?? 0;
            const total = module.lessons?.length ?? 0;

            return (
              <div key={module._id} className="mb-1">
                <button
                  onClick={() => toggle(mi)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-elevated transition-colors"
                >
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-mono font-semibold text-foreground leading-snug pr-2 line-clamp-2">
                      {module.title}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {completed}/{total} completed
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="pb-1">
                    {module.lessons?.map((lesson) => {
                      const isCurrent = lesson._id === currentLessonId;
                      const isDone = completedIds.has(lesson._id);
                      const isChallenge = lesson.type === "challenge";

                      return (
                        <Link
                          key={lesson._id}
                          href={{
                            pathname: "/courses/[slug]/lessons/[id]",
                            params: { slug: courseSlug, id: lesson._id },
                          }}
                          className={cn(
                            "flex items-center gap-2.5 px-4 py-2 text-[11px] font-mono transition-colors",
                            isCurrent
                              ? "bg-[#14F195]/10 text-[#14F195] border-r-2 border-[#14F195]"
                              : "text-muted-foreground hover:text-foreground hover:bg-elevated"
                          )}
                        >
                          {isDone ? (
                            <CheckCircle className="h-3 w-3 text-[#14F195] shrink-0" />
                          ) : isChallenge ? (
                            <Code2 className="h-3 w-3 shrink-0 opacity-50" />
                          ) : (
                            <BookOpen className="h-3 w-3 shrink-0 opacity-50" />
                          )}
                          <span className="line-clamp-2 leading-snug">{lesson.title}</span>
                          {lesson.xpReward > 0 && (
                            <span className="ml-auto text-[9px] text-[#14F195]/60 shrink-0">
                              +{lesson.xpReward}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

// ─── Test Results Panel ───────────────────────────────────────────────────────

function TestResultsPanel({
  testCases,
  results,
  running,
}: {
  testCases: SanityTestCase[];
  results: TestResult[];
  running: boolean;
}) {
  const hasRun = results.length > 0;

  return (
    <div className="space-y-1">
      {testCases.map((tc, i) => {
        const result = results[i];
        const pending = !hasRun;
        const passed = result?.passed;
        const failed = hasRun && !passed;

        return (
          <div
            key={i}
            className={cn(
              "rounded px-3 py-2 border text-xs font-mono transition-colors",
              pending && "border-border bg-card text-muted-foreground",
              passed && "border-[#14F195]/30 bg-[#14F195]/5 text-foreground",
              failed && "border-[#FF4444]/30 bg-[#FF4444]/5 text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              {pending && running ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
              ) : pending ? (
                <span className="text-subtle shrink-0">○</span>
              ) : passed ? (
                <CheckCircle className="h-3 w-3 text-[#14F195] shrink-0" />
              ) : (
                <X className="h-3 w-3 text-[#FF4444] shrink-0" />
              )}
              <span className={cn(pending && "text-muted-foreground", passed && "text-foreground", failed && "text-foreground")}>
                {tc.description}
              </span>
            </div>
            {result?.error && (
              <p className="mt-1 ml-5 text-[#FF4444] text-[10px]">{result.error}</p>
            )}
            {result?.output && !result.passed && !result.error && (
              <p className="mt-1 ml-5 text-muted-foreground text-[10px]">
                Got: <code className="text-foreground">{result.output}</code>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Hints panel ─────────────────────────────────────────────────────────────

function HintsPanel({ hints }: { hints: string[] }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [open, setOpen] = useState(false);
  if (hints.length === 0) return null;

  return (
    <div className="mt-6 border border-border rounded overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>💡 Hints ({revealedCount}/{hints.length} revealed)</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-border">
          <div className="pt-3 space-y-2">
            {hints.slice(0, revealedCount).map((hint, i) => (
              <div
                key={i}
                className="border border-[#14F195]/20 bg-[#14F195]/5 rounded p-3 text-sm font-mono text-foreground"
              >
                <span className="text-[#14F195] mr-2">{i + 1}.</span>
                {hint}
              </div>
            ))}
          </div>
          {revealedCount < hints.length ? (
            <button
              onClick={() => setRevealedCount((p) => p + 1)}
              className="text-xs font-mono text-[#14F195]/70 hover:text-[#14F195] border border-[#14F195]/20 hover:border-[#14F195]/50 px-3 py-1.5 rounded transition-colors"
            >
              Show next hint
            </button>
          ) : (
            <p className="text-xs font-mono text-muted-foreground">All hints revealed.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Solution panel ───────────────────────────────────────────────────────────

function SolutionPanel({ code, language }: { code: string; language: "rust" | "typescript" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mt-4">
      <button
        onClick={() => setShow((v) => !v)}
        className={cn(
          "text-xs font-mono px-3 py-1.5 rounded border transition-colors",
          show
            ? "border-[#14F195]/50 text-[#14F195]"
            : "border-border text-muted-foreground hover:border-[#14F195]/40 hover:text-[#14F195]"
        )}
      >
        {show ? "Hide Solution" : "View Solution"}
      </button>
      {show && (
        <div className="mt-3 border border-border rounded overflow-hidden">
          <div className="px-3 py-1.5 bg-card border-b border-border text-xs font-mono text-muted-foreground">
            solution.{language === "rust" ? "rs" : "ts"} — read only
          </div>
          <MonacoEditor
            value={code}
            language={language}
            readOnly
            height="260px"
            className="rounded-none border-0"
          />
        </div>
      )}
    </div>
  );
}

// ─── Resizable divider ────────────────────────────────────────────────────────

function ResizableDivider({ onDrag }: { onDrag: (dx: number) => void }) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      onDrag(e.clientX - lastX.current);
      lastX.current = e.clientX;
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onDrag]);

  return (
    <div
      onMouseDown={(e) => {
        dragging.current = true;
        lastX.current = e.clientX;
        e.preventDefault();
      }}
      className="flex-shrink-0 w-1.5 bg-border hover:bg-[#14F195]/30 cursor-col-resize transition-colors select-none"
    />
  );
}

// ─── Connect wallet prompt ────────────────────────────────────────────────────

function ConnectPrompt() {
  const { setVisible } = useWalletModal();
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded border border-border bg-elevated">
      <p className="text-xs font-mono text-muted-foreground">
        Connect wallet to submit progress on-chain
      </p>
      <button
        onClick={() => setVisible(true)}
        className="shrink-0 flex items-center gap-1.5 bg-[#14F195] text-black font-mono font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-[#0D9E61] transition-colors"
      >
        <span>◎</span> Connect
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface LessonViewProps {
  lesson: SanityLesson;
  courseSlug: string;
  courseTitle: string;
  modules: SanityModule[];
  prevLessonId: string | null;
  nextLessonId: string | null;
}

export function LessonView({
  lesson,
  courseSlug,
  courseTitle,
  modules,
  prevLessonId,
  nextLessonId,
}: LessonViewProps) {
  const t = useTranslations("lesson");
  const { publicKey } = useWallet();
  const { progress } = useEnrollment(courseSlug);
  const isEnrolled = progress?.enrolled ?? false;

  const isChallenge = lesson.type === "challenge";
  const storageKey = `code_${courseSlug}_${lesson._id}`;
  const completedKey = `completed_${courseSlug}`;
  const language: "rust" | "typescript" = lesson.starterCode?.trim().startsWith("use ") ? "rust" : "typescript";

  // ── State ──────────────────────────────────────────────────────────────────
  const [code, setCode] = useState(() => {
    if (typeof window === "undefined") return lesson.starterCode ?? "";
    return localStorage.getItem(storageKey) ?? lesson.starterCode ?? "";
  });
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      return new Set(JSON.parse(localStorage.getItem(completedKey) ?? "[]"));
    } catch {
      return new Set();
    }
  });
  const [completing, setCompleting] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [allPassed, setAllPassed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(50);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isCompleted = completedIds.has(lesson._id);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCodeChange = (value: string | undefined) => {
    const v = value ?? "";
    setCode(v);
    if (typeof window !== "undefined") localStorage.setItem(storageKey, v);
    // Reset results when code changes
    setTestResults([]);
    setAllPassed(false);
  };

  const handleRunTests = useCallback(() => {
    const testCases = lesson.testCases;
    if (!testCases || testCases.length === 0) {
      // No test cases — mark as runnable anyway
      setAllPassed(true);
      return;
    }
    setRunning(true);
    setTestResults([]);

    // Simulate a short delay for realism
    setTimeout(() => {
      const results = runPatternTests(code, testCases);
      setTestResults(results);
      const passed = results.every((r) => r.passed);
      setAllPassed(passed);
      setRunning(false);
    }, 600);
  }, [code, lesson.testCases]);

  const markComplete = useCallback(async () => {
    if (!isEnrolled) return;
    setCompleting(true);
    try {
      await completeLesson(courseSlug, lesson.order ?? 0);
    } catch {
      // Best-effort — mark locally regardless
    } finally {
      const next = new Set(completedIds);
      next.add(lesson._id);
      setCompletedIds(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(completedKey, JSON.stringify(Array.from(next)));
      }

      // Persist to Supabase for real XP tracking + activity feed
      if (publicKey && supabase) {
        const wallet = publicKey.toBase58();
        const xp = lesson.xpReward ?? 0;
        // Record completion
        supabase.from("lesson_completions").upsert({
          wallet_address: wallet,
          course_slug: courseSlug,
          course_title: courseTitle,
          lesson_id: lesson._id,
          lesson_title: lesson.title,
          xp_earned: xp,
          completed_at: new Date().toISOString(),
        }, { onConflict: "wallet_address,lesson_id" }).then(() => {});
        // Increment total_xp in profile
        if (xp > 0) {
          supabase.rpc("increment_xp", { wallet: wallet, amount: xp }).then(() => {});
        }
      }

      setCelebration(true);
      setTimeout(() => setCelebration(false), 4500);
      setCompleting(false);
    }
  }, [completedIds, completedKey, courseSlug, courseTitle, isEnrolled, lesson._id, lesson.order, lesson.title, lesson.xpReward, publicKey]);

  const handleResetCode = useCallback(() => {
    const starter = lesson.starterCode ?? "";
    setCode(starter);
    if (typeof window !== "undefined") localStorage.setItem(storageKey, starter);
    setTestResults([]);
    setAllPassed(false);
  }, [lesson.starterCode, storageKey]);

  const handleDividerDrag = useCallback((dx: number) => {
    if (!containerRef.current) return;
    const w = containerRef.current.getBoundingClientRect().width;
    if (w === 0) return;
    setPanelWidth((p) => Math.min(72, Math.max(28, p + (dx / w) * 100)));
  }, []);

  // ── Hints: extracted from test case descriptions ───────────────────────────
  const hints: string[] = [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-background overflow-hidden">
      {celebration && <SuccessCelebration xp={lesson.xpReward ?? 0} />}

      {/* Top bar */}
      <div className="h-10 border-b border-border flex items-center justify-between px-3 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground p-1"
          >
            <Menu className="h-4 w-4" />
          </button>

          <Link
            href={{ pathname: "/courses/[slug]", params: { slug: courseSlug } }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors shrink-0"
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="hidden sm:block">{courseTitle}</span>
          </Link>
          <span className="text-subtle hidden sm:block">/</span>
          <span className="text-xs font-mono text-foreground truncate">{lesson.title}</span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {isCompleted && (
            <span className="flex items-center gap-1 text-xs font-mono text-[#14F195]">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:block">{t("completed")}</span>
            </span>
          )}
          {prevLessonId && (
            <Link
              href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: prevLessonId } }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
              <span className="hidden sm:block">{t("previous")}</span>
            </Link>
          )}
          {nextLessonId ? (
            <Link
              href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: nextLessonId } }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors"
            >
              <span className="hidden sm:block">{t("next")}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          ) : (
            <Link
              href={{ pathname: "/courses/[slug]", params: { slug: courseSlug } }}
              className="flex items-center gap-1 text-[#14F195] hover:text-[#0D9E61] text-xs font-mono transition-colors"
            >
              <span className="hidden sm:block">Finish Course</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <ModuleSidebar
          modules={modules}
          courseSlug={courseSlug}
          currentLessonId={lesson._id}
          completedIds={completedIds}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main split area */}
        <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">
          {/* Content pane */}
          <div
            className="overflow-y-auto flex-shrink-0"
            style={{ width: isChallenge ? `${panelWidth}%` : "100%" }}
          >
            <div className={cn("p-6 max-w-3xl", !isChallenge && "mx-auto")}>
              {/* Lesson meta */}
              <div className="flex items-center gap-2 mb-5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full border",
                    isChallenge
                      ? "border-[#9945FF]/40 bg-[#9945FF]/10 text-[#9945FF]"
                      : "border-[#14F195]/30 bg-[#14F195]/10 text-[#14F195]"
                  )}
                >
                  {isChallenge ? <Code2 className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                  {isChallenge ? "Challenge" : "Reading"}
                </span>
                {lesson.estimatedMinutes && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {lesson.estimatedMinutes} min
                  </span>
                )}
                <span className="text-[10px] font-mono text-[#14F195] ml-auto">
                  +{lesson.xpReward} XP
                </span>
              </div>

              <h1 className="font-mono text-2xl font-bold text-foreground mb-6 leading-tight">
                {lesson.title}
              </h1>

              {/* Content */}
              {lesson.content ? (
                <div className="max-w-none">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <PortableText value={lesson.content as any} components={ptComponents} />
                </div>
              ) : (
                <div className="border border-border rounded p-6 text-center">
                  <p className="text-sm text-muted-foreground font-mono">
                    Content coming soon.
                  </p>
                </div>
              )}

              {/* Hints (challenge) */}
              {isChallenge && <HintsPanel hints={hints} />}

              {/* Solution toggle */}
              {isChallenge && lesson.solutionCode && (
                <SolutionPanel code={lesson.solutionCode} language={language} />
              )}

              {/* ── Content lesson actions ──────────────────────────────── */}
              {!isChallenge && (
                <div className="mt-8 space-y-4">
                  {!isCompleted ? (
                    <>
                      {!publicKey && <ConnectPrompt />}
                      {publicKey && !isEnrolled && (
                        <p className="text-xs font-mono text-amber-400">
                          Enroll in this course to track progress on-chain.
                        </p>
                      )}
                      <button
                        onClick={markComplete}
                        disabled={completing || !isEnrolled || !publicKey}
                        className="flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-semibold bg-[#14F195] text-black hover:bg-[#0D9E61] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isEnrolled ? "Enroll in the course first" : undefined}
                      >
                        {completing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {t("complete")}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border border-[#14F195]/30 bg-[#14F195]/5 rounded-lg px-5 py-4">
                        <CheckCircle className="h-5 w-5 text-[#14F195] shrink-0" />
                        <div className="flex-1">
                          <p className="font-mono text-sm font-semibold text-foreground">
                            Lesson complete!
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            +{lesson.xpReward} XP earned
                          </p>
                        </div>
                        {nextLessonId ? (
                          <Link
                            href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: nextLessonId } }}
                            className="shrink-0 flex items-center gap-1.5 bg-[#14F195] text-black font-mono font-semibold text-sm px-4 py-2 rounded-full hover:bg-[#0D9E61] transition-colors"
                          >
                            Next Lesson <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href={{ pathname: "/courses/[slug]", params: { slug: courseSlug } }}
                            className="shrink-0 flex items-center gap-1.5 bg-[#14F195] text-black font-mono font-semibold text-sm px-4 py-2 rounded-full hover:bg-[#0D9E61] transition-colors"
                          >
                            Finish <CheckCircle className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                      {lesson.solutionCode && (
                        <SolutionPanel code={lesson.solutionCode} language={language} />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Challenge: completed banner (in content pane) ───────── */}
              {isChallenge && isCompleted && (
                <div className="mt-6 flex items-center gap-3 border border-[#14F195]/30 bg-[#14F195]/5 rounded-lg px-5 py-4">
                  <CheckCircle className="h-5 w-5 text-[#14F195] shrink-0" />
                  <div className="flex-1">
                    <p className="font-mono text-sm font-semibold text-foreground">
                      Challenge complete!
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      +{lesson.xpReward} XP earned
                    </p>
                  </div>
                  {nextLessonId && (
                    <Link
                      href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: nextLessonId } }}
                      className="shrink-0 flex items-center gap-1.5 bg-[#14F195] text-black font-mono font-semibold text-sm px-4 py-2 rounded-full hover:bg-[#0D9E61] transition-colors"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Editor pane (challenge only) ─────────────────────────── */}
          {isChallenge && (
            <>
              <ResizableDivider onDrag={handleDividerDrag} />

              <div
                className="flex flex-col flex-shrink-0 min-h-0 overflow-hidden bg-card"
                style={{ width: `${100 - panelWidth}%` }}
              >
                {/* Editor tab bar */}
                <div className="flex items-center border-b border-border px-3 py-1.5 gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 bg-[#14F195]/10 rounded px-3 py-1 border border-[#14F195]/30">
                    <Code2 className="h-3 w-3 text-[#14F195]" />
                    <span className="text-[10px] font-mono text-[#14F195]">
                      main.{language === "rust" ? "rs" : "ts"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ← write your solution here
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {language === "rust" ? "Rust" : "TypeScript"}
                    </span>
                  </div>
                </div>

                {/* Monaco editor */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <MonacoEditor
                    value={code}
                    onChange={handleCodeChange}
                    language={language}
                    height="100%"
                    className="rounded-none border-0"
                  />
                </div>

                {/* Bottom panel: tests + actions */}
                <div className="border-t border-border flex-shrink-0 max-h-[280px] overflow-y-auto">
                  {/* Test results header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      Test Results
                    </span>
                    {testResults.length > 0 && (
                      <span className={cn(
                        "text-[10px] font-mono",
                        allPassed ? "text-[#14F195]" : "text-[#FF4444]"
                      )}>
                        {testResults.filter((r) => r.passed).length}/{testResults.length} passed
                      </span>
                    )}
                  </div>

                  <div className="p-3 space-y-3">
                    {/* Test cases */}
                    {lesson.testCases && lesson.testCases.length > 0 && (
                      <TestResultsPanel
                        testCases={lesson.testCases}
                        results={testResults}
                        running={running}
                      />
                    )}

                    {/* No test cases */}
                    {(!lesson.testCases || lesson.testCases.length === 0) && (
                      <p className="text-[11px] font-mono text-muted-foreground text-center py-2">
                        No automated tests — submit when ready.
                      </p>
                    )}

                    {/* Actions row */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleResetCode}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-muted-foreground border border-border rounded hover:border-border-hover hover:text-foreground transition-colors"
                        title="Reset to starter code"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>

                      <button
                        onClick={handleRunTests}
                        disabled={running}
                        className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-mono font-semibold border border-[#14F195]/50 text-[#14F195] rounded hover:bg-[#14F195]/10 transition-colors disabled:opacity-50"
                      >
                        {running ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Running...</>
                        ) : (
                          <><Play className="h-3 w-3" /> Run Tests</>
                        )}
                      </button>

                      {isCompleted ? (
                        <button
                          disabled
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-mono font-semibold bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Completed
                        </button>
                      ) : (
                        <button
                          onClick={markComplete}
                          disabled={completing || !isEnrolled || !publicKey || (!allPassed && (lesson.testCases?.length ?? 0) > 0)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-mono font-semibold transition-colors",
                            isEnrolled && publicKey && (allPassed || (lesson.testCases?.length ?? 0) === 0)
                              ? "bg-[#14F195] text-black hover:bg-[#0D9E61]"
                              : "bg-elevated text-muted-foreground border border-border cursor-not-allowed"
                          )}
                          title={
                            !publicKey ? "Connect wallet to submit"
                            : !isEnrolled ? "Enroll in the course first"
                            : !allPassed && (lesson.testCases?.length ?? 0) > 0 ? "Run tests first"
                            : undefined
                          }
                        >
                          {completing ? (
                            <><Loader2 className="h-3 w-3 animate-spin" /> Submitting...</>
                          ) : (
                            <><Zap className="h-3 w-3" /> Submit</>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Wallet prompt */}
                    {!publicKey && !isCompleted && (
                      <ConnectPrompt />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
