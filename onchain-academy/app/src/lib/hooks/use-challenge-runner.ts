"use client";

import { useState, useCallback } from "react";
import {
  executeJS,
  formatLogs,
  initTranspiler,
  transpileAndProtect,
  runTestAssertions,
} from "@/lib/code-executor";
import type { TestCaseInput, TestResult } from "@/lib/code-executor";
import type { ExecutionResult } from "@/lib/code-executor";

interface RustApiResponse {
  stdout?: string;
  stderr?: string;
  error?: string;
  success?: boolean;
}

interface FinalizeApiResponse {
  xpAwarded?: number;
  credentialIssued?: boolean;
  credentialAsset?: string;
  error?: string;
}

export function useChallengeRunner() {
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const resetOutput = useCallback(() => {
    setOutput("");
    setTestResults([]);
  }, []);

  const executeRust = useCallback(
    async (
      code: string,
      testCases: TestCaseInput[],
    ): Promise<{ results: TestResult[]; allPassed: boolean }> => {
      const res = await fetch("/api/execute-rust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data: RustApiResponse = await res.json();
      if (data.error) {
        setOutput(`Error: ${data.error}`);
        return { results: [], allPassed: false };
      }
      const rustOutput = data.stderr
        ? `${data.stderr}\n${data.stdout}`.trim()
        : data.stdout || "(no output)";
      setOutput(rustOutput);

      const execResult: ExecutionResult = {
        logs: [{ type: "log" as const, args: [data.stdout ?? ""] }],
        error: data.success ? null : (data.stderr ?? "Compilation failed"),
        timedOut: false,
      };
      const results = runTestAssertions(testCases, execResult, code);
      setTestResults(results);
      return { results, allPassed: results.every((r) => r.passed) };
    },
    [],
  );

  const executeTypeScript = useCallback(
    async (
      code: string,
      testCases: TestCaseInput[],
    ): Promise<{ results: TestResult[]; allPassed: boolean }> => {
      await initTranspiler();
      const transpiled = await transpileAndProtect(code);
      if (transpiled.error) {
        setOutput(`Compile error:\n${transpiled.error}`);
        return { results: [], allPassed: false };
      }
      const execResult = await executeJS(transpiled.code);
      setOutput(formatLogs(execResult));

      const results = runTestAssertions(testCases, execResult, code);
      setTestResults(results);
      return { results, allPassed: results.every((r) => r.passed) };
    },
    [],
  );

  const runChallenge = useCallback(
    async (
      code: string,
      language: string,
      testCases: TestCaseInput[],
    ): Promise<{ allPassed: boolean }> => {
      setIsRunning(true);
      setOutput("");
      setTestResults([]);

      try {
        const result =
          language === "rust"
            ? await executeRust(code, testCases)
            : await executeTypeScript(code, testCases);
        return { allPassed: result.allPassed };
      } catch (err) {
        setOutput(
          `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
        );
        return { allPassed: false };
      } finally {
        setIsRunning(false);
      }
    },
    [executeRust, executeTypeScript],
  );

  const completeLesson = useCallback(
    async (walletAddress: string, courseId: string, lessonIndex: number): Promise<boolean> => {
      try {
        const res = await fetch("/api/complete-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            learner: walletAddress,
            courseId,
            lessonIndex,
          }),
        });
        return res.ok;
      } catch (e) {
        console.error("complete-lesson API error:", e);
        return false;
      }
    },
    [],
  );

  const finalizeCourse = useCallback(
    async (
      slug: string,
      walletAddress: string,
    ): Promise<{ xpAwarded: number; credentialIssued: boolean; credentialAsset?: string }> => {
      const res = await fetch(`/api/courses/${slug}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      const data: FinalizeApiResponse = await res.json();
      if (data.error) throw new Error(data.error);
      return { xpAwarded: data.xpAwarded ?? 0, credentialIssued: data.credentialIssued ?? false, credentialAsset: data.credentialAsset };
    },
    [],
  );

  return {
    output,
    testResults,
    isRunning,
    resetOutput,
    runChallenge,
    completeLesson,
    finalizeCourse,
  };
}
