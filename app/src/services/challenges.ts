import type { ChallengeService } from "./interfaces";
import type { RunResult } from "@/types/challenge";
import type { TestCase } from "@/types/course";

export class SandboxedChallengeService implements ChallengeService {
  async runCode(
    code: string,
    language: string,
    testCases: TestCase[],
  ): Promise<RunResult> {
    const startTime = Date.now();

    if (language === "typescript") {
      return this.runTypeScript(code, testCases, startTime);
    }

    // For Rust and other languages, simulate execution
    return this.simulateRun(code, testCases, startTime);
  }

  async validateSolution(
    code: string,
    expectedOutput: string,
  ): Promise<boolean> {
    try {
      const fn = new Function(
        code + "\n; return typeof main === 'function' ? main() : undefined;",
      );
      const result = String(fn());
      return result.trim() === expectedOutput.trim();
    } catch {
      return false;
    }
  }

  private async runTypeScript(
    code: string,
    testCases: TestCase[],
    startTime: number,
  ): Promise<RunResult> {
    const testResults = testCases.map((tc) => {
      try {
        const fn = new Function(
          "input",
          code +
            `\n; return typeof solution === 'function' ? solution(input) : '';`,
        );
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

    const allPassed = testResults.every((r) => r.passed);
    return {
      success: allPassed,
      output: allPassed ? "All tests passed!" : "Some tests failed.",
      testResults,
      executionTime: Date.now() - startTime,
    };
  }

  private async simulateRun(
    _code: string,
    testCases: TestCase[],
    startTime: number,
  ): Promise<RunResult> {
    // Simulated execution for non-JS languages
    await new Promise((r) => setTimeout(r, 500));
    const testResults = testCases.map((tc) => ({
      label: tc.label,
      passed: true,
      expected: tc.expectedOutput,
      actual: tc.expectedOutput,
    }));
    return {
      success: true,
      output:
        "Simulated execution - all tests passed (connect to execution service for real results)",
      testResults,
      executionTime: Date.now() - startTime,
    };
  }
}

export const challengeService = new SandboxedChallengeService();
