"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ── Token: a colored chunk of text within a line ── */
interface CodeToken {
  text: string;
  className: string;
}

/* ── One line of code with its line number ── */
interface CodeLine {
  lineNum: number;
  indent: string;
  tokens: CodeToken[];
}

/* ── A real-looking Anchor program with richer syntax ── */
const CODE_LINES: CodeLine[] = [
  // 1: use anchor_lang::prelude::*;
  {
    lineNum: 1,
    indent: "",
    tokens: [
      { text: "use ", className: "text-secondary" },
      { text: "anchor_lang", className: "text-primary" },
      { text: "::prelude::*;", className: "text-text-3" },
    ],
  },
  // 2: declare_id!("ACAD...");
  {
    lineNum: 2,
    indent: "",
    tokens: [
      { text: "declare_id!", className: "text-accent" },
      { text: "(", className: "text-text-3" },
      { text: '"ACAD..."', className: "text-success" },
      { text: ");", className: "text-text-3" },
    ],
  },
  // 3: (empty)
  { lineNum: 3, indent: "", tokens: [] },
  // 4: #[program]
  {
    lineNum: 4,
    indent: "",
    tokens: [{ text: "#[program]", className: "text-accent" }],
  },
  // 5: pub mod academy {
  {
    lineNum: 5,
    indent: "",
    tokens: [
      { text: "pub mod ", className: "text-secondary" },
      { text: "academy", className: "text-primary" },
      { text: " {", className: "text-text-3" },
    ],
  },
  // 6:   use super::*;
  {
    lineNum: 6,
    indent: "  ",
    tokens: [
      { text: "use super", className: "text-secondary" },
      { text: "::*;", className: "text-text-3" },
    ],
  },
  // 7: (empty)
  { lineNum: 7, indent: "", tokens: [] },
  // 8:   pub fn mint(ctx: Context<MintCert>) -> Result<()> {
  {
    lineNum: 8,
    indent: "  ",
    tokens: [
      { text: "pub fn ", className: "text-secondary" },
      { text: "mint", className: "text-primary" },
      { text: "(ctx: ", className: "text-text-3" },
      { text: "Context", className: "text-accent" },
      { text: "<MintCert>) -> ", className: "text-text-3" },
      { text: "Result", className: "text-accent" },
      { text: "<()> {", className: "text-text-3" },
    ],
  },
  // 9:     let cert = &mut ctx.accounts.certificate;
  {
    lineNum: 9,
    indent: "    ",
    tokens: [
      { text: "let ", className: "text-secondary" },
      { text: "cert = ", className: "text-text-3" },
      { text: "&mut ", className: "text-secondary" },
      { text: "ctx.accounts.", className: "text-text-3" },
      { text: "certificate", className: "text-primary" },
      { text: ";", className: "text-text-3" },
    ],
  },
  // 10:    cert.owner = ctx.accounts.signer.key();
  {
    lineNum: 10,
    indent: "    ",
    tokens: [
      { text: "cert.owner = ctx.accounts.signer.", className: "text-text-3" },
      { text: "key()", className: "text-primary" },
      { text: ";", className: "text-text-3" },
    ],
  },
  // 11:    Ok(())
  {
    lineNum: 11,
    indent: "    ",
    tokens: [
      { text: "Ok", className: "text-accent" },
      { text: "(())", className: "text-text-3" },
    ],
  },
  // 12:  }
  {
    lineNum: 12,
    indent: "  ",
    tokens: [{ text: "}", className: "text-text-3" }],
  },
  // 13: }
  {
    lineNum: 13,
    indent: "",
    tokens: [{ text: "}", className: "text-text-3" }],
  },
];

/* ── The session after the code: run the tests, get paid ── */
const TEST_CMD = "anchor test";

interface OutputLine {
  text: string;
  className: string;
  mark?: "pass";
}

const TEST_OUTPUT: OutputLine[] = [
  { text: "mints the certificate", className: "text-text-2", mark: "pass" },
  { text: "rejects a duplicate mint", className: "text-text-2", mark: "pass" },
  { text: "owner matches the signer", className: "text-text-2", mark: "pass" },
  { text: "3 passing (0.4s)", className: "text-success" },
];

