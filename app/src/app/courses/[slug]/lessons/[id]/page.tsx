"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import confetti from "canvas-confetti";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Play,
  FileText,
  Code,
  Lightbulb,
  Eye,
  EyeOff,
  BookOpen,
  Menu,
  X,
  Flame,
  Loader2,
  CircleX,
  Terminal,
  RotateCcw,
  Trophy,
  Sparkles,
  Save,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { getCourseBySlug } from "@/data/courses";
import { getLessonContent, type TestCase } from "@/data/lesson-content";
import { getCourse, getLesson } from "@/lib/sanity-fetch";
import { useLocale } from "@/providers/locale-provider";
import {
  progressService,
  streakService,
  activityService,
  addXp,
} from "@/services";
import { useWallet } from "@solana/wallet-adapter-react";
import { events as analyticsEvents } from "@/lib/analytics";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#0c0c0e] text-muted-foreground text-xs">
      {/* Static loading text — outside React tree, no hook access */}
      ...
    </div>
  ),
});

/* ── Helpers ── */

function LessonTypeIcon({ type }: { type: "video" | "reading" | "challenge" }) {
  if (type === "video") return <Play className="size-3.5" />;
  if (type === "challenge") return <Code className="size-3.5" />;
  return <FileText className="size-3.5" />;
}

/* ── Markdown Renderer (react-markdown, no XSS) ── */

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose-custom">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="mt-8 mb-3 text-xl font-semibold tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 mb-2 text-base font-semibold tracking-tight">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-foreground/90 mb-2">
              {children}
            </p>
          ),
          strong: ({ children }) => <strong>{children}</strong>,
          code: ({ children, className }) => {
            const isBlock = className?.startsWith("language-");
            if (isBlock) {
              const lang = className?.replace("language-", "") || "code";
              return (
                <div className="my-4 rounded-lg border border-border/50 bg-[#0c0c0e] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    {lang}
                  </div>
                  <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-[#a1a1aa]">
                    <code>{children}</code>
                  </pre>
                </div>
              );
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] font-mono text-primary">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-primary/40 pl-4 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="ml-4 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-4 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm leading-relaxed mb-1">{children}</li>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="text-left p-2 border-b border-border/50 text-muted-foreground font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2 border-b border-border/30">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ── Test Result type ── */

type TestResult = "idle" | "pass" | "fail";

/* ── Test Evaluation ── */

/**
 * Evaluate whether user code satisfies a test case by matching
 * code patterns from the test's `input` and backtick-quoted
 * identifiers from `expected`.
 */
function evaluateTest(code: string, tc: TestCase): boolean {
  const normalizedCode = code.toLowerCase().replace(/\s+/g, " ");

  // If code still has unimplemented TODO markers and is short, fail
  if (code.includes("// TODO") && code.length < 300) return false;

  // Collect tokens to look for in the user's code
  const tokens: string[] = [];

  // Extract identifiers from input (code patterns, function names, keywords)
  const inputTokens =
    tc.input.match(/[a-zA-Z_#@][a-zA-Z0-9_:.]*/g)?.filter((t) => t.length >= 2) ?? [];
  tokens.push(...inputTokens);

  // Extract backtick-quoted code from expected (e.g. `count: u64`)
  const backtickContent = tc.expected.match(/`([^`]+)`/g);
  if (backtickContent) {
    for (const m of backtickContent) {
      const inner = m.replace(/`/g, "");
      const parts = inner.split(/[^a-zA-Z0-9_]+/).filter((t) => t.length >= 2);
      tokens.push(...parts);
    }
  }

  // Extract code-like patterns from expected (e.g. "counter.count == 0")
  const codePatterns =
    tc.expected.match(/[a-zA-Z_][a-zA-Z0-9_.]+/g)?.filter((t) => t.length >= 3) ?? [];
  tokens.push(...codePatterns);

  // Deduplicate and filter out common English words
  const stopWords = new Set([
    "the", "and", "has", "with", "for", "from", "that", "this",
    "are", "was", "been", "not", "all", "its", "returns", "should",
    "expected", "after", "bytes", "account", "owned", "created",
    "balance", "meets", "threshold", "target", "both", "included",
    "transaction", "signed",
  ]);
  const uniqueTokens = [
    ...new Set(tokens.map((t) => t.toLowerCase())),
  ].filter((t) => !stopWords.has(t) && t.length >= 2);

  if (uniqueTokens.length === 0) return !code.includes("// TODO");

  // Check what fraction of tokens appear in the user's code
  const matchCount = uniqueTokens.filter((token) =>
    normalizedCode.includes(token),
  ).length;

  return matchCount / uniqueTokens.length > 0.5;
}

