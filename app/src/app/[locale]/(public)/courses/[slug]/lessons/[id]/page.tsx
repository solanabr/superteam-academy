"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, Zap, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { completeLesson } from "@/services/learning-progress";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

// Minimal mock lesson data for demo purposes
const DEMO_LESSON = {
  id: "demo",
  title: "Understanding Solana Accounts",
  type: "challenge" as const,
  xpReward: 100,
  content: `# Understanding Solana Accounts

Every piece of data on Solana lives in an **account**.

## Key Properties

- **Pubkey**: The account's address (32 bytes)
- **Lamports**: SOL balance (1 SOL = 1,000,000,000 lamports)
- **Data**: Arbitrary byte array
- **Owner**: The program that owns this account
- **Executable**: If true, account is a program

## Account Ownership

Programs can only modify accounts they own. The System Program owns all wallet accounts.
`,
  starterCode: `use anchor_lang::prelude::*;

declare_id!("...");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Initialize the counter to 0
        todo!()
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Counter {
    pub count: u64,
}`,
  solutionCode: `use anchor_lang::prelude::*;

declare_id!("...");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 32
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}`,
  testCases: [
    { description: "Counter initializes to 0", input: "", expectedOutput: "count == 0" },
    { description: "Counter is owned by program", input: "", expectedOutput: "owner == program_id" },
  ],
};

const HINTS = [
  "Check the account constraints carefully",
  "Remember to derive the PDA with the correct seeds",
  "The CPI requires the system program",
];

// --- Next lesson banner ---
function NextLessonBanner({ slug, nextLessonId, isLastLesson }: { slug: string; nextLessonId: string; isLastLesson: boolean }) {
  return (
    <div className="border border-[#14F195]/30 bg-[#14F195]/5 rounded-lg px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-[#14F195] shrink-0" />
        <div>
          <p className="font-mono text-sm font-semibold text-foreground">Lesson complete!</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {isLastLesson ? "You finished the last lesson in this course." : "Ready for the next one?"}
          </p>
        </div>
      </div>
      {isLastLesson ? (
        <Link
          href={{ pathname: "/courses/[slug]", params: { slug } }}
          className="shrink-0 flex items-center gap-1.5 bg-[#14F195] text-black font-mono font-semibold text-sm px-4 py-2 rounded hover:bg-[#0D9E61] transition-colors"
        >
          Finish Course <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <Link
          href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug, id: nextLessonId } }}
          className="shrink-0 flex items-center gap-1.5 bg-[#14F195] text-black font-mono font-semibold text-sm px-4 py-2 rounded hover:bg-[#0D9E61] transition-colors"
        >
          Next Lesson <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

// --- Hints component ---
function HintsPanel() {
  const [revealedCount, setRevealedCount] = useState(0);
  const [open, setOpen] = useState(false);

  const handleRevealNext = () => {
    if (revealedCount < HINTS.length) {
      setRevealedCount((prev) => prev + 1);
    }
  };

  return (
    <div className="mt-6 border border-border rounded">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>💡 Hints</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {HINTS.slice(0, revealedCount).map((hint, i) => (
            <div
              key={i}
              className="border border-[#14F195]/20 bg-[#14F195]/5 rounded p-3 text-sm font-mono text-foreground"
            >
              <span className="text-[#14F195] mr-2">{i + 1}.</span>
              {hint}
            </div>
          ))}

          {revealedCount < HINTS.length && (
            <button
              onClick={handleRevealNext}
              className="text-xs font-mono text-[#14F195]/70 hover:text-[#14F195] border border-[#14F195]/20 hover:border-[#14F195]/50 px-3 py-1.5 rounded transition-colors"
            >
              💡 Show Hint {revealedCount + 1} of {HINTS.length}
            </button>
          )}

          {revealedCount === HINTS.length && (
            <p className="text-xs font-mono text-muted-foreground">All hints revealed.</p>
          )}
        </div>
      )}
    </div>
  );
}

// --- Solution toggle component ---
function SolutionPanel() {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setShowSolution((v) => !v)}
        className={cn(
          "text-xs font-mono px-3 py-1.5 rounded border transition-colors",
          showSolution
            ? "border-[#14F195]/50 text-[#14F195]"
            : "border-[#333333] text-muted-foreground hover:border-[#14F195]/50 hover:text-[#14F195]"
        )}
      >
        {showSolution ? "Hide Solution" : "Show Solution"}
      </button>

      {showSolution && (
        <div className="mt-3 border border-border rounded overflow-hidden">
          <div className="px-3 py-1.5 bg-card border-b border-border text-xs font-mono text-muted-foreground">
            solution.rs — read only
          </div>
          <MonacoEditor
            value={DEMO_LESSON.solutionCode}
            language="rust"
            readOnly
            height="260px"
            className="rounded-none border-0"
          />
        </div>
      )}
    </div>
  );
}

// --- Resizable divider ---
interface ResizableDividerProps {
  onDrag: (deltaX: number) => void;
}

function ResizableDivider({ onDrag }: ResizableDividerProps) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - lastX.current;
      lastX.current = e.clientX;
      onDrag(delta);
    };

    const handleMouseUp = () => {
      dragging.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onDrag]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="flex-shrink-0 w-2 border-l border-r border-border-hover cursor-col-resize hover:bg-[#14F195]/10 transition-colors select-none"
    />
  );
}