/* ── Precompute total character count (indent + tokens) ── */
function lineCharCount(line: CodeLine): number {
  return (
    line.indent.length +
    line.tokens.reduce((sum, tok) => sum + tok.text.length, 0)
  );
}

const TOTAL_CHARS = CODE_LINES.reduce(
  (sum, line) => sum + lineCharCount(line),
  0
);

/* ── The closing beat: the session hands you the next command ── */
const START_CMD = "academy start";

/* ── Timing config — one continuous beat after the hero copy lands ── */
const BASE_DELAY = 18;
const JITTER = 8;
const LINE_PAUSE = 100;
const EMPTY_LINE_PAUSE = 60;
const INITIAL_DELAY = 950;
const CMD_PAUSE = 450; // rest between finished code and `$ anchor test`
const CMD_CHAR_DELAY = 55;
const OUT_LINE_DELAY = 380;
const XP_DELAY = 320;
const START_PAUSE = 900; // beat before the terminal types `academy start`

/* ── Session phases ── */
type Phase = "code" | "cmd" | "out" | "done";

/* ── Particle burst offsets for the +XP payoff (rough circle, px) ── */
const XP_PARTICLES = [
  { px: 46, py: -34, color: "var(--xp)" },
  { px: 58, py: 6, color: "var(--primary)" },
  { px: 34, py: 46, color: "var(--xp)" },
  { px: -2, py: 58, color: "var(--primary)" },
  { px: -42, py: 38, color: "var(--xp)" },
  { px: -56, py: -2, color: "var(--primary)" },
  { px: -34, py: -44, color: "var(--xp)" },
  { px: 4, py: -58, color: "var(--primary)" },
];

