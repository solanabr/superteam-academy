"use client";

import { useState } from "react";
import { CodeEditor, SupportedLanguage } from "./CodeEditor";
import { Button } from "@/components/ui/button";
import { TerminalOutput } from "./TerminalOutput";

type ChallengeRunnerProps = {
  language: SupportedLanguage;
  starterCode?: string;
  testCases?: Array<{ name?: string; input?: string; expected?: string }>;
  onComplete?: () => Promise<void> | void;
};

type RunStatus = "idle" | "running" | "passed" | "failed";

type TestResult = {
  name: string;
  passed: boolean;
  input?: string;
  expected?: string;
  actual?: string;
  error?: string;
};

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
  const [output, setOutput] = useState<string>("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [executionStats, setExecutionStats] = useState<{
    memory?: string;
    cpuTime?: string;
  }>({});

  const handleRun = async () => {
    setStatus("running");
    setMessage(null);
    setOutput("");
    setTestResults([]);
    setDailyLimitReached(false);
    setExecutionStats({});

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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setStatus("failed");
        setMessage("Failed to execute code. Please check your code and try again.");
        setOutput(`> error: ${errorData.stderr || errorData.error || "API request failed"}\n`);
        return;
      }

      const data = (await res.json()) as {
        stdout?: string;
        stderr?: string;
        passed?: boolean;
        testResults?: TestResult[];
        memory?: string;
        cpuTime?: string;
        dailyLimitReached?: boolean;
      };

      setDailyLimitReached(Boolean(data.dailyLimitReached));

      // Combine stdout and stderr for display (stderr contains errors)
      const lines: string[] = [];
      if (data.stdout) lines.push(data.stdout);
      if (data.stderr) lines.push(data.stderr);
      // If both are empty but execution failed, show a message
      const combinedOutput = lines.join("\n");
      setOutput(combinedOutput || (data.passed ? "> No output\n" : "> Execution failed with no output\n"));

      // Set test results if available
      if (data.testResults) {
        setTestResults(data.testResults);
      }

      // Set execution stats
      if (data.memory || data.cpuTime) {
        setExecutionStats({
          memory: data.memory,
          cpuTime: data.cpuTime,
        });
      }

      if (data.passed) {
        setStatus("passed");
        setMessage("All tests passed! ✓");
      } else {
        setStatus("failed");
        if (data.testResults && data.testResults.length > 0) {
          const failedCount = data.testResults.filter((t) => !t.passed).length;
          setMessage(`${failedCount} of ${data.testResults.length} test(s) failed.`);
        } else {
          setMessage("Code execution failed. Check the terminal output above.");
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("run-code error", err);
      setStatus("failed");
      setMessage("Running code failed. Please try again.");
      setOutput(`> error: ${err instanceof Error ? err.message : "Failed to contact runner API"}\n`);
    }
  };

  const handleMarkComplete = async () => {
    if (status !== "passed") {
      setMessage("Run the challenge and pass all tests before marking complete.");
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
            {status === "running" ? "Running…" : "Run tests"}
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

      <TerminalOutput
        output={output}
        status={status === "passed" ? "success" : status === "failed" ? "error" : status === "running" ? "running" : "idle"}
        executionStats={executionStats}
        dailyLimitReached={dailyLimitReached}
        onClear={() => {
          setOutput("");
          setStatus("idle");
          setTestResults([]);
          setDailyLimitReached(false);
          setExecutionStats({});
        }}
      />

      {testCases.length > 0 && (
        <div className="rounded-md border border-border-subtle bg-surface-high/40 p-3 text-xs text-text-secondary">
          <p className="mb-2 font-semibold text-text-primary">
            Test Cases
            {testResults.length > 0 && (
              <span className="ml-2 text-xs font-normal">
                ({testResults.filter((t) => t.passed).length}/{testResults.length} passed)
              </span>
            )}
          </p>
          <ul className="space-y-2">
            {testCases.map((tc, i) => {
              const result = testResults[i];
              const isPassed = result?.passed;
              const showResult = result !== undefined;

              return (
                <li
                  key={i}
                  className={`rounded border p-2 ${
                    showResult
                      ? isPassed
                        ? "border-solana/30 bg-solana/5"
                        : "border-rust/30 bg-rust/5"
                      : "border-border-subtle"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {showResult && (
                      <span className={`text-sm ${isPassed ? "text-solana" : "text-rust"}`}>
                        {isPassed ? "✓" : "✗"}
                      </span>
                    )}
                    <div className="flex-1">
                      <span className="font-semibold text-text-primary">
                        {tc.name ?? `Test ${i + 1}`}
                      </span>
                      {tc.input && (
                        <div className="mt-1">
                          <span className="text-text-secondary">Input: </span>
                          <code className="rounded bg-void/80 px-1 text-text-primary">
                            {tc.input}
                          </code>
                        </div>
                      )}
                      {tc.expected && (
                        <div className="mt-1">
                          <span className="text-text-secondary">Expected: </span>
                          <code className="rounded bg-void/80 px-1 text-text-primary">
                            {tc.expected}
                          </code>
                        </div>
                      )}
                      {result?.actual !== undefined && (
                        <div className="mt-1">
                          <span className="text-text-secondary">Got: </span>
                          <code className="rounded bg-void/80 px-1 text-text-primary">
                            {result.actual}
                          </code>
                        </div>
                      )}
                      {result?.error && (
                        <div className="mt-1 text-rust">
                          <span className="font-semibold">Error: </span>
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
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