// --- Main page ---
export default function LessonPage() {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const t = useTranslations("lesson");
  const { publicKey } = useWallet();

  const [code, setCode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`code_${slug}_${id}`) ?? DEMO_LESSON.starterCode;
    }
    return DEMO_LESSON.starterCode;
  });
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Array<{ description: string; passed: boolean }>>([]);
  const [panelWidth, setPanelWidth] = useState(50);

  const containerRef = useRef<HTMLDivElement>(null);

  const isChallenge = DEMO_LESSON.type === "challenge";

  // Parse next lesson ID
  const parts = id.split("-l");
  const coursePrefix = parts[0];
  const lessonNum = parseInt(parts[1] || "1", 10);
  const nextLessonId = `${coursePrefix}-l${lessonNum + 1}`;
  const isLastLesson = lessonNum >= 6;

  const handleCodeChange = (value: string | undefined) => {
    setCode(value ?? "");
    if (typeof window !== "undefined") {
      localStorage.setItem(`code_${slug}_${id}`, value ?? "");
    }
  };

  const handleComplete = useCallback(async () => {
    if (!publicKey) return;
    setCompleting(true);
    try {
      const result = await completeLesson(slug, 0);
      if (result.success) {
        setCompleted(true);
        setXpEarned(DEMO_LESSON.xpReward);
        setTestResults(DEMO_LESSON.testCases.map((tc) => ({ description: tc.description, passed: true })));
        setTimeout(() => setXpEarned(null), 3000);
      }
    } finally {
      setCompleting(false);
    }
  }, [publicKey, slug]);

  const handleDividerDrag = useCallback((deltaX: number) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    if (containerWidth === 0) return;
    const deltaPct = (deltaX / containerWidth) * 100;
    setPanelWidth((prev) => Math.min(75, Math.max(25, prev + deltaPct)));
  }, []);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-10 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={{ pathname: "/courses/[slug]", params: { slug } }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Back
          </Link>
          <span className="text-subtle">/</span>
          <span className="text-xs font-mono text-foreground truncate max-w-[200px]">
            {DEMO_LESSON.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {completed && (
            <span className="flex items-center gap-1 text-xs font-mono text-[#14F195]">
              <CheckCircle className="h-3.5 w-3.5" />
              {t("completed")}
            </span>
          )}
          {isLastLesson ? (
            <Link
              href={{ pathname: "/courses/[slug]", params: { slug } }}
              className="flex items-center gap-1.5 text-[#14F195] hover:text-[#0D9E61] text-xs font-mono transition-colors"
            >
              <ChevronRight className="h-3 w-3" />
              Finish Course ✓
            </Link>
          ) : (
            <Link
              href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug, id: nextLessonId } }}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors"
            >
              <ChevronRight className="h-3 w-3" />
              {t("next")}
            </Link>
          )}
        </div>
      </div>

      {/* Main content */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left: content */}
        <div
          className="overflow-y-auto p-6 flex-shrink-0"
          style={{ width: `${panelWidth}%` }}
        >
          <h1 className="font-mono text-xl font-bold text-foreground mb-4">
            {DEMO_LESSON.title}
          </h1>

          <div className="prose prose-invert prose-sm max-w-none font-mono">
            {DEMO_LESSON.content.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return <h2 key={i} className="text-foreground text-base font-bold mt-5 mb-2">{line.slice(3)}</h2>;
              }
              if (line.startsWith("# ")) {
                return <h1 key={i} className="text-foreground text-lg font-bold mb-3">{line.slice(2)}</h1>;
              }
              if (line.startsWith("- **")) {
                const [term, ...rest] = line.slice(2).split("**:");
                return (
                  <div key={i} className="flex gap-2 text-sm text-muted-foreground mb-1">
                    <span className="text-[#14F195] font-semibold">{term.replace("**", "")}</span>
                    <span>{rest.join("").replace(/\*/g, "")}</span>
                  </div>
                );
              }
              if (line.trim() === "") return <div key={i} className="h-2" />;
              return <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-1">{line.replace(/\*\*/g, "")}</p>;
            })}
          </div>

          {/* Hints */}
          {isChallenge && <HintsPanel />}

          {/* Solution toggle */}
          {isChallenge && <SolutionPanel />}

          {/* Next lesson banner — appears after completing challenge */}
          {isChallenge && completed && (
            <div className="mt-6">
              <NextLessonBanner slug={slug} nextLessonId={nextLessonId} isLastLesson={isLastLesson} />
            </div>
          )}

          {/* Complete button for content lessons */}
          {!isChallenge && (
            <div className="mt-8 space-y-3">
              {!completed ? (
                <button
                  onClick={handleComplete}
                  disabled={completing || !publicKey}
                  className="flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-semibold bg-[#14F195] text-black hover:bg-accent-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t("complete")}
                </button>
              ) : (
                <NextLessonBanner slug={slug} nextLessonId={nextLessonId} isLastLesson={isLastLesson} />
              )}
            </div>
          )}

          {/* Solution toggle for content lessons */}
          {!isChallenge && <SolutionPanel />}
        </div>

        {/* Resizable divider */}
        {isChallenge && (
          <ResizableDivider onDrag={handleDividerDrag} />
        )}

        {/* Right: editor (challenge only) */}
        {isChallenge && (
          <div
            className="flex flex-col flex-shrink-0 overflow-hidden"
            style={{ width: `${100 - panelWidth}%` }}
          >
            <MonacoEditor
              value={code}
              onChange={handleCodeChange}
              language="rust"
              height="100%"
              className="flex-1 rounded-none border-0 border-b border-border"
            />

            {/* Test results + actions */}
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

              <div className="flex gap-2">
                <button
                  onClick={() => setCode(DEMO_LESSON.starterCode)}
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
        )}
      </div>

      {/* XP earned toast */}
      {xpEarned && (
        <div className="fixed bottom-6 right-6 bg-[#14F195] text-black font-mono font-bold text-sm px-4 py-2.5 rounded shadow-lg animate-bounce">
          +{xpEarned} XP earned!
        </div>
      )}
    </div>
  );
}
