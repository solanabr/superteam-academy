"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Play, Copy, Check, Terminal, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { AnimatedSection } from "./animated-section";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[350px] items-center justify-center bg-[#1e1e1e]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Loading editor...
          </span>
        </div>
      </div>
    ),
  },
);

const DEFAULT_CODE = `use anchor_lang::prelude::*;

declare_id!("ACAD1111111111111111111111111111");

#[program]
pub mod hello_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.authority = ctx.accounts.authority.key();
        msg!("Counter initialized!");
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(1)
            .ok_or(ErrorCode::Overflow)?;
        msg!("Count: {}", counter.count);
        Ok(())
    }
}

#[account]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 32,
        seeds = [b"counter", authority.key().as_ref()],
        bump,
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,
        seeds = [b"counter", authority.key().as_ref()],
        bump,
        has_one = authority,
    )]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Counter overflow")]
    Overflow,
}`;

const SIMULATED_OUTPUT_LINES = [
  "$ anchor build",
  "   Compiling hello_solana v0.1.0",
  "   Finished release [optimized] target(s)",
  "",
  "$ anchor deploy --provider.cluster devnet",
  "   Deploying program...",
  "   Program Id: ACAD1111111111111111111111111111",
  "",
  "$ anchor test",
  "  hello_solana",
  "    \u2713 initializes counter (420ms)",
  "    \u2713 increments counter (380ms)",
  "",
  "  2 passing (800ms)",
];

export function CodePlayground() {
  const t = useTranslations("landing.codePlayground");
  const prefersReducedMotion = useReducedMotion();

  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  async function handleRun() {
    if (running) return;
    setRunning(true);
    setOutput([]);

    for (let i = 0; i < SIMULATED_OUTPUT_LINES.length; i++) {
      await new Promise((r) =>
        setTimeout(r, prefersReducedMotion ? 0 : 80 + Math.random() * 60),
      );
      setOutput((prev) => [...prev, SIMULATED_OUTPUT_LINES[i]]);
    }
    setRunning(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AnimatedSection>
      <section className="bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              {t("sectionTitle")}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              {t("sectionSubtitle")}
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-border bg-[#1e1e1e] shadow-2xl shadow-black/20">
              {/* Editor header */}
              <div className="flex items-center justify-between border-b border-[#333] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <span className="text-xs font-medium text-[#ccc] font-mono">
                      lib.rs
                    </span>
                    <span className="rounded bg-[#333] px-1.5 py-0.5 text-[10px] uppercase text-[#888]">
                      rust
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[#888] transition-colors hover:bg-[#333] hover:text-[#ccc]"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-[#28c840]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? t("copied") : t("copy")}
                  </button>
                  <button
                    onClick={handleRun}
                    disabled={running}
                    className="flex items-center gap-1.5 rounded-lg bg-brazil-green px-3.5 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-brazil-green/90 active:scale-[0.97] disabled:opacity-50"
                  >
                    {running ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    {running ? t("running") : t("run")}
                  </button>
                </div>
              </div>

              {/* Editor + Output split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#333]">
                {/* Monaco Editor */}
                <div className="h-[400px]">
                  <MonacoEditor
                    height="100%"
                    language="rust"
                    theme="vs-dark"
                    value={code}
                    onChange={(value: string | undefined) =>
                      setCode(value ?? "")
                    }
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', monospace",
                      lineNumbers: "on",
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      padding: { top: 12, bottom: 12 },
                      automaticLayout: true,
                      tabSize: 4,
                      wordWrap: "on",
                      bracketPairColorization: { enabled: true },
                      readOnly: false,
                      domReadOnly: false,
                      contextmenu: false,
                      overviewRulerBorder: false,
                      hideCursorInOverviewRuler: true,
                      overviewRulerLanes: 0,
                      renderLineHighlight: "gutter",
                      scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                      },
                    }}
                  />
                </div>

                {/* Output panel */}
                <div className="flex flex-col h-[400px]">
                  <div className="flex items-center gap-2 border-b border-[#333] px-4 py-2">
                    <Terminal className="h-3.5 w-3.5 text-[#888]" />
                    <span className="text-xs text-[#888] font-mono">
                      {t("terminal")}
                    </span>
                  </div>
                  <div
                    ref={outputRef}
                    className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed"
                  >
                    {output.length === 0 && (
                      <p className="text-[#555] italic">{t("placeholder")}</p>
                    )}
                    {output.map((line, i) => (
                      <motion.div
                        key={i}
                        initial={
                          prefersReducedMotion ? {} : { opacity: 0, x: -5 }
                        }
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        className={
                          line.includes("\u2713")
                            ? "text-[#28c840]"
                            : line.startsWith("$")
                              ? "text-[#febc2e]"
                              : line.includes("Compiling") ||
                                  line.includes("Deploying") ||
                                  line.includes("Program Id")
                                ? "text-[#ccc]"
                                : "text-[#888]"
                        }
                      >
                        {line || "\u00A0"}
                      </motion.div>
                    ))}
                    {running && (
                      <span className="inline-block w-2 h-4 bg-[#ccc] animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
