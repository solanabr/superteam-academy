"use client";

import { useEffect, useRef } from "react";

type TerminalOutputProps = {
  output: string;
  status: "idle" | "running" | "success" | "error";
  executionStats?: { memory?: string; cpuTime?: string };
  onClear?: () => void;
  /** When true, show a prominent banner for JDoodle daily API limit */
  dailyLimitReached?: boolean;
};

type OutputLine = {
  text: string;
  type: "stdout" | "stderr" | "error" | "success" | "info";
};

/**
 * Parses terminal output and categorizes lines by type for color coding
 */
function parseTerminalOutput(output: string, hasError: boolean): OutputLine[] {
  if (!output.trim()) return [];

  const lines = output.split("\n");
  const parsed: OutputLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect error patterns
    if (
      hasError ||
      /error|Error|ERROR|failed|Failed|FAILED|exception|Exception/.test(trimmed) ||
      /^\s*error:/i.test(trimmed) ||
      /^\s*Error:/i.test(trimmed) ||
      /^\s*\.rs:\d+:\d+:\s*error/i.test(trimmed) || // Rust errors
      /^\s*error TS\d+:/i.test(trimmed) || // TypeScript errors
      /^\s*SyntaxError/i.test(trimmed) || // JavaScript errors
      /^\s*ReferenceError/i.test(trimmed) ||
      /^\s*TypeError/i.test(trimmed)
    ) {
      parsed.push({ text: line, type: "error" });
    }
    // Detect success patterns
    else if (/^\s*✓|success|Success|SUCCESS|passed|Passed|PASSED/.test(trimmed)) {
      parsed.push({ text: line, type: "success" });
    }
    // Detect info patterns (line numbers, file paths, etc.)
    else if (/^\s*(\d+|\w+\.(rs|ts|js|tsx|jsx)):\d+:\d+/.test(trimmed)) {
      parsed.push({ text: line, type: "info" });
    }
    // Default to stdout
    else {
      parsed.push({ text: line, type: "stdout" });
    }
  }

  return parsed;
}

const DAILY_LIMIT_MESSAGE = "Daily code compiling limit reached. Please try again in 24 hours.";

export function TerminalOutput({
  output,
  status,
  executionStats,
  onClear,
  dailyLimitReached = false,
}: TerminalOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (scrollRef.current && status !== "idle") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, status]);

  const hasError = status === "error";
  const parsedLines = parseTerminalOutput(output, hasError);
  const isEmpty = !output.trim();

  return (
    <div className="flex min-h-[180px] flex-col rounded-md border border-border-subtle bg-black/90 text-xs font-mono">
      {/* JDoodle daily limit banner */}
      {dailyLimitReached && (
        <div
          className="flex items-center justify-center border-b border-rust/50 bg-rust/15 px-3 py-2.5 text-center"
          role="alert"
        >
          <span className="font-semibold text-rust">{DAILY_LIMIT_MESSAGE}</span>
        </div>
      )}
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-border-subtle/60 bg-white/5 px-3 py-1.5">
        <span className="uppercase tracking-wide text-text-secondary">Terminal</span>
        <div className="flex items-center gap-3">
          {executionStats?.memory && (
            <span className="text-[10px] text-text-secondary">
              Memory: {executionStats.memory} KB
            </span>
          )}
          {executionStats?.cpuTime && (
            <span className="text-[10px] text-text-secondary">
              CPU: {executionStats.cpuTime}s
            </span>
          )}
          {onClear && !isEmpty && (
            <button
              onClick={onClear}
              className="text-[10px] text-text-secondary hover:text-text-primary transition-colors"
              title="Clear terminal"
            >
              Clear
            </button>
          )}
          <span
            className={`text-[10px] ${
              status === "running"
                ? "text-text-secondary"
                : status === "success"
                  ? "text-solana"
                  : status === "error"
                    ? "text-rust"
                    : "text-text-secondary"
            }`}
          >
            {status === "running"
              ? "Running…"
              : status === "success"
                ? "Execution successful"
                : status === "error"
                  ? "Execution failed"
                  : "Idle"}
          </span>
        </div>
      </div>

      {/* Terminal Content - Scrollable */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto px-3 py-2"
        style={{ maxHeight: "400px", minHeight: "120px" }}
      >
        {isEmpty ? (
          <pre className="whitespace-pre-wrap break-words text-text-secondary">
            {"> Ready. Write code and click \"Run Code\" to execute.\n"}
          </pre>
        ) : (
          <pre className="whitespace-pre-wrap break-words">
            {parsedLines.map((line, idx) => {
              let colorClass = "text-text-primary"; // Default stdout color

              switch (line.type) {
                case "error":
                  colorClass = "text-rust"; // Red/orange for errors
                  break;
                case "stderr":
                  colorClass = "text-rust/90"; // Slightly muted red for stderr
                  break;
                case "success":
                  colorClass = "text-solana"; // Green for success
                  break;
                case "info":
                  colorClass = "text-text-secondary"; // Grey for info (line numbers, paths)
                  break;
                case "stdout":
                default:
                  colorClass = "text-text-primary"; // White for normal output
                  break;
              }

              return (
                <span key={idx} className={colorClass}>
                  {line.text}
                  {idx < parsedLines.length - 1 && "\n"}
                </span>
              );
            })}
          </pre>
        )}
      </div>
    </div>
  );
}
