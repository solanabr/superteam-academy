"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, Zap } from "lucide-react";
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
  testCases: [
    { description: "Counter initializes to 0", input: "", expectedOutput: "count == 0" },
    { description: "Counter is owned by program", input: "", expectedOutput: "owner == program_id" },
  ],
};

export default function LessonPage() {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const t = useTranslations("lesson");
  const { publicKey } = useWallet();

  const [code, setCode] = useState(DEMO_LESSON.starterCode);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Array<{ description: string; passed: boolean }>>([]);

  const isChallenge = DEMO_LESSON.type === "challenge";

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

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#0A0A0A]">
      {/* Top bar */}
      <div className="h-10 border-b border-[#1F1F1F] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={{ pathname: "/courses/[slug]", params: { slug } }}
            className="flex items-center gap-1 text-xs text-[#666666] hover:text-[#EDEDED] font-mono transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Back
          </Link>
          <span className="text-[#333333]">/</span>
          <span className="text-xs font-mono text-[#EDEDED] truncate max-w-[200px]">
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
          <button className="flex items-center gap-1.5 text-[#666666] hover:text-[#EDEDED] text-xs font-mono transition-colors">
            <ChevronRight className="h-3 w-3" />
            {t("next")}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: content */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-[#1F1F1F]">
          <h1 className="font-mono text-xl font-bold text-[#EDEDED] mb-4">
            {DEMO_LESSON.title}
          </h1>

          <div className="prose prose-invert prose-sm max-w-none font-mono">
            {DEMO_LESSON.content.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return <h2 key={i} className="text-[#EDEDED] text-base font-bold mt-5 mb-2">{line.slice(3)}</h2>;
              }
              if (line.startsWith("# ")) {
                return <h1 key={i} className="text-[#EDEDED] text-lg font-bold mb-3">{line.slice(2)}</h1>;
              }
              if (line.startsWith("- **")) {
                const [term, ...rest] = line.slice(2).split("**:");
                return (
                  <div key={i} className="flex gap-2 text-sm text-[#666666] mb-1">
                    <span className="text-[#14F195] font-semibold">{term.replace("**", "")}</span>
                    <span>{rest.join("").replace(/\*/g, "")}</span>
                  </div>
                );
              }
              if (line.trim() === "") return <div key={i} className="h-2" />;
              return <p key={i} className="text-sm text-[#666666] leading-relaxed mb-1">{line.replace(/\*\*/g, "")}</p>;
            })}
          </div>

          {/* Complete button for content lessons */}
          {!isChallenge && (
            <div className="mt-8">
              <button
                onClick={handleComplete}
                disabled={completing || completed || !publicKey}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-semibold transition-colors",
                  completed
                    ? "bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 cursor-default"
                    : "bg-[#14F195] text-black hover:bg-[#0D9E61]"
                )}
              >
                {completing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {completed ? (
                  <><CheckCircle className="h-3.5 w-3.5" /> {t("completed")}</>
                ) : (
                  t("complete")
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right: editor (challenge only) */}
        {isChallenge && (
          <div className="w-1/2 flex flex-col flex-shrink-0">
            <MonacoEditor
              value={code}
              onChange={(v) => setCode(v ?? "")}
              language="rust"
              height="100%"
              className="flex-1 rounded-none border-0 border-b border-[#1F1F1F]"
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
                      <span className={r.passed ? "text-[#666666]" : "text-[#FF4444]"}>
                        {r.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setCode(DEMO_LESSON.starterCode)}
                  className="px-3 py-1.5 text-xs font-mono text-[#666666] border border-[#1F1F1F] rounded hover:border-[#2E2E2E] hover:text-[#EDEDED] transition-colors"
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
                      : "bg-[#14F195] text-black hover:bg-[#0D9E61]"
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
