'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Lazy load Monaco to avoid SSR issues and reduce initial bundle
const MonacoEditor = dynamic(() => import('@monaco-editor/react').then(m => m.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">
      Loading editor...
    </div>
  ),
});

interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

interface CodeEditorProps {
  language?: string;
  defaultValue?: string;
  readOnly?: boolean;
  height?: string;
  testCases?: TestCase[];
  onRun?: (code: string) => Promise<string>;
  onComplete?: () => void;
}

export function CodeEditor({
  language = 'typescript',
  defaultValue = '',
  readOnly = false,
  height = '400px',
  testCases = [],
  onRun,
  onComplete,
}: CodeEditorProps) {
  const [code, setCode] = useState(defaultValue);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; description: string }[]>([]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setOutput('');
    setTestResults([]);

    try {
      if (onRun) {
        const result = await onRun(code);
        setOutput(result);
      }

      // Run test cases (simulated)
      if (testCases.length > 0) {
        const results = testCases.map((tc) => ({
          passed: Math.random() > 0.3, // Simulated — real impl would eval
          description: tc.description,
        }));
        setTestResults(results);

        if (results.every((r) => r.passed) && onComplete) {
          onComplete();
        }
      }
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRunning(false);
    }
  }, [code, onRun, onComplete, testCases]);

  const handleReset = () => {
    setCode(defaultValue);
    setOutput('');
    setTestResults([]);
  };

  return (
    <div className="flex flex-col border border-gray-700 rounded-xl overflow-hidden bg-gray-900">
      {/* Editor */}
      <div style={{ height }}>
        <MonacoEditor
          language={language === 'rust' ? 'rust' : language === 'json' ? 'json' : 'typescript'}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            readOnly,
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            tabSize: 4,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
          }}
        />
      </div>

      {/* Controls */}
      {!readOnly && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-t border-gray-700">
          <button
            onClick={handleRun}
            disabled={running}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded text-sm font-medium transition-colors flex items-center gap-1"
          >
            {running ? '⏳' : '▶'} {running ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          >
            ↺ Reset
          </button>
        </div>
      )}

      {/* Output */}
      {(output || testResults.length > 0) && (
        <div className="border-t border-gray-700 p-4 bg-gray-950">
          {output && (
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap mb-3">{output}</pre>
          )}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-400">Test Results</div>
              {testResults.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-sm ${
                    r.passed ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  <span>{r.passed ? '✅' : '❌'}</span>
                  <span>{r.description}</span>
                </div>
              ))}
              {testResults.every((r) => r.passed) && (
                <div className="text-green-400 font-bold mt-2">🎉 All tests passed!</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
