export interface TestResult {
  passed: boolean;
  message: string;
}

export interface ExecutionResult {
  logs: string[];
  error?: string;
  tests?: TestResult[];
}

export async function runCode(code: string, testCode?: string): Promise<ExecutionResult> {
  const logs: string[] = [];
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  try {
    // Capture logs
    console.log = (...args) => {
      logs.push(args.map(arg => String(arg)).join(' '));
    };
    console.error = (...args) => {
      logs.push(`Error: ${args.map(arg => String(arg)).join(' ')}`);
    };

    // Transpile TS -> JS
    const ts = (await import('typescript')).default;
    const userJs = ts.transpile(code, { 
        target: ts.ScriptTarget.ES2020, 
        module: ts.ModuleKind.CommonJS 
    });

    // Simple assertion helper
    const testResults: TestResult[] = [];
    const expect = (actual: any) => ({
      toBe: (expected: any) => {
        if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      },
      toBeTruthy: () => {
        if (!actual) throw new Error(`Expected truthy but got ${actual}`);
      },
      toContain: (item: any) => {
        if (!actual || !actual.includes(item)) throw new Error(`Expected "${actual}" to contain "${item}"`);
      }
    });

    if (testCode) {
      // Combine user code + test code into a single scope so tests can call user functions
      const testJs = ts.transpile(testCode, { target: ts.ScriptTarget.ES2020 });
      const combined = userJs + '\n' + testJs;

      try {
        // eslint-disable-next-line no-new-func
        new Function('console', 'expect', 'require', 'logs', combined)(console, expect, () => ({}), logs);
        testResults.push({ passed: true, message: "All tests passed ✓" });
      } catch (e: any) {
        testResults.push({ passed: false, message: e.message });
      }
    } else {
      // No tests — just run code
      // eslint-disable-next-line no-new-func
      new Function('console', 'require', userJs)(console, () => ({}));
    }

    return { logs, tests: testResults.length > 0 ? testResults : undefined };
  } catch (err: any) {
    return { logs, error: err.message };
  } finally {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  }
}
