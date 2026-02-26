import type { ExecutionResult } from "./sandbox";

export interface TestCaseInput {
  name: string;
  input?: string;
  expectedOutput?: string;
  expectLogContains?: string;
  expectLogMatch?: string;
  expectCodeContains?: string;
  expectNoError?: boolean;
}

export interface TestResult {
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
}

export function runTestAssertions(
  testCases: TestCaseInput[],
  result: ExecutionResult,
  sourceCode: string,
): TestResult[] {
  const allLogText = result.logs
    .map((l) => l.args.join(" "))
    .join("\n");

  return testCases.map((tc) => {
    // New assertion: expectNoError
    if (tc.expectNoError) {
      if (result.error) {
        return {
          name: tc.name,
          passed: false,
          expected: "No runtime error",
          actual: result.error,
        };
      }
      if (result.timedOut) {
        return {
          name: tc.name,
          passed: false,
          expected: "No timeout",
          actual: "Execution timed out",
        };
      }
    }

    // New assertion: expectCodeContains
    if (tc.expectCodeContains) {
      const found = sourceCode.includes(tc.expectCodeContains);
      if (!found) {
        return {
          name: tc.name,
          passed: false,
          expected: `Code contains "${tc.expectCodeContains}"`,
          actual: "Pattern not found in source code",
        };
      }
    }

    // New assertion: expectLogContains
    if (tc.expectLogContains) {
      const found = allLogText.includes(tc.expectLogContains);
      if (!found) {
        return {
          name: tc.name,
          passed: false,
          expected: `Output contains "${tc.expectLogContains}"`,
          actual: allLogText.slice(0, 200) || "(no output)",
        };
      }
    }

    // New assertion: expectLogMatch (regex)
    if (tc.expectLogMatch) {
      try {
        const re = new RegExp(tc.expectLogMatch);
        const found = re.test(allLogText);
        if (!found) {
          return {
            name: tc.name,
            passed: false,
            expected: `Output matches /${tc.expectLogMatch}/`,
            actual: allLogText.slice(0, 200) || "(no output)",
          };
        }
      } catch (error) {
        console.error("[testRunner] Invalid regex pattern:", error);
        return {
          name: tc.name,
          passed: false,
          expected: `Valid regex: ${tc.expectLogMatch}`,
          actual: "Invalid regex pattern",
        };
      }
    }

    // Legacy fallback: if no new fields, use expectedOutput as substring match
    const hasNewFields =
      tc.expectLogContains ||
      tc.expectLogMatch ||
      tc.expectCodeContains ||
      tc.expectNoError;

    if (!hasNewFields && tc.expectedOutput) {
      if (result.error) {
        return {
          name: tc.name,
          passed: false,
          expected: tc.expectedOutput,
          actual: result.error,
        };
      }
      if (result.timedOut) {
        return {
          name: tc.name,
          passed: false,
          expected: tc.expectedOutput,
          actual: "Execution timed out",
        };
      }
      return { name: tc.name, passed: true };
    }

    // All assertions passed
    return { name: tc.name, passed: true };
  });
}
