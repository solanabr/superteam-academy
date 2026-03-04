import type { TestCase } from "@/lib/data/types";

export type ClientTestResult = {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
  timedOut: boolean;
  exitCode: number | null;
};

export type RunTestsResult = {
  passed: boolean;
  results: ClientTestResult[];
};

/**
 * Runs TypeScript challenge code in the browser. No backend/Piston.
 * Rust is not supported; call runClientTests only when language === "typescript".
 */
export function runClientTests(
  code: string,
  testCases: TestCase[],
): RunTestsResult {
  const results: ClientTestResult[] = [];
  const base = { timedOut: false, exitCode: null };

  try {
    const fnMatch = code.match(
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*(?::\s*[\w<>,\s\[\]]+)?\s*\{/,
    );
    const fnName = fnMatch?.[1] ?? "solution";

    const wrappedCode = `
      ${code}
      if (typeof ${fnName} !== 'function') {
        throw new Error('Expected a function named ${fnName}');
      }
      return ${fnName}();
    `;

    const fn = new Function(wrappedCode);
    const actualRaw = String(fn()).trim();
    const actualNorm = actualRaw.toLowerCase();

    for (const tc of testCases) {
      const expected = tc.expectedOutput.trim();
      const expectedNorm = expected.toLowerCase();
      const passed =
        actualNorm.includes(expectedNorm) || expectedNorm.includes(actualNorm);
      results.push({
        ...base,
        label: tc.label,
        passed,
        expected,
        actual: actualRaw,
      });
    }
  } catch (e) {
    const actual = e instanceof Error ? e.message : String(e);
    for (const tc of testCases) {
      results.push({
        ...base,
        label: tc.label,
        passed: false,
        expected: tc.expectedOutput.trim(),
        actual,
      });
    }
  }

  const passed = results.length > 0 && results.every((r) => r.passed);
  return { passed, results };
}
