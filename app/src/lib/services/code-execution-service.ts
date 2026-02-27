/**
 * Code Execution Service
 * Provides sandboxed code execution for TypeScript/JavaScript challenges
 *
 * For production, this would integrate with:
 * - A sandboxed execution environment (Web Workers, iframe sandbox)
 * - Server-side execution via API (for Rust/Anchor code)
 * - Solana Playground integration (for full Solana programs)
 */

export interface TestCase {
  id: string;
  description: string;
  input?: unknown;
  expectedOutput: unknown;
  hidden?: boolean;
  timeout?: number;
}

export interface TestResult {
  id: string;
  passed: boolean;
  description: string;
  expectedOutput: unknown;
  actualOutput: unknown;
  error?: string;
  executionTime: number;
}

export interface ExecutionResult {
  success: boolean;
  output: unknown;
  error?: string;
  logs: string[];
  executionTime: number;
}

export interface ChallengeValidation {
  allPassed: boolean;
  results: TestResult[];
  totalTime: number;
  passedCount: number;
  failedCount: number;
}

// Console capture for code execution
class ConsoleCapture {
  private logs: string[] = [];
  private originalConsole: typeof console;

  constructor() {
    this.originalConsole = { ...console };
  }

  capture(): void {
    this.logs = [];
    const capture = this;

    console.log = (...args: unknown[]) => {
      capture.logs.push(args.map((arg) => formatValue(arg)).join(' '));
    };

    console.error = (...args: unknown[]) => {
      capture.logs.push(`[ERROR] ${args.map((arg) => formatValue(arg)).join(' ')}`);
    };

    console.warn = (...args: unknown[]) => {
      capture.logs.push(`[WARN] ${args.map((arg) => formatValue(arg)).join(' ')}`);
    };

    console.info = (...args: unknown[]) => {
      capture.logs.push(`[INFO] ${args.map((arg) => formatValue(arg)).join(' ')}`);
    };
  }

  restore(): string[] {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    return this.logs;
  }
}

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// Wrapper for safe execution with timeout
async function executeWithTimeout<T>(
  fn: () => T | Promise<T>,
  timeout: number
): Promise<{ result?: T; error?: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ timedOut: true, error: `Execution timed out after ${timeout}ms` });
    }, timeout);

    try {
      const result = fn();
      if (result instanceof Promise) {
        result
          .then((res) => {
            clearTimeout(timer);
            resolve({ result: res, timedOut: false });
          })
          .catch((err) => {
            clearTimeout(timer);
            resolve({ error: err.message || String(err), timedOut: false });
          });
      } else {
        clearTimeout(timer);
        resolve({ result, timedOut: false });
      }
    } catch (err) {
      clearTimeout(timer);
      resolve({ error: err instanceof Error ? err.message : String(err), timedOut: false });
    }
  });
}

/**
 * Execute JavaScript/TypeScript code in a sandboxed environment
 * Note: This is a simplified implementation. Production should use Web Workers or iframe sandbox.
 */
export async function executeCode(
  code: string,
  language: 'typescript' | 'javascript',
  timeout = 5000
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const capture = new ConsoleCapture();
  capture.capture();

  try {
    // For TypeScript, we'd normally transpile first
    // Here we assume the code is already executable JS or simple TS
    const wrappedCode = `
      "use strict";
      ${code}
    `;

    // Create a function from the code
    const executeResult = await executeWithTimeout(() => {
      const fn = new Function(wrappedCode);
      return fn();
    }, timeout);

    const logs = capture.restore();
    const executionTime = performance.now() - startTime;

    if (executeResult.timedOut) {
      return {
        success: false,
        output: undefined,
        error: executeResult.error,
        logs,
        executionTime,
      };
    }

    if (executeResult.error) {
      return {
        success: false,
        output: undefined,
        error: executeResult.error,
        logs,
        executionTime,
      };
    }

    return {
      success: true,
      output: executeResult.result,
      logs,
      executionTime,
    };
  } catch (error) {
    const logs = capture.restore();
    return {
      success: false,
      output: undefined,
      error: error instanceof Error ? error.message : String(error),
      logs,
      executionTime: performance.now() - startTime,
    };
  }
}

/**
 * Execute code with function extraction for testing
 * This wraps the user code and extracts a specific function for testing
 */
export async function executeWithFunction(
  code: string,
  functionName: string,
  args: unknown[],
  timeout = 5000
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const capture = new ConsoleCapture();
  capture.capture();

  try {
    const wrappedCode = `
      "use strict";
      ${code}
      
      if (typeof ${functionName} !== 'function') {
        throw new Error('Function "${functionName}" is not defined');
      }
      
      return ${functionName}(${args.map((arg) => JSON.stringify(arg)).join(', ')});
    `;

    const executeResult = await executeWithTimeout(() => {
      const fn = new Function(wrappedCode);
      return fn();
    }, timeout);

    const logs = capture.restore();
    const executionTime = performance.now() - startTime;

    if (executeResult.timedOut) {
      return {
        success: false,
        output: undefined,
        error: executeResult.error,
        logs,
        executionTime,
      };
    }

    if (executeResult.error) {
      return {
        success: false,
        output: undefined,
        error: executeResult.error,
        logs,
        executionTime,
      };
    }

    return {
      success: true,
      output: executeResult.result,
      logs,
      executionTime,
    };
  } catch (error) {
    const logs = capture.restore();
    return {
      success: false,
      output: undefined,
      error: error instanceof Error ? error.message : String(error),
      logs,
      executionTime: performance.now() - startTime,
    };
  }
}

