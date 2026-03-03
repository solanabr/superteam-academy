/**
 * Test Runner Service
 * Validates code output against test cases
 */

import { CodeExecutionService, ExecutionOutput } from './code-execution.service'

export interface TestCase {
  input?: string
  expectedOutput: string
  description?: string
  hidden?: boolean
}

export interface TestResult {
  testCase: TestCase
  passed: boolean
  actual: string
  expected: string
  error?: string
}

export interface TestRunnerResult {
  passed: boolean
  totalTests: number
  passedTests: number
  failedTests: number
  executionTime: number
  results: TestResult[]
  execution: ExecutionOutput
}

/**
 * Test Runner Service
 * Executes code and validates against test cases
 */
export class TestRunnerService {
  /**
   * Parse test output by evaluating code and capturing function returns
   * Supports both:
   * - Functions that return values: `function add(a, b) { return a + b; }`
   * - Code that logs output: `console.log(result)`
   */
  private static extractFunctionAndArgs(
    code: string,
    testInput?: string
  ): { functionName?: string; args?: unknown[] } {
    // Extract function name and arguments from test input
    // Format: "functionName(arg1, arg2)" or just use first defined function
    const result: { functionName?: string; args?: unknown[] } = {}

    if (testInput) {
      const match = testInput.match(/(\w+)\((.*)\)/)
      if (match) {
        result.functionName = match[1]
        const argsStr = match[2]
        try {
          // Parse arguments (supports JSON-like syntax)
          result.args = argsStr
            .split(',')
            .map((arg) => {
              const trimmed = arg.trim()
              // Try to parse as JSON first
              if (trimmed.startsWith('"') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
                return JSON.parse(trimmed)
              }
              // Try to parse as number
              const num = Number(trimmed)
              if (!isNaN(num)) return num
              // Try to parse as boolean
              if (trimmed === 'true') return true
              if (trimmed === 'false') return false
              // Return as string
              return trimmed
            })
        } catch (e) {
          // If parsing fails, treat as string arguments
          result.args = [argsStr]
        }
      }
    }

    return result
  }

  /**
   * Run code against test cases
   */
  static async runTests(
    code: string,
    testCases: TestCase[],
    language: 'javascript' | 'typescript' = 'javascript'
  ): Promise<TestRunnerResult> {
    // First, execute the code to check for syntax errors
    const execution = await CodeExecutionService.executeCode(code, language)

    const startTime = Date.now()
    const results: TestResult[] = []
    let passedCount = 0

    for (const testCase of testCases) {
      try {
        // Try to extract function name and call it with test inputs
        const { functionName, args } = this.extractFunctionAndArgs(code, testCase.input)

        let actual = ''
        let error: string | undefined

        if (functionName && args) {
          // Create a scope with the code, then call the function
          try {
            const scope: Record<string, unknown> = {}
            const wrappedCode = `
              (function() {
                ${code}
                return typeof ${functionName} === 'function' ? ${functionName}(...${JSON.stringify(args)}) : undefined
              })()
            `
            const fn = new Function('return ' + wrappedCode)
            actual = String(fn())
          } catch (e) {
            error = e instanceof Error ? e.message : String(e)
            actual = ''
          }
        } else {
          // Use stdout from execution
          actual = execution.stdout.trim()
        }

        const expected = testCase.expectedOutput.trim()
        const passed = actual === expected

        if (passed) {
          passedCount++
        }

        results.push({
          testCase,
          passed,
          actual,
          expected,
          error,
        })
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e)
        results.push({
          testCase,
          passed: false,
          actual: '',
          expected: testCase.expectedOutput,
          error,
        })
      }
    }

    const totalTime = Date.now() - startTime

    return {
      passed: passedCount === testCases.length && execution.success,
      totalTests: testCases.length,
      passedTests: passedCount,
      failedTests: testCases.length - passedCount,
      executionTime: totalTime + execution.executionTime,
      results,
      execution,
    }
  }
}
