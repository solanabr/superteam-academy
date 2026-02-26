"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Play, CheckCircle2, XCircle, Lightbulb, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Challenge, TestCase } from "@/types";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1e1e2e] animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading editor...</div>
    </div>
  ),
});

interface TestResult {
  testCase: TestCase;
  passed: boolean;
  output?: string;
  error?: string;
}

interface CodeEditorProps {
  challenge: Challenge;
  onComplete?: () => void;
}

export function CodeEditor({ challenge, onComplete }: CodeEditorProps) {
  const [code, setCode] = useState(challenge.starterCode);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [passed, setPassed] = useState(false);

  const languageMap: Record<string, string> = {
    typescript: "typescript",
    rust: "rust",
    json: "json",
    bash: "shell",
  };

  const handleRun = async () => {
    setRunning(true);
    setResults([]);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));

    // Simulate test execution based on whether code was modified
    const isModified = code !== challenge.starterCode;
    const isSolution = code.includes("findProgramAddressSync") || 
                       code.includes("SystemProgram.transfer") ||
                       !code.includes("// Your code here");

    const testResults: TestResult[] = challenge.testCases.map((tc) => ({
      testCase: tc,
      passed: isSolution ? Math.random() > 0.1 : Math.random() > 0.8,
      output: isSolution ? tc.expectedOutput : "undefined",
      error: !isSolution && Math.random() > 0.5 ? "Expected value not returned" : undefined,
    }));

    setResults(testResults);
    const allPassed = testResults.every((r) => r.passed);
    setPassed(allPassed);

    if (allPassed) {
      onComplete?.();
    }

    setRunning(false);
  };

  const handleReset = () => {
    setCode(challenge.starterCode);
    setResults([]);
    setPassed(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Badge variant="purple" className="text-xs">
            {challenge.language.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">solution.{challenge.language === "typescript" ? "ts" : challenge.language}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHints(!showHints)}
            className="h-7 text-xs gap-1"
          >
            <Lightbulb className="h-3 w-3 text-yellow-500" />
            Hints
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSolution(!showSolution)}
            className="h-7 text-xs gap-1"
          >
            <Eye className="h-3 w-3" />
            Solution
          </Button>
        </div>
      </div>

      {/* Hints panel */}
      <AnimatePresence>
        {showHints && challenge.hints.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="p-3 bg-yellow-500/5 border-b border-yellow-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">
                  Hint {hintIndex + 1} of {challenge.hints.length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{challenge.hints[hintIndex]}</p>
              {hintIndex < challenge.hints.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHintIndex((i) => i + 1)}
                  className="mt-2 h-7 text-xs"
                >
                  Next Hint
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-[300px]">
        <Editor
          height="100%"
          language={languageMap[challenge.language] ?? "typescript"}
          value={showSolution ? challenge.solution : code}
          onChange={(val) => {
            if (!showSolution) setCode(val ?? "");
          }}
          options={{
            fontSize: 13,
            fontFamily: "var(--font-geist-mono), 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            lineNumbers: "on",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            renderLineHighlight: "gutter",
            readOnly: showSolution,
          }}
          theme="vs-dark"
        />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border p-3 bg-card/50">
        <div className="flex items-center gap-3">
          <Button
            variant="gradient"
            size="sm"
            onClick={handleRun}
            disabled={running}
            className="gap-2"
          >
            {running ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Run Tests
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="flex items-center gap-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-1 text-xs px-2 py-1 rounded-md",
                    r.passed
                      ? "bg-[#14F195]/10 text-[#14F195]"
                      : "bg-red-500/10 text-red-400"
                  )}
                  title={r.testCase.description}
                >
                  {r.passed ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  Test {i + 1}
                </div>
              ))}
            </div>
          )}

          {passed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto flex items-center gap-2 text-[#14F195] text-sm font-semibold"
            >
              <CheckCircle2 className="h-4 w-4" />
              All tests passed! ✨
            </motion.div>
          )}
        </div>

        {/* Test results detail */}
        {results.length > 0 && (
          <div className="mt-3 space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={cn(
                  "text-xs p-2 rounded-md",
                  r.passed
                    ? "bg-[#14F195]/5 border border-[#14F195]/20"
                    : "bg-red-500/5 border border-red-500/20"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {r.passed ? (
                    <CheckCircle2 className="h-3 w-3 text-[#14F195]" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-400" />
                  )}
                  <span className={r.passed ? "text-[#14F195]" : "text-red-400"}>
                    {r.testCase.description}
                  </span>
                </div>
                {r.error && (
                  <p className="mt-1 pl-4 text-red-400/70">{r.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
