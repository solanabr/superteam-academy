"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeEditorProps {
  initialCode: string;
  language: string;
  expectedOutput: string;
  instructions: string;
  onValidate: (passed: boolean) => void;
  storageKey?: string;
  hints?: string[];
  solution?: string;
}

export function CodeEditor({
  initialCode,
  language,
  expectedOutput,
  instructions,
  onValidate,
  storageKey,
  hints,
  solution,
}: CodeEditorProps) {
  const savedCode = storageKey && typeof window !== "undefined"
    ? localStorage.getItem(`code:${storageKey}`) ?? initialCode
    : initialCode;
  const [code, setCode] = useState(savedCode);
  const [output, setOutput] = useState<string | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // Auto-save to localStorage
  const handleCodeChange = useCallback((v: string | undefined) => {
    const val = v ?? "";
    setCode(val);
    if (storageKey) {
      try { localStorage.setItem(`code:${storageKey}`, val); } catch { /* quota */ }
    }
  }, [storageKey]);

  // Clear saved code on reset
  const handleReset = useCallback(() => {
    setCode(initialCode);
    setOutput(null);
    setPassed(null);
    if (storageKey) localStorage.removeItem(`code:${storageKey}`);
  }, [initialCode, storageKey]);

  const handleRun = () => {
    // Simulated execution: pattern match against expected output
    const trimmed = code.trim();
    const match = trimmed.includes(expectedOutput.trim());
    setOutput(match ? expectedOutput : "Output does not match expected result.");
    setPassed(match);
    onValidate(match);
  };

  return (
    <div className="rounded-xl border border-edge overflow-hidden">
      <div className="flex items-center justify-between bg-surface-secondary px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
          {language}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="rounded-lg border border-edge px-3 py-1.5 text-xs text-content-secondary hover:text-content"
          >
            Reset
          </button>
          <button
            onClick={handleRun}
            className="rounded-lg bg-solana-gradient px-4 py-1.5 text-xs font-bold text-white hover:opacity-90"
          >
            Run
          </button>
        </div>
      </div>

      {instructions && (
        <div className="border-b border-edge-soft bg-card px-4 py-3">
          <p className="text-xs text-content-secondary">{instructions}</p>
        </div>
      )}

      <MonacoEditor
        height="300px"
        language={language === "rust" ? "rust" : language}
        theme="vs-dark"
        value={code}
        onChange={handleCodeChange}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          padding: { top: 12 },
        }}
      />

      {output !== null && (
        <div className={`border-t px-4 py-3 text-xs font-mono ${
          passed
            ? "border-solana-green/20 bg-solana-green/5 text-solana-green"
            : "border-red-500/20 bg-red-500/5 text-red-400"
        }`}>
          {output}
        </div>
      )}

      {/* Hints & Solution toggles */}
      {(hints?.length || solution) && (
        <div className="border-t border-edge-soft">
          {hints && hints.length > 0 && (
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex w-full items-center justify-between px-4 py-2 text-xs text-content-secondary hover:text-content"
            >
              <span>Hints ({hints.length})</span>
              <svg className={`h-3 w-3 transition-transform ${showHints ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {showHints && hints && (
            <div className="border-t border-edge-soft bg-card px-4 py-2 space-y-1">
              {hints.map((h, i) => (
                <p key={i} className="text-xs text-content-muted">💡 {h}</p>
              ))}
            </div>
          )}
          {solution && (
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="flex w-full items-center justify-between border-t border-edge-soft px-4 py-2 text-xs text-content-secondary hover:text-content"
            >
              <span>Solution</span>
              <svg className={`h-3 w-3 transition-transform ${showSolution ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {showSolution && solution && (
            <pre className="border-t border-edge-soft bg-card px-4 py-2 text-xs font-mono text-content-muted overflow-x-auto">
              {solution}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
