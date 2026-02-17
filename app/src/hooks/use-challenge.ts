"use client";

import { useState, useCallback } from "react";
import type { ChallengeData, TestCase } from "@/types/course";

interface TestResult {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function useChallenge(challenge: ChallengeData | undefined) {
  const [code, setCode] = useState(challenge?.starterCode ?? "");
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  const runCode = useCallback(async () => {
    if (!challenge) return;
    setRunning(true);
    setResults([]);

    await new Promise((r) => setTimeout(r, 200));

    const testResults = challenge.testCases.map((tc: TestCase) => {
      try {
        const fn = new Function("input", code + "\nreturn solution(input)");
        const actual = String(fn(tc.input));
        return {
          label: tc.label,
          passed: actual.trim() === tc.expectedOutput.trim(),
          expected: tc.expectedOutput,
          actual: actual.trim(),
        };
      } catch (e) {
        return {
          label: tc.label,
          passed: false,
          expected: tc.expectedOutput,
          actual: e instanceof Error ? e.message : "Error",
        };
      }
    });

    setResults(testResults);
    setAllPassed(testResults.every((r) => r.passed));
    setRunning(false);
  }, [code, challenge]);

  const resetCode = useCallback(() => {
    setCode(challenge?.starterCode ?? "");
    setResults([]);
    setAllPassed(false);
  }, [challenge]);

  return {
    code,
    setCode,
    results,
    running,
    allPassed,
    runCode,
    resetCode,
    passedCount: results.filter((r) => r.passed).length,
    totalTests: results.length,
  };
}
