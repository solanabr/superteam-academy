import type { TestCase, TestResult } from './SolanaCodeLesson'

/**
 * Checks stdout against expected test-case outputs.
 * Returns a structured result with per-case pass/fail details.
 */
export function runTestsAgainstOutput(stdout: string, testCases: TestCase[]): TestResult {
  const outputLines = stdout.trim().split('\n').map(l => l.trim())
  const results = testCases.map((tc, idx) => {
    const actual = outputLines[idx] ?? ''
    let passed: boolean

    if (tc.validator) {
      passed = tc.validator(stdout)
    } else {
      passed = actual.includes(tc.expectedOutput) || stdout.includes(tc.expectedOutput)
    }

    return {
      description: tc.description,
      passed,
      expected: tc.expectedOutput,
      actual,
      hidden: tc.hidden,
    }
  })

  const passedCount = results.filter(r => r.passed).length
  return {
    passed: passedCount === testCases.length,
    passedCount,
    totalCount: testCases.length,
    results,
  }
}
