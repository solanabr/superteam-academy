/**
 * useCodeExecution — React hook for executing code via the backend API.
 *
 * Wraps POST /api/code/execute with state management for
 * loading, output, test results, and errors.
 *
 * All configuration flows from env vars on the backend;
 * the frontend only checks NEXT_PUBLIC_CODE_EXECUTION_ENABLED.
 */
'use client';

import { useState, useCallback, useRef } from 'react';

/** Output from the execution API */
export interface ExecutionOutput {
    stdout: string;
    stderr: string;
    exitCode: number;
    compilationError: string | null;
}

/** Test result from the execution API */
export interface ExecutionTestResult {
    name: string;
    passed: boolean;
    expected: string;
    actual: string;
    isHidden: boolean;
}

/** Parameters for code execution */
export interface ExecuteParams {
    language: string;
    code: string;
    stdin?: string;
    testCases?: {
        name: string;
        input: string;
        expectedOutput: string;
        isHidden: boolean;
    }[];
}

/** Return type of the hook */
export interface UseCodeExecutionReturn {
    execute: (params: ExecuteParams) => Promise<void>;
    output: ExecutionOutput | null;
    testResults: ExecutionTestResult[];
    isExecuting: boolean;
    error: string | null;
    isEnabled: boolean;
    clear: () => void;
}

export function useCodeExecution(): UseCodeExecutionReturn {
    const [output, setOutput] = useState<ExecutionOutput | null>(null);
    const [testResults, setTestResults] = useState<ExecutionTestResult[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const isEnabled = process.env.NEXT_PUBLIC_CODE_EXECUTION_ENABLED === 'true';

    const execute = useCallback(async (params: ExecuteParams) => {
        // Abort any in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsExecuting(true);
        setError(null);
        setOutput(null);
        setTestResults([]);

        try {
            const response = await fetch('/api/code/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: params.language,
                    code: params.code,
                    stdin: params.stdin,
                    testCases: params.testCases,
                }),
                signal: controller.signal,
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || `Execution failed (${response.status})`);
                return;
            }

            if (data.output) {
                setOutput(data.output);
            }

            if (data.testResults) {
                setTestResults(data.testResults);
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return; // Request was cancelled, ignore
            }
            setError(err instanceof Error ? err.message : 'Execution failed');
        } finally {
            if (!controller.signal.aborted) {
                setIsExecuting(false);
            }
        }
    }, []);

    const clear = useCallback(() => {
        abortRef.current?.abort();
        setOutput(null);
        setTestResults([]);
        setError(null);
        setIsExecuting(false);
    }, []);

    return { execute, output, testResults, isExecuting, error, isEnabled, clear };
}
