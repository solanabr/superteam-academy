import { useState, useCallback } from "react";

interface TestCase {
  description?: string;
  expected: string;
}

interface TestResult {
  passed: boolean;
  message: string;
}

export function useLessonTests(
  lessonTestCases: TestCase[] | undefined,
  currentIndex: number,
  t: (key: string) => string
) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

  const runTests = useCallback(async (code: string) => {
    setIsRunning(true);
    setTestResults([]);
    setConsoleOutput([]);
    
    const output: string[] = [];
    output.push(`> Running tests for lesson ${currentIndex + 1}...`);
    output.push("");

    await new Promise((resolve) => setTimeout(resolve, 500));

    const results: TestResult[] = [];

    if (lessonTestCases && lessonTestCases.length > 0) {
      for (const testCase of lessonTestCases) {
        try {
          let result: string;
          const logs: string[] = [];
          const mockConsole = {
            log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
            error: (...args: unknown[]) => logs.push("ERROR: " + args.map(String).join(" ")),
          };
          
          try {
            const fn = new Function("console", code);
            fn(mockConsole);
            result = logs[logs.length - 1] || "";
          } catch (e) {
            result = "ERROR: " + String(e);
          }

          const passed = testCase.expected === "PASS" 
            ? result.includes("PASS") || result.includes("true")
            : result.includes(testCase.expected) || result === testCase.expected;

          results.push({
            passed,
            message: testCase.description || `Test: ${testCase.expected}`,
          });
          
          output.push(passed ? "✓" : "✗", `  ${testCase.description || testCase.expected}`);
          if (logs.length > 0) {
            output.push(`    Output: ${logs.join(", ")}`);
          }
          output.push("");
        } catch {
          results.push({
            passed: false,
            message: testCase.description || t("testFailed"),
          });
          output.push("✗", `  ${testCase.description || t("testFailed")}`);
          output.push("");
        }
      }
    } else {
      results.push({
        passed: true,
        message: t("noTests"),
      });
      output.push("✓ No tests defined for this lesson");
      output.push("");
    }

    const passedCount = results.filter(r => r.passed).length;
    output.push(`---`);
    output.push(`${passedCount}/${results.length} tests passed`);
    
    setConsoleOutput(output);
    setTestResults(results);
    setIsRunning(false);

    return results;
  }, [lessonTestCases, currentIndex, t]);

  return {
    isRunning,
    setIsRunning,
    testResults,
    consoleOutput,
    runTests,
  };
}