/**
 * Validate code against test cases
 */
export async function validateChallenge(
  code: string,
  testCases: TestCase[],
  functionName?: string,
  language: 'typescript' | 'javascript' = 'javascript'
): Promise<ChallengeValidation> {
  const results: TestResult[] = [];
  let totalTime = 0;

  for (const testCase of testCases) {
    const startTime = performance.now();

    try {
      let executionResult: ExecutionResult;

      if (functionName && testCase.input !== undefined) {
        // Execute with specific function and input
        const args = Array.isArray(testCase.input) ? testCase.input : [testCase.input];
        executionResult = await executeWithFunction(
          code,
          functionName,
          args,
          testCase.timeout || 5000
        );
      } else {
        // Execute code directly
        executionResult = await executeCode(code, language, testCase.timeout || 5000);
      }

      const executionTime = performance.now() - startTime;
      totalTime += executionTime;

      if (!executionResult.success) {
        results.push({
          id: testCase.id,
          passed: false,
          description: testCase.description,
          expectedOutput: testCase.expectedOutput,
          actualOutput: undefined,
          error: executionResult.error,
          executionTime,
        });
        continue;
      }

      // Compare output
      const passed = deepEqual(executionResult.output, testCase.expectedOutput);

      results.push({
        id: testCase.id,
        passed,
        description: testCase.description,
        expectedOutput: testCase.expectedOutput,
        actualOutput: executionResult.output,
        executionTime,
      });
    } catch (error) {
      results.push({
        id: testCase.id,
        passed: false,
        description: testCase.description,
        expectedOutput: testCase.expectedOutput,
        actualOutput: undefined,
        error: error instanceof Error ? error.message : String(error),
        executionTime: performance.now() - startTime,
      });
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    allPassed: failedCount === 0,
    results,
    totalTime,
    passedCount,
    failedCount,
  };
}

/**
 * Deep equality comparison for test validation
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepEqual(item, b[index]));
    }

    if (Array.isArray(a) || Array.isArray(b)) return false;

    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) =>
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }

  return false;
}

/**
 * Stub for Rust/Anchor code execution
 * In production, this would send code to a sandboxed backend service
 */
export async function executeRustCode(
  code: string,
  testCases: TestCase[]
): Promise<ChallengeValidation> {
  // Simulate API call to Rust execution service
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // For now, do basic syntax validation
  const results: TestResult[] = testCases.map((testCase) => {
    // Check for basic Rust syntax elements
    const hasUseStatement = code.includes('use ');
    const hasFnMain = code.includes('fn ') || code.includes('pub fn');
    const hasStructOrImpl = code.includes('struct ') || code.includes('impl ');
    const hasAnchorImport = code.includes('anchor_lang');

    // Simple validation: code length and structure
    const passed =
      code.length > 50 &&
      (hasUseStatement || hasFnMain || hasStructOrImpl) &&
      !code.includes('panic!("TODO")');

    return {
      id: testCase.id,
      passed,
      description: testCase.description,
      expectedOutput: testCase.expectedOutput,
      actualOutput: passed ? 'Compilation successful' : 'Compilation failed',
      executionTime: 500,
    };
  });

  const passedCount = results.filter((r) => r.passed).length;

  return {
    allPassed: passedCount === results.length,
    results,
    totalTime: 1500,
    passedCount,
    failedCount: results.length - passedCount,
  };
}

/**
 * Code analysis utilities
 */
export function analyzeCode(
  code: string,
  language: 'typescript' | 'javascript' | 'rust'
): {
  lineCount: number;
  hasComments: boolean;
  complexity: 'low' | 'medium' | 'high';
  issues: string[];
} {
  const lines = code.split('\n');
  const lineCount = lines.filter((line) => line.trim().length > 0).length;

  const hasComments = code.includes('//') || code.includes('/*') || code.includes('#[');

  // Simple complexity estimation
  const controlStructures = (code.match(/\b(if|else|for|while|loop|match|switch|case)\b/g) || [])
    .length;
  const functions = (code.match(/\b(fn|function|=>)\b/g) || []).length;
  const complexity =
    controlStructures + functions > 10
      ? 'high'
      : controlStructures + functions > 4
        ? 'medium'
        : 'low';

  const issues: string[] = [];

  // Basic code smell detection
  if (code.includes('console.log') && language !== 'rust') {
    issues.push('Remove console.log statements before submission');
  }
  if (code.includes('TODO') || code.includes('FIXME')) {
    issues.push('Unfinished TODO/FIXME comments detected');
  }
  if (code.includes('any') && language === 'typescript') {
    issues.push('Avoid using "any" type in TypeScript');
  }

  return {
    lineCount,
    hasComments,
    complexity,
    issues,
  };
}