/* ── Code Challenge Panel ── */

function ChallengeEditor({
  code,
  onChange,
  language,
  testCases,
  accent,
  xpReward,
  onComplete,
  courseSlug,
  t,
}: {
  code: string;
  onChange: (code: string) => void;
  language: string;
  testCases: TestCase[];
  accent: string;
  xpReward: number;
  onComplete: () => void;
  courseSlug: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>(
    testCases.map(() => "idle"),
  );
  const [output, setOutput] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"tests" | "output">("tests");
  const [allPassed, setAllPassed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const passedCount = testResults.filter((r) => r === "pass").length;
  const failedCount = testResults.filter((r) => r === "fail").length;
  const hasRun = testResults.some((r) => r !== "idle");

  const handleRun = useCallback(() => {
    setRunning(true);
    setOutput([t("lesson.compiling"), ""]);
    setActiveTab("tests");
    analyticsEvents.codeSubmitted(courseSlug);
    setAllPassed(false);
    setShowCelebration(false);

    // Simulate progressive test execution
    const results: TestResult[] = testCases.map(() => "idle");
    setTestResults([...results]);

    function runTest(i: number) {
      if (i >= testCases.length) {
        setRunning(false);

        const allPass = results.every((r) => r === "pass");
        const passCount = results.filter((r) => r === "pass").length;
        const failCount = results.filter((r) => r === "fail").length;

        setOutput((prev) => [
          ...prev,
          "",
          t("lesson.testResultsSummary", {
            passed: String(passCount),
            failed: String(failCount),
          }),
          "",
          allPass
            ? t("lesson.allTestsPassedXp", { xp: String(xpReward) })
            : t("lesson.testsFailedCheck", { count: String(failCount) }),
        ]);

        if (allPass) {
          setAllPassed(true);
          setShowCelebration(true);
          analyticsEvents.testsPassed(courseSlug);
          // Fire star confetti burst
          const defaults = {
            spread: 360,
            ticks: 100,
            gravity: 0,
            decay: 0.94,
            startVelocity: 30,
            colors: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],
          };
          const shoot = () => {
            confetti({
              ...defaults,
              particleCount: 40,
              scalar: 1.2,
              shapes: ["star"],
            });
            confetti({
              ...defaults,
              particleCount: 10,
              scalar: 0.75,
              shapes: ["circle"],
            });
          };
          // 3 rounds of bursts
          setTimeout(shoot, 0);
          setTimeout(shoot, 100);
          setTimeout(shoot, 200);
          setTimeout(shoot, 800);
          setTimeout(shoot, 900);
          setTimeout(shoot, 1000);
          setTimeout(shoot, 1600);
          setTimeout(shoot, 1700);
          setTimeout(shoot, 1800);
        }
        return;
      }

      const tc = testCases[i]!;
      const passed = evaluateTest(code, tc);

      results[i] = passed ? "pass" : "fail";
      setTestResults([...results]);
      setOutput((prev) => [
        ...prev,
        `${passed ? "\u2713" : "\u2717"} ${tc.name}${passed ? "" : ` \u2014 expected: ${tc.expected}`}`,
      ]);

      setTimeout(() => runTest(i + 1), 400);
    }

    setTimeout(() => runTest(0), 400);
  }, [code, testCases, xpReward]);

  const handleReset = useCallback(() => {
    setTestResults(testCases.map(() => "idle"));
    setOutput([]);
    setAllPassed(false);
    setShowCelebration(false);
  }, [testCases]);

  return (
    <div className="h-full flex flex-col bg-[#0c0c0e] relative">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="text-center animate-in zoom-in duration-500">
            <div
              className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full"
              style={{ background: `${accent}20` }}
            >
              <Trophy className="size-8" style={{ color: accent }} />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {t("lesson.challengeComplete")}
            </h3>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-amber-400">
              <Sparkles className="size-4" />
              <span className="font-medium">+{xpReward} XP</span>
            </div>
            <Button
              size="sm"
              className="mt-4"
              variant="outline"
              onClick={() => {
                setShowCelebration(false);
                onComplete();
              }}
            >
              {t("common.continue")}
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Editor toolbar */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            {language}
          </span>
          {hasRun && (
            <div className="flex items-center gap-2 text-[11px]">
              {passedCount > 0 && (
                <span className="text-emerald-400">
                  {passedCount} {t("lesson.passed")}
                </span>
              )}
              {failedCount > 0 && (
                <span className="text-red-400">
                  {failedCount} {t("lesson.failed")}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="ghost"
            onClick={handleReset}
            className="text-[11px] text-muted-foreground hover:text-foreground h-7 px-2"
          >
            <RotateCcw className="size-3" />
            {t("lesson.reset")}
          </Button>
          <Button
            size="xs"
            onClick={handleRun}
            disabled={running}
            className="h-7 px-3 text-[11px] font-medium"
            style={{
              background: running ? undefined : accent,
              color: running ? undefined : "#000",
            }}
          >
            {running ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                {t("lesson.running")}
              </>
            ) : (
              <>
                <Play className="size-3" />
                {t("lesson.runTests")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code editor area */}
      <div className="flex-1 relative min-h-0">
        <MonacoEditor
          height="100%"
          language={language === "typescript" ? "typescript" : "rust"}
          theme="vs-dark"
          value={code}
          onChange={(value) => onChange(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 1.65,
            fontFamily: "var(--font-mono), monospace",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 16 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
        />
      </div>

      {/* Bottom panel: test cases + output */}
      <div className="border-t border-border/50 h-[200px] flex flex-col shrink-0">
        {/* Tabs */}
        <div className="flex items-center border-b border-border/50 px-2">
          <button
            onClick={() => setActiveTab("tests")}
            className={`px-3 py-1.5 text-[11px] font-medium border-b-2 transition-colors ${
              activeTab === "tests"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("lesson.tests")}
            {hasRun && (
              <span className="ml-1.5">
                ({passedCount}/{testCases.length})
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`px-3 py-1.5 text-[11px] font-medium border-b-2 transition-colors ${
              activeTab === "output"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Terminal className="size-3 inline mr-1" />
            {t("lesson.output")}
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "tests" ? (
            <div className="p-2 space-y-1">
              {testCases.map((tc, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-md px-2.5 py-2 text-xs"
                >
                  <div className="mt-0.5 shrink-0">
                    {testResults[i] === "pass" ? (
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                    ) : testResults[i] === "fail" ? (
                      <CircleX className="size-3.5 text-red-400" />
                    ) : (
                      <div className="size-3.5 rounded-full border border-border/50" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-medium ${
                        testResults[i] === "fail"
                          ? "text-red-400"
                          : testResults[i] === "pass"
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {tc.name}
                    </p>
                    <div className="mt-0.5 flex gap-4 text-[10px] text-muted-foreground">
                      <span>
                        {t("lesson.input")}:{" "}
                        <code className="text-[#a1a1aa]">{tc.input}</code>
                      </span>
                      <span>
                        {t("lesson.expected")}:{" "}
                        <code className="text-[#a1a1aa]">{tc.expected}</code>
                      </span>
                    </div>
                    {testResults[i] === "fail" && (
                      <p className="mt-1 text-[10px] text-red-400/80">
                        {t("lesson.checkImplementation")}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {allPassed && (
                <div
                  className="mt-2 rounded-lg border px-3 py-2.5 text-xs flex items-center gap-2"
                  style={{
                    borderColor: `${accent}40`,
                    background: `${accent}10`,
                    color: accent,
                  }}
                >
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span className="font-medium">
                    {t("lesson.allTestsComplete")}
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <Flame className="size-3" />+{xpReward} XP
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 font-mono text-[11px] leading-relaxed text-[#a1a1aa] whitespace-pre-wrap">
              {output.length > 0
                ? output.join("\n")
                : t("lesson.clickRunTests")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Module sidebar ── */

function LessonSidebar({
  courseSlug,
  course,
  currentLessonId,
  accent,
  onClose,
}: {
  courseSlug: string;
  course: ReturnType<typeof getCourseBySlug> | null;
  currentLessonId: string;
  accent: string;
  onClose?: () => void;
}) {
  const { t } = useLocale();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    const currentModule = course?.modules.find((m) =>
      m.lessons.some((l) => l.id === currentLessonId),
    );
    return new Set(currentModule ? [currentModule.id] : []);
  });

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  if (!course) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {t(`courseContent.${courseSlug}.title`)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {course.lessons} {t("common.lessons")}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {course.modules.map((module, mi) => {
          const isExpanded = expandedModules.has(module.id);
          return (
            <div key={module.id}>
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="text-xs font-medium truncate">
                  {mi + 1}. {t(`courseContent.${courseSlug}.${module.id}`)}
                </span>
              </button>
              {isExpanded && (
                <div className="pb-1">
                  {module.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;
                    return (
                      <Link
                        key={lesson.id}
                        href={`/courses/${courseSlug}/lessons/${lesson.id}`}
                        className={`flex items-center gap-2.5 px-4 pl-9 py-2 text-xs transition-colors ${
                          isCurrent
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                        }`}
                      >
                        {lesson.completed ? (
                          <CheckCircle2
                            className="size-3.5 shrink-0"
                            style={{ color: accent }}
                          />
                        ) : (
                          <LessonTypeIcon type={lesson.type} />
                        )}
                        <span className="truncate">
                          {t(`courseContent.${courseSlug}.${lesson.id}`)}
                        </span>
                        <span className="ml-auto text-[10px] shrink-0">
                          {lesson.duration}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Page ── */

export default function LessonPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  // key={id} on LessonContent resets all state when navigating between lessons
  return <LessonContent key={id} slug={slug} id={id} />;
}

function LessonContent({ slug, id }: { slug: string; id: string }) {
  const [course, setCourse] = useState(getCourseBySlug(slug) ?? null);
  const { publicKey, connected } = useWallet();
  const { t, locale } = useLocale();
  const [lessonContent, setLessonContent] = useState(
    getLessonContent(slug, id, locale),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getCourse(slug).then((c) => {
      if (c) setCourse(c);
    });
    getLesson(slug, id, locale).then((l) => {
      if (l) setLessonContent(l);
    });
  }, [slug, id, locale]);
  const [showSolution, setShowSolution] = useState(false);
  const [expandedHints, setExpandedHints] = useState<Set<number>>(new Set());
  const [autoSaved, setAutoSaved] = useState(false);
  const [enrolled, setEnrolled] = useState<boolean | null>(null);

  // Check enrollment status
  useEffect(() => {
    if (!connected || !publicKey || !course) {
      setEnrolled(false);
      return;
    }
    progressService.getProgress(publicKey.toBase58(), course.slug).then((p) => {
      setEnrolled(!!p);
    });
  }, [connected, publicKey, course]);

  // Load saved code from localStorage or use starter code
  const draftKey = `academy_draft_${slug}_${id}`;
  const [editorCode, setEditorCode] = useState(() => {
    if (typeof window === "undefined") return lessonContent?.starterCode || "";
    return localStorage.getItem(draftKey) || lessonContent?.starterCode || "";
  });
  const [completed, setCompleted] = useState(false);

  // Auto-save code to localStorage
  useEffect(() => {
    if (!editorCode || typeof window === "undefined") return;
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey, editorCode);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 1500);
    }, 1000);
    return () => clearTimeout(timer);
  }, [editorCode, draftKey]);

  // Handle lesson completion with service layer
  const handleComplete = useCallback(async () => {
    if (completed) return;
    setCompleted(true);

    const wallet = publicKey?.toBase58();
    if (!wallet) return;

    try {
      const allLessonsLocal = course?.modules.flatMap((m) => m.lessons) ?? [];
      const lessonIdx = allLessonsLocal.findIndex((l) => l.id === id);

      const { xpEarned } = await progressService.completeLesson(
        wallet,
        slug,
        lessonIdx,
      );
      if (xpEarned > 0) addXp(wallet, xpEarned);

      await streakService.recordActivity(wallet);
      await activityService.recordActivity(wallet, {
        type: "lesson_complete",
        title: `Completed "${course?.title}" lesson`,
        courseName: course?.title,
        xp: xpEarned,
      });

      analyticsEvents.lessonCompleted(slug, lessonIdx);
      if (lessonIdx === allLessonsLocal.length - 1) {
        analyticsEvents.courseCompleted(slug);
      }
    } catch {
      // Silently handle — lesson still marked complete in UI
    }
  }, [completed, publicKey, course, slug, id]);

  // Find lesson metadata from course
  const allLessons = course?.modules.flatMap((m) => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === id);
  const currentLesson = allLessons[currentIndex];
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const language =
    course?.topic === "Core" && course?.slug.includes("wallet")
      ? "typescript"
      : course?.topic === "Framework" ||
          course?.topic === "DeFi" ||
          course?.topic === "Security"
        ? "rust"
        : "typescript";

  const xpPerLesson = course ? Math.round(course.xp / course.lessons) : 100;

  function toggleHint(index: number) {
    setExpandedHints((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  // 404
  if (!course || !currentLesson) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="size-12 text-muted-foreground/60 mx-auto" />
          <h1 className="mt-4 text-xl font-semibold">
            {t("lesson.lessonNotFound")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("lesson.lessonNotFoundDesc")}
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href={`/courses/${slug}`}>
              <ArrowLeft className="size-3.5" />
              {t("lesson.backToCourse")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Enrollment gate
  if (enrolled === null) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enrolled) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Lock className="size-12 text-muted-foreground/60 mx-auto" />
          <h1 className="mt-4 text-xl font-semibold">
            {t("lesson.enrollRequired")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            {t("lesson.enrollRequiredDesc")}
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href={`/courses/${slug}`}>
              <ArrowLeft className="size-3.5" />
              {t("lesson.backToCourse")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isChallenge = currentLesson.type === "challenge";
  const hasContent = !!lessonContent;
  const hasTestCases =
    lessonContent?.testCases && lessonContent.testCases.length > 0;

  const markdownContent =
    lessonContent?.markdown ??
    `## ${t(`courseContent.${slug}.${currentLesson.id}`)}\n\n${t("lesson.lessonComingSoon")}\n\n> ${t("lesson.lessonPartOf", { course: t(`courseContent.${slug}.title`) })}`;

  return (
    <div className="fixed inset-0 top-14 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-2 bg-card/80 backdrop-blur-sm">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-muted-foreground hover:text-foreground transition-colors lg:hidden"
        >
          <Menu className="size-4" />
        </button>

        <Link
          href={`/courses/${slug}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="h-4 w-px bg-border/50" />

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <LessonTypeIcon type={currentLesson.type} />
          <span className="text-sm font-medium truncate">
            {t(`courseContent.${slug}.${currentLesson.id}`)}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
            {t(
              `lesson.type${currentLesson.type.charAt(0).toUpperCase()}${currentLesson.type.slice(1)}`,
            )}
          </Badge>
          {completed && (
            <Badge
              className="text-[10px] px-1.5 py-0 shrink-0"
              style={{ background: course.accent, color: "#000" }}
            >
              <CheckCircle2 className="size-2.5" />
              {t("lesson.done")}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {autoSaved && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Save className="size-3" />
              {t("lesson.autoSaved")}
            </span>
          )}
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {currentLesson.duration}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="size-3 text-xp" />
            <span>{xpPerLesson} XP</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "fixed inset-0 top-14 z-40 bg-background" : "hidden"
          } lg:relative lg:block lg:z-auto w-64 shrink-0 border-r border-border/50 bg-card/40 overflow-hidden`}
        >
          <LessonSidebar
            courseSlug={slug}
            course={course}
            currentLessonId={id}
            accent={course.accent}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Content area */}
        {isChallenge && hasContent ? (
          <ResizablePanelGroup orientation="horizontal" className="flex-1">
            {/* Left: challenge prompt */}
            <ResizablePanel defaultSize={45} minSize={25}>
              <div className="h-full overflow-y-auto">
                <div className="max-w-2xl mx-auto p-6 pb-24">
                  <MarkdownRenderer content={markdownContent} />

                  {/* Test cases preview */}
                  {hasTestCases && (
                    <div className="mt-8">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Code
                          className="size-4"
                          style={{ color: course.accent }}
                        />
                        {t("lesson.testCases")}
                      </h3>
                      <div className="space-y-1.5">
                        {lessonContent.testCases!.map((tc, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-border/50 px-3 py-2 text-xs"
                          >
                            <p className="font-medium text-foreground/90">
                              {tc.name}
                            </p>
                            <p className="mt-0.5 text-muted-foreground">
                              {t("lesson.expected")}: {tc.expected}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hints */}
                  {lessonContent?.hints && lessonContent.hints.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Lightbulb className="size-4 text-amber-400" />
                        {t("lesson.hints")}
                      </h3>
                      <div className="space-y-2">
                        {lessonContent.hints.map((hint, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-border/50 overflow-hidden"
                          >
                            <button
                              onClick={() => toggleHint(i)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
                            >
                              {expandedHints.has(i) ? (
                                <Eye className="size-3.5" />
                              ) : (
                                <EyeOff className="size-3.5" />
                              )}
                              {t("lesson.hint")} {i + 1}
                            </button>
                            {expandedHints.has(i) && (
                              <div className="px-3 pb-3 text-xs text-muted-foreground border-t border-border/30 pt-2">
                                {hint}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solution toggle */}
                  {lessonContent?.solutionCode && (
                    <div className="mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSolution(!showSolution)}
                        className="text-xs"
                      >
                        {showSolution ? (
                          <>
                            <EyeOff className="size-3.5" />
                            {t("lesson.hideSolution")}
                          </>
                        ) : (
                          <>
                            <Eye className="size-3.5" />
                            {t("lesson.showSolution")}
                          </>
                        )}
                      </Button>
                      {showSolution && (
                        <div className="mt-3 rounded-lg border border-border/50 bg-[#0c0c0e] p-4 overflow-x-auto">
                          <pre className="font-mono text-[13px] leading-relaxed text-[#a1a1aa]">
                            <code>{lessonContent.solutionCode}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            {/* Right: code editor + tests */}
            <ResizablePanel defaultSize={55} minSize={30}>
              <ChallengeEditor
                code={editorCode}
                onChange={setEditorCode}
                language={language}
                testCases={lessonContent?.testCases ?? []}
                accent={course.accent}
                xpReward={xpPerLesson}
                onComplete={handleComplete}
                courseSlug={slug}
                t={t}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* Full-width layout for reading/video */
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-6 pb-24">
              <MarkdownRenderer content={markdownContent} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div>
          {prevLesson ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/courses/${slug}/lessons/${prevLesson.id}`}>
                <ArrowLeft className="size-3.5" />
                <span className="hidden sm:inline">
                  {t(`courseContent.${slug}.${prevLesson.id}`)}
                </span>
                <span className="sm:hidden">{t("common.previous")}</span>
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/courses/${slug}`}>
                <ArrowLeft className="size-3.5" />
                {t("lesson.courseOverview")}
              </Link>
            </Button>
          )}
        </div>

        <Button
          size="sm"
          className="font-medium"
          onClick={handleComplete}
          disabled={completed}
          style={
            completed ? undefined : { background: course.accent, color: "#000" }
          }
        >
          {completed ? (
            <>
              <CheckCircle2 className="size-3.5" />
              {t("common.completed")}
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3.5" />
              {t("lesson.markComplete")}
            </>
          )}
        </Button>

        <div>
          {nextLesson ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/courses/${slug}/lessons/${nextLesson.id}`}>
                <span className="hidden sm:inline">
                  {t(`courseContent.${slug}.${nextLesson.id}`)}
                </span>
                <span className="sm:hidden">{t("common.next")}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/courses/${slug}`}>
                {t("lesson.finishCourse")}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
