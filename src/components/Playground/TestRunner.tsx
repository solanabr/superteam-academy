"use client";

import { useRef, useEffect, useCallback } from "react";

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface RunResult {
  passed: boolean;
  results: TestResult[];
  error?: string;
}

const TIMEOUT_MS = 5000;

/**
 * Manages the Web Worker lifecycle.
 * Creates a fresh worker per run, enforces a hard 5 s timeout,
 * and terminates on unmount to avoid memory leaks.
 */
export function useTestRunner() {
  const workerRef = useRef<Worker | null>(null);

  // Terminate worker when component unmounts.
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const runTests = useCallback(
    (studentCode: string, testCode: string): Promise<RunResult> =>
      new Promise((resolve) => {
        // Kill any previous run before starting a new one.
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }

        const worker = new Worker("/test-runner-worker.js");
        workerRef.current = worker;

        const timeout = setTimeout(() => {
          worker.terminate();
          workerRef.current = null;
          resolve({
            passed: false,
            results: [
              {
                name: "Timeout",
                passed: false,
                error:
                  "Code took longer than 5 seconds — possible infinite loop",
              },
            ],
          });
        }, TIMEOUT_MS);

        worker.onmessage = (e: MessageEvent<RunResult>) => {
          clearTimeout(timeout);
          worker.terminate();
          workerRef.current = null;
          resolve(e.data);
        };

        worker.onerror = (e: ErrorEvent) => {
          clearTimeout(timeout);
          worker.terminate();
          workerRef.current = null;
          resolve({
            passed: false,
            results: [
              {
                name: "Worker error",
                passed: false,
                error: e.message,
              },
            ],
          });
        };

        worker.postMessage({ studentCode, testCode });
      }),
    [],
  );

  return { runTests };
}