export function TerminalTypewriter({
  replayLabel,
  replayHint,
}: {
  replayLabel: string;
  replayHint: string;
}) {
  const [revealed, setRevealed] = useState(0);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>("code");
  const [cmdChars, setCmdChars] = useState(0);
  const [outStep, setOutStep] = useState(0);
  const [showXp, setShowXp] = useState(false);
  const [startChars, setStartChars] = useState(0);
  // bumps on every replay so one-shot effects (boot sweep, burst) re-run
  const [runId, setRunId] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jumpToEnd = useCallback(() => {
    setStarted(true);
    setRevealed(TOTAL_CHARS);
    setPhase("done");
    setCmdChars(TEST_CMD.length);
    setOutStep(TEST_OUTPUT.length);
    setShowXp(true);
    setStartChars(START_CMD.length);
  }, []);

  const replay = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      jumpToEnd();
      return;
    }
    setRevealed(0);
    setPhase("code");
    setCmdChars(0);
    setOutStep(0);
    setShowXp(false);
    setStartChars(0);
    setRunId((r) => r + 1);
    setStarted(true);
  }, [jumpToEnd]);

  /* Reduced motion: skip the show, render the finished session. */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      jumpToEnd();
    }
  }, [jumpToEnd]);

  /* ── Figure out which line boundary we're at ── */
  const getLineEndPositions = useCallback(() => {
    const positions: number[] = [];
    let cumulative = 0;
    for (const line of CODE_LINES) {
      cumulative += lineCharCount(line);
      positions.push(cumulative);
    }
    return positions;
  }, []);

  /* ── Phase: code — advance one character with realistic timing ── */
  useEffect(() => {
    if (!started) {
      timeoutRef.current = setTimeout(() => setStarted(true), INITIAL_DELAY);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    if (phase !== "code") return;

    if (revealed >= TOTAL_CHARS) {
      timeoutRef.current = setTimeout(() => setPhase("cmd"), CMD_PAUSE);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    const lineEnds = getLineEndPositions();
    const isAtLineEnd = lineEnds.includes(revealed);

    const currentLineIndex = lineEnds.findIndex((end) => revealed < end);
    const currentLine: CodeLine | undefined =
      currentLineIndex >= 0 ? CODE_LINES[currentLineIndex] : undefined;
    const isEmptyLine =
      currentLine !== undefined && lineCharCount(currentLine) === 0;

    let delay: number;
    if (isEmptyLine) {
      delay = EMPTY_LINE_PAUSE;
    } else if (isAtLineEnd) {
      delay = LINE_PAUSE;
    } else {
      delay = BASE_DELAY + (Math.random() * JITTER * 2 - JITTER);
    }

    timeoutRef.current = setTimeout(() => {
      setRevealed((prev) => {
        if (isEmptyLine && currentLine) {
          return prev + lineCharCount(currentLine);
        }
        return prev + 1;
      });
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [revealed, started, phase, getLineEndPositions]);

  /* ── Phase: cmd — type `$ anchor test` ── */
  useEffect(() => {
    if (phase !== "cmd") return;
    if (cmdChars >= TEST_CMD.length) {
      timeoutRef.current = setTimeout(() => setPhase("out"), OUT_LINE_DELAY);
    } else {
      timeoutRef.current = setTimeout(
        () => setCmdChars((c) => c + 1),
        CMD_CHAR_DELAY
      );
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phase, cmdChars]);

  /* ── Phase: out — print test results, then pay the XP ── */
  useEffect(() => {
    if (phase !== "out") return;
    if (outStep >= TEST_OUTPUT.length) {
      timeoutRef.current = setTimeout(() => {
        setShowXp(true);
        setPhase("done");
      }, XP_DELAY);
    } else {
      timeoutRef.current = setTimeout(
        () => setOutStep((s) => s + 1),
        OUT_LINE_DELAY
      );
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phase, outStep]);

  /* ── Phase: done — the terminal suggests your next move ── */
  useEffect(() => {
    if (phase !== "done" || startChars >= START_CMD.length) return;
    timeoutRef.current = setTimeout(
      () => setStartChars((c) => c + 1),
      startChars === 0 ? START_PAUSE : CMD_CHAR_DELAY + 25
    );
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phase, startChars]);

  /* ── Render a single line with partial reveal ── */
  function renderLine(line: CodeLine, charsToShow: number) {
    if (charsToShow <= 0 && line.tokens.length > 0) return null;

    let remaining = charsToShow;

    const indentToShow = line.indent.slice(0, remaining);
    remaining -= indentToShow.length;

    return (
      <>
        {indentToShow}
        {line.tokens.map((token, i) => {
          if (remaining <= 0) return null;
          const visibleText = token.text.slice(0, remaining);
          remaining -= visibleText.length;
          return (
            <span key={i} className={token.className}>
              {visibleText}
            </span>
          );
        })}
      </>
    );
  }

  /* ── Build visible code lines (only those that have started typing) ── */
  let charsUsed = 0;
  const visibleLines: Array<{
    line: CodeLine;
    charsForLine: number;
    isCurrentLine: boolean;
  }> = [];

  for (let idx = 0; idx < CODE_LINES.length; idx++) {
    const line = CODE_LINES[idx];
    if (!line) continue;
    const lineLen = lineCharCount(line);
    const charsForLine = Math.min(Math.max(revealed - charsUsed, 0), lineLen);

    if (charsUsed < revealed || charsForLine > 0) {
      visibleLines.push({
        line,
        charsForLine,
        isCurrentLine: revealed < charsUsed + lineLen && revealed >= charsUsed,
      });
    }

    charsUsed += lineLen;
    if (charsUsed >= revealed && charsForLine < lineLen) break;
  }

  const codeDone = revealed >= TOTAL_CHARS;
  const cmdVisible = phase !== "code";
  const cursorOnCmd = phase === "cmd" && cmdChars < TEST_CMD.length;

  const titleLabel =
    phase === "code"
      ? "lib.rs"
      : phase === "done"
        ? "✓ 3 passing · lib.rs"
        : "anchor test — running…";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={replayLabel}
      data-phase={phase}
      onClick={replay}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          replay();
        }
      }}
      className="term-ring relative cursor-pointer rounded-lg p-[2.5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {/* +50 XP — the payoff, in Superteam yellow (outside the clipped screen) */}
      {showXp && (
        <div
          className="term-xp-chip absolute -right-3 -top-3 z-20 rounded-md border-[2.5px] border-[var(--accent-border)] bg-card px-3 py-1.5 font-mono text-sm font-black text-xp shadow-card"
          aria-hidden="true"
        >
          +50 XP
        </div>
      )}
      {/* …and its particle burst */}
      {showXp && (
        <div key={`burst-${runId}`} aria-hidden="true">
          {XP_PARTICLES.map((particle, i) => (
            <span
              key={i}
              className="term-particle z-10"
              style={
                {
                  "--px": `${particle.px}px`,
                  "--py": `${particle.py}px`,
                  background: particle.color,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* The screen — everything visual lives inside the clipped frame */}
      <div
        className="relative min-h-[555px] overflow-hidden rounded-[6px] bg-card"
        aria-hidden="true"
      >
        <div className="term-scan" />
        <div key={`sweep-${runId}`} className="term-sweep" />

        {/* Terminal title bar */}
        <div className="flex items-center gap-2 border-b-[2.5px] border-border px-4 py-3">
          <div className="h-3 w-3 rounded-full border-[2px] [background:var(--danger-bg)] [border-color:var(--danger-border-s)]" />
          <div className="h-3 w-3 rounded-full border-[2px] [background:var(--accent-bg)] [border-color:var(--accent-border)]" />
          <div
            className={`h-3 w-3 rounded-full border-[2px] [background:var(--success-bg)] [border-color:var(--success-border-s)] ${
              phase === "done" ? "term-dot-live" : ""
            }`}
          />
          <span
            className={`ml-2 font-mono text-xs ${phase === "done" ? "text-success" : "text-text-3"}`}
          >
            {titleLabel}
          </span>
        </div>

        {/* Code content — grows line by line */}
        <div className="p-5 font-mono text-[13px] leading-relaxed">
          {visibleLines.map(({ line, charsForLine, isCurrentLine }) => (
            <div key={line.lineNum} className="text-text-3">
              <span className="text-text-3 opacity-50">{line.lineNum}</span>
              {"  "}
              {renderLine(line, charsForLine)}
              {isCurrentLine && !codeDone && (
                <span className="relative ml-px inline-block">
                  <span className="inline-block h-[16px] w-[8px] translate-y-[3px] animate-pulse bg-primary opacity-80" />
                </span>
              )}
            </div>
          ))}

          {/* The session: run the tests, watch them pass */}
          {cmdVisible && (
            <div className="mt-4 border-t-[2.5px] border-border pt-3">
              <div className="text-text-2">
                <span className="font-bold text-primary">$ </span>
                {TEST_CMD.slice(0, cmdChars)}
                {cursorOnCmd && (
                  <span className="ml-px inline-block h-[16px] w-[8px] translate-y-[3px] animate-pulse bg-primary opacity-80" />
                )}
              </div>

              {TEST_OUTPUT.slice(0, outStep).map((out, i) => (
                <div key={i} className={`term-out mt-1 ${out.className}`}>
                  {out.mark === "pass" && (
                    <span className="font-bold text-success">{"✓ "}</span>
                  )}
                  {out.text}
                </div>
              ))}

              {/* Session hands you the prompt — and suggests the next move */}
              {phase === "done" && (
                <div className="term-out mt-3 text-text-2">
                  <span className="font-bold text-primary">$ </span>
                  <span className="font-bold text-xp">
                    {START_CMD.slice(0, startChars)}
                  </span>
                  <span className="ml-px inline-block h-[16px] w-[8px] translate-y-[3px] animate-pulse bg-primary opacity-80" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Replay affordance once the session settles */}
        {startChars >= START_CMD.length && (
          <div className="term-replay-hint absolute bottom-3 right-4 font-mono text-[10px] font-bold uppercase tracking-widest text-text-3">
            {"↻ "}
            {replayHint}
          </div>
        )}
      </div>
    </div>
  );
}
