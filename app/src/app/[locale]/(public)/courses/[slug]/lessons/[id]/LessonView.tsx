"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, Zap, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PortableText } from "@portabletext/react";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { completeLesson } from "@/services/learning-progress";
import { cn } from "@/lib/utils";
import type { SanityLesson } from "@/types";

// ─── Portable Text renderer ───────────────────────────────────────────────────

const ptComponents = {
  types: {
    code: ({ value }: { value: { code: string; language?: string } }) => (
      <div className="my-4 rounded border border-border overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-elevated border-b border-border">
          <span className="text-[10px] font-mono text-muted-foreground">{value.language ?? "code"}</span>
        </div>
        <pre className="overflow-x-auto p-4 bg-card text-sm font-mono text-foreground leading-relaxed">
          <code>{value.code}</code>
        </pre>
      </div>
    ),
  },
  block: {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="font-mono text-xl font-bold text-foreground mt-6 mb-3">{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="font-mono text-lg font-bold text-foreground mt-5 mb-2">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="font-mono text-base font-semibold text-foreground mt-4 mb-2">{children}</h3>
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
      <ol className="list-decimal list-inside space-y-1.5 mb-4 pl-0 text-sm text-muted-foreground">
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
      <code className="font-mono text-[#14F195] bg-[#14F195]/10 px-1.5 py-0.5 rounded text-xs">{children}</code>
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

// ─── Next lesson banner ───────────────────────────────────────────────────────

function NextLessonBanner({
  courseSlug,
  nextLessonId,
}: {
  courseSlug: string;
  nextLessonId: string | null;
}) {
  if (!nextLessonId) {
    return (
      <div className="border border-[#14F195]/30 bg-[#14F195]/5 rounded-lg px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-[#14F195] shrink-0" />
          <div>
            <p className="font-mono text-sm font-semibold text-foreground">Lesson complete!</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              You finished the last lesson in this course.
            </p>
          </div>
        </div>
        <Link
          href={{ pathname: "/courses/[slug]", params: { slug: courseSlug } }}
          className="shrink-0 flex items-center gap-1.5 bg-[#14F195] text-black font-mono font-semibold text-sm px-4 py-2 rounded hover:bg-[#0D9E61] transition-colors"
        >
          Finish Course <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-[#14F195]/30 bg-[#14F195]/5 rounded-lg px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-[#14F195] shrink-0" />
        <div>
          <p className="font-mono text-sm font-semibold text-foreground">Lesson complete!</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Ready for the next one?</p>
        </div>
      </div>
      <Link
        href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: nextLessonId } }}
        className="shrink-0 flex items-center gap-1.5 bg-[#14F195] text-black font-mono font-semibold text-sm px-4 py-2 rounded hover:bg-[#0D9E61] transition-colors"
      >
        Next Lesson <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// ─── Hints ────────────────────────────────────────────────────────────────────

function HintsPanel({ hints }: { hints: string[] }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [open, setOpen] = useState(false);
  if (hints.length === 0) return null;

  return (
    <div className="mt-6 border border-border rounded">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>💡 Hints</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {hints.slice(0, revealedCount).map((hint, i) => (
            <div key={i} className="border border-[#14F195]/20 bg-[#14F195]/5 rounded p-3 text-sm font-mono text-foreground">
              <span className="text-[#14F195] mr-2">{i + 1}.</span>{hint}
            </div>
          ))}
          {revealedCount < hints.length && (
            <button
              onClick={() => setRevealedCount((p) => p + 1)}
              className="text-xs font-mono text-[#14F195]/70 hover:text-[#14F195] border border-[#14F195]/20 hover:border-[#14F195]/50 px-3 py-1.5 rounded transition-colors"
            >
              💡 Show Hint {revealedCount + 1} of {hints.length}
            </button>
          )}
          {revealedCount === hints.length && (
            <p className="text-xs font-mono text-muted-foreground">All hints revealed.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Solution toggle ──────────────────────────────────────────────────────────

function SolutionPanel({ code }: { code: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mt-4">
      <button
        onClick={() => setShow((v) => !v)}
        className={cn(
          "text-xs font-mono px-3 py-1.5 rounded border transition-colors",
          show
            ? "border-[#14F195]/50 text-[#14F195]"
            : "border-[#333333] text-muted-foreground hover:border-[#14F195]/50 hover:text-[#14F195]"
        )}
      >
        {show ? "Hide Solution" : "Show Solution"}
      </button>
      {show && (
        <div className="mt-3 border border-border rounded overflow-hidden">
          <div className="px-3 py-1.5 bg-card border-b border-border text-xs font-mono text-muted-foreground">
            solution.rs — read only
          </div>
          <MonacoEditor value={code} language="rust" readOnly height="260px" className="rounded-none border-0" />
        </div>
      )}
    </div>
  );
}

// ─── Resizable divider ────────────────────────────────────────────────────────

function ResizableDivider({ onDrag }: { onDrag: (dx: number) => void }) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      onDrag(e.clientX - lastX.current);
      lastX.current = e.clientX;
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onDrag]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="flex-shrink-0 w-2 border-l border-r border-border-hover cursor-col-resize hover:bg-[#14F195]/10 transition-colors select-none"
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface LessonViewProps {
  lesson: SanityLesson;
  courseSlug: string;
  courseTitle: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
}

export function LessonView({
  lesson,
  courseSlug,
  courseTitle,
  prevLessonId,
  nextLessonId,
}: LessonViewProps) {
  const t = useTranslations("lesson");
  const { publicKey } = useWallet();

  const isChallenge = lesson.type === "challenge";
  const storageKey = `code_${courseSlug}_${lesson._id}`;

  const [code, setCode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(storageKey) ?? lesson.starterCode ?? "";
    }
    return lesson.starterCode ?? "";
  });
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Array<{ description: string; passed: boolean }>>([]);
  const [panelWidth, setPanelWidth] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hints: derive from test case descriptions as fallback
  const hints: string[] = [];

  const handleCodeChange = (value: string | undefined) => {
    setCode(value ?? "");
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, value ?? "");
    }
  };

  const handleComplete = useCallback(async () => {
    if (!publicKey) return;
    setCompleting(true);
    try {
      const result = await completeLesson(courseSlug, lesson.order ?? 0);
      if (result.success) {
        setCompleted(true);
        setXpEarned(lesson.xpReward);
        if (lesson.testCases) {
          setTestResults(lesson.testCases.map((tc) => ({ description: tc.description, passed: true })));
        }
        setTimeout(() => setXpEarned(null), 3000);
      }
    } finally {
      setCompleting(false);
    }
  }, [publicKey, courseSlug, lesson]);

  const handleDividerDrag = useCallback((dx: number) => {
    if (!containerRef.current) return;
    const w = containerRef.current.getBoundingClientRect().width;
    if (w === 0) return;
    setPanelWidth((p) => Math.min(75, Math.max(25, p + (dx / w) * 100)));
  }, []);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-10 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={{ pathname: "/courses/[slug]", params: { slug: courseSlug } }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            {courseTitle}
          </Link>
          <span className="text-subtle">/</span>
          <span className="text-xs font-mono text-foreground truncate max-w-[240px]">
            {lesson.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {completed && (
            <span className="flex items-center gap-1 text-xs font-mono text-[#14F195]">
              <CheckCircle className="h-3.5 w-3.5" />
              {t("completed")}
            </span>
          )}
          {prevLessonId && (
            <Link
              href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: prevLessonId } }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
              {t("previous")}
            </Link>
          )}
          {nextLessonId ? (
            <Link
              href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: nextLessonId } }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors"
            >
              {t("next")} <ChevronRight className="h-3 w-3" />
            </Link>
          ) : (
            <Link
              href={{ pathname: "/courses/[slug]", params: { slug: courseSlug } }}
              className="flex items-center gap-1 text-[#14F195] hover:text-[#0D9E61] text-xs font-mono transition-colors"
            >
              Finish Course <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Main */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left: content */}
        <div
          className="overflow-y-auto p-6 flex-shrink-0"
          style={{ width: isChallenge ? `${panelWidth}%` : "100%" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#14F195]/30 bg-[#14F195]/10 text-[#14F195]">
              {isChallenge ? "⚡ Challenge" : "📖 Reading"}
            </span>
            {lesson.estimatedMinutes && (
              <span className="text-[10px] font-mono text-muted-foreground">{lesson.estimatedMinutes} min</span>
            )}
            <span className="text-[10px] font-mono text-[#14F195]">+{lesson.xpReward} XP</span>
          </div>

          <h1 className="font-mono text-xl font-bold text-foreground mb-6">{lesson.title}</h1>

          {/* Portable Text content */}
          {lesson.content ? (
            <div className="max-w-none">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <PortableText value={lesson.content as any} components={ptComponents} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-mono">No content available for this lesson.</p>
          )}

          {/* Hints for challenge */}
          {isChallenge && <HintsPanel hints={hints} />}

          {/* Solution toggle */}
          {isChallenge && lesson.solutionCode && <SolutionPanel code={lesson.solutionCode} />}

          {/* Next lesson banner after completion (challenge) */}
          {isChallenge && completed && (
            <div className="mt-6">
              <NextLessonBanner courseSlug={courseSlug} nextLessonId={nextLessonId} />
            </div>
          )}

          {/* Mark complete (content lessons) */}
          {!isChallenge && (
            <div className="mt-8 space-y-3">
              {!completed ? (
                <button
                  onClick={handleComplete}
                  disabled={completing || !publicKey}
                  className="flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-semibold bg-[#14F195] text-black hover:bg-accent-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!publicKey ? "Connect wallet to mark complete" : undefined}
                >
                  {completing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t("complete")}
                </button>
              ) : (
                <NextLessonBanner courseSlug={courseSlug} nextLessonId={nextLessonId} />
              )}
              {!isChallenge && lesson.solutionCode && <SolutionPanel code={lesson.solutionCode} />}
            </div>
          )}
        </div>

        {/* Divider + editor (challenge only) */}
        {isChallenge && (
          <>
            <ResizableDivider onDrag={handleDividerDrag} />
            <div
              className="flex flex-col flex-shrink-0 overflow-hidden"
              style={{ width: `${100 - panelWidth}%` }}
            >
              <MonacoEditor
                value={code}
                onChange={handleCodeChange}
                language={lesson.starterCode?.trim().startsWith("use ") ? "rust" : "typescript"}
                height="100%"
                className="flex-1 rounded-none border-0 border-b border-border"
              />

              {/* Test results + run button */}
              <div className="p-4 space-y-3 flex-shrink-0">
                {testResults.length > 0 && (
                  <div className="space-y-1">
                    {testResults.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono">
                        <span className={r.passed ? "text-[#14F195]" : "text-[#FF4444]"}>
                          {r.passed ? "✓" : "✗"}
                        </span>
                        <span className={r.passed ? "text-muted-foreground" : "text-[#FF4444]"}>
                          {r.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show test cases before run */}
                {testResults.length === 0 && lesson.testCases && lesson.testCases.length > 0 && (
                  <div className="space-y-1">
                    {lesson.testCases.map((tc, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <span className="text-subtle">○</span>
                        <span>{tc.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setCode(lesson.starterCode ?? "")}
                    className="px-3 py-1.5 text-xs font-mono text-muted-foreground border border-border rounded hover:border-border-hover hover:text-foreground transition-colors"
                  >
                    {t("resetCode")}
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={completing || completed || !publicKey}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-1.5 rounded font-mono text-sm font-semibold transition-colors",
                      completed
                        ? "bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30"
                        : "bg-[#14F195] text-black hover:bg-accent-dim"
                    )}
                    title={!publicKey ? "Connect wallet to submit" : undefined}
                  >
                    {completing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {completed ? (
                      <><CheckCircle className="h-3.5 w-3.5" /> {t("completed")}</>
                    ) : (
                      <><Zap className="h-3.5 w-3.5" /> {t("complete")}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* XP toast */}
      {xpEarned && (
        <div className="fixed bottom-6 right-6 bg-[#14F195] text-black font-mono font-bold text-sm px-4 py-2.5 rounded shadow-lg animate-bounce">
          +{xpEarned} XP earned!
        </div>
      )}
    </div>
  );
}
