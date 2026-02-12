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

/* ── Index of the comment line with animated dots (0-based) ── */
const ANIMATED_LINE_INDEX = 13;

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
  // 2: declare_id!("So1arium...");
  {
    lineNum: 2,
    indent: "",
    tokens: [
      { text: "declare_id!", className: "text-accent" },
      { text: "(", className: "text-text-3" },
      { text: '"So1arium..."', className: "text-success" },
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
  // 5: pub mod solarium {
  {
    lineNum: 5,
    indent: "",
    tokens: [
      { text: "pub mod ", className: "text-secondary" },
      { text: "solarium", className: "text-primary" },
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
  // 14: // You'll build this. And more...
  {
    lineNum: 14,
    indent: "",
    tokens: [
      { text: "// You'll build this. And more", className: "text-success" },
    ],
  },
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

/* ── Typing speed config ── */
const BASE_DELAY = 18;
const JITTER = 8;
const LINE_PAUSE = 100;
const EMPTY_LINE_PAUSE = 60;
const INITIAL_DELAY = 300;
const DOT_CYCLE_MS = 600;

/* ── Animated dots: cycles  .  ..  ...  (blank)  ── */
const DOT_STATES = [".", "..", "...", ""];

function AnimatedDots() {
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % DOT_STATES.length);
    }, DOT_CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  return <span className="text-success">{DOT_STATES[dotIndex]}</span>;
}

export function TerminalTypewriter() {
  const [revealed, setRevealed] = useState(0);
  const [started, setStarted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /* ── Advance one character with realistic timing ── */
  useEffect(() => {
    if (!started) {
      timeoutRef.current = setTimeout(() => setStarted(true), INITIAL_DELAY);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    if (revealed >= TOTAL_CHARS) return;

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
  }, [revealed, started, getLineEndPositions]);

  /* ── Check if a specific code line is fully revealed ── */
  const isLineFullyRevealed = useCallback(
    (lineIndex: number) => {
      let charsBefore = 0;
      for (let i = 0; i < lineIndex; i++) {
        const line = CODE_LINES[i];
        if (line) charsBefore += lineCharCount(line);
      }
      const line = CODE_LINES[lineIndex];
      if (!line) return false;
      return revealed >= charsBefore + lineCharCount(line);
    },
    [revealed]
  );

  /* ── Render a single line with partial reveal ── */
  function renderLine(line: CodeLine, charsToShow: number, lineIndex: number) {
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
        {/* Animated dots on the comment line after it's fully typed */}
        {lineIndex === ANIMATED_LINE_INDEX &&
          isLineFullyRevealed(ANIMATED_LINE_INDEX) && <AnimatedDots />}
      </>
    );
  }

  /* ── Build visible lines (only those that have started typing) ── */
  let charsUsed = 0;
  const visibleLines: Array<{
    line: CodeLine;
    lineIndex: number;
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
        lineIndex: idx,
        charsForLine,
        isCurrentLine: revealed < charsUsed + lineLen && revealed >= charsUsed,
      });
    }

    charsUsed += lineLen;
    if (charsUsed >= revealed && charsForLine < lineLen) break;
  }

  const isComplete = revealed >= TOTAL_CHARS;

  return (
    <div className="min-h-[400px] rounded-lg border-[2.5px] border-border bg-card shadow-card">
      {/* Terminal title bar */}
      <div className="flex items-center gap-2 border-b-[2.5px] border-border px-4 py-3">
        <div className="border-danger/40 bg-danger/20 h-3 w-3 rounded-full border-[2px]" />
        <div className="border-accent/40 bg-accent/20 h-3 w-3 rounded-full border-[2px]" />
        <div className="border-success/40 bg-success/20 h-3 w-3 rounded-full border-[2px]" />
        <span className="ml-2 font-mono text-xs text-text-3">lib.rs</span>
      </div>

      {/* Code content — grows line by line */}
      <div className="p-5 font-mono text-[13px] leading-relaxed">
        {visibleLines.map(
          ({ line, lineIndex, charsForLine, isCurrentLine }) => (
            <div key={line.lineNum} className="text-text-3">
              <span className="text-text-3/50">{line.lineNum}</span>
              {"  "}
              {renderLine(line, charsForLine, lineIndex)}
              {isCurrentLine && !isComplete && (
                <span className="relative ml-px inline-block">
                  <span className="bg-primary/80 inline-block h-[16px] w-[8px] translate-y-[3px] animate-pulse" />
                </span>
              )}
            </div>
          )
        )}

        {/* Cursor on next line after all code is typed */}
        {isComplete && (
          <div className="text-text-3">
            <span className="text-text-3/50">15</span>
            {"  "}
            <span className="bg-primary/70 inline-block h-[18px] w-[9px] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
