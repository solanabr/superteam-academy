"use client";

import { useState } from "react";
import { CodeEditor, SupportedLanguage } from "./CodeEditor";
import { Button } from "@/components/ui/button";

type ChallengeRunnerProps = {
  language: SupportedLanguage;
  starterCode?: string;
  testCases?: Array<{ name?: string; input?: string; expected?: string }>;
  onComplete?: () => Promise<void> | void;
};

type RunStatus = "idle" | "running" | "passed" | "failed";

export function ChallengeRunner({
  language,
  starterCode = "",
  testCases = [],
  onComplete,
}: ChallengeRunnerProps) {
  const [code, setCode] = useState(starterCode);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [output, setOutput] = useState<string>(""); // Simple terminal-style output

  const handleRun = async () => {
    setStatus("running");
    setMessage(null);
    setOutput("");

    if (!code.trim()) {
      setStatus("failed");
      setMessage("Add some code before running the challenge.");
      setOutput("> error: no code provided. Please write a solution first.\n");
      return;
    }

    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          testCases,
        }),
      });

      const data = (await res.json()) as {
        stdout?: string;
        stderr?: string;
        passed?: boolean;
      };

      const lines: string[] = [];
      if (data.stdout) lines.push(data.stdout);
      if (data.stderr) lines.push(data.stderr);
      setOutput(lines.join("\n"));

      if (data.passed) {
        setStatus("passed");
        setMessage("All tests passed.");
      } else {
        setStatus("failed");
        setMessage("Some tests failed. Check the terminal output above.");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("run-code error", err);
      setStatus("failed");
      setMessage("Running code failed. Please try again.");
      setOutput("> error: failed to contact runner API.\n");
    }
  };

  const handleMarkComplete = async () => {
    if (status !== "passed") {
      setMessage("Run the challenge and pass all tests before marking complete (stub policy).");
      return;
    }
    try {
      setMarking(true);
      await onComplete?.();
      setMessage("Marked lesson as complete.");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="inline-flex h-2 w-2 rounded-full bg-solana" />
          <span>Language: {language}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRun}
            disabled={status === "running"}
          >
            {status === "running" ? "Running…" : "Run tests (stub)"}
          </Button>
          <Button
            size="sm"
            onClick={handleMarkComplete}
            disabled={marking}
          >
            {marking ? "Marking…" : "Mark complete"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-md border border-border-subtle bg-void/60">
        <CodeEditor
          initialValue={starterCode}
          language={language}
          onChange={setCode}
          className="h-full"
        />
      </div>

      <div className="mt-2 flex min-h-[96px] flex-col rounded-md border border-border-subtle bg-black/80 text-xs font-mono text-text-secondary">
        <div className="flex items-center justify-between border-b border-border-subtle/60 bg-white/5 px-3 py-1.5">
          <span className="uppercase tracking-wide">Terminal</span>
          <span className="text-[10px]">
            {status === "running"
              ? "Running…"
              : status === "passed"
                ? "All tests passed"
                : status === "failed"
                  ? "Tests failed"
                  : "Idle"}
          </span>
        </div>
        <div className="max-h-32 flex-1 overflow-auto px-3 py-2">
          <pre className="whitespace-pre-wrap">
            {output || "> Ready. Click \"Run tests\" to execute your code.\n"}
          </pre>
        </div>
      </div>

      {testCases.length > 0 && (
        <div className="rounded-md border border-border-subtle bg-surface-high/40 p-3 text-xs text-text-secondary">
          <p className="mb-1 font-semibold text-text-primary">Test cases (stub)</p>
          <ul className="space-y-1">
            {testCases.map((tc, i) => (
              <li key={i}>
                <span className="text-text-primary">{tc.name ?? `Case ${i + 1}`}</span>
                {tc.input && (
                  <>
                    {" "}
                    — input: <code className="rounded bg-void/80 px-1">{tc.input}</code>
                  </>
                )}
                {tc.expected && (
                  <>
                    {" "}
                    → expected: <code className="rounded bg-void/80 px-1">{tc.expected}</code>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && (
        <p className="text-xs text-text-secondary">
          {message}
        </p>
      )}
    </div>
  );
}

