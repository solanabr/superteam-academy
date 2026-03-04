"use client";

import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "@/contexts/theme-context";
import { useLocale } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CodeChallenge, TestCase } from "@/types";
import {
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface CodeEditorProps {
  challenge: CodeChallenge;
  onSubmit?: (code: string, passed: boolean) => void;
}

interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  hidden: boolean;
}

export function CodeEditor({ challenge, onSubmit }: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const { t } = useLocale();
  const [code, setCode] = useState(challenge.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [output, setOutput] = useState("");

  const runTests = useCallback(async () => {
    setIsRunning(true);
    setOutput("");

    // Simulated test execution
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const codeLength = code.length;
    const hasContent = codeLength > challenge.starterCode.length + 10;

    const results: TestResult[] = challenge.testCases.map(
      (tc: TestCase, index: number) => ({
        id: tc.id,
        description: tc.description,
        passed: hasContent ? index < 2 || Math.random() > 0.3 : false,
        hidden: tc.hidden,
      })
    );

    setTestResults(results);

    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const allPassed = passed === total;

    setOutput(
      allPassed
        ? `All ${total} tests passed successfully.`
        : `${passed}/${total} tests passed. Check failing tests below.`
    );

    setIsRunning(false);
    onSubmit?.(code, allPassed);
  }, [code, challenge, onSubmit]);

  const resetCode = useCallback(() => {
    setCode(challenge.starterCode);
    setTestResults(null);
    setOutput("");
  }, [challenge.starterCode]);

  const passedCount = testResults
    ? testResults.filter((r) => r.passed).length
    : 0;
  const totalTests = challenge.testCases.length;
  const allPassed = testResults?.every((r) => r.passed);

  const languageMap: Record<string, string> = {
    rust: "rust",
    typescript: "typescript",
    javascript: "javascript",
    python: "python",
  };

  return (
    <div className="space-y-4">
      {/* Challenge prompt */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-lg mb-2">
          {t("lesson.codeChallenge")}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {challenge.prompt}
        </p>
        <div className="space-y-1">
          <p className="text-sm font-medium">Objectives:</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {challenge.objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b border-border">
          <Badge variant="outline" className="font-mono text-xs">
            {challenge.language}
          </Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetCode}
              disabled={isRunning}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              {t("lesson.resetCode")}
            </Button>
            <Button
              size="sm"
              onClick={runTests}
              disabled={isRunning}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              {isRunning ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1" />
              )}
              {t("lesson.runCode")}
            </Button>
          </div>
        </div>
        <Editor
          height="350px"
          language={languageMap[challenge.language] || "rust"}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          value={code}
          onChange={(v) => setCode(v || "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 12 },
            lineNumbers: "on",
            renderLineHighlight: "gutter",
            automaticLayout: true,
          }}
        />
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div
            className={`flex items-center justify-between px-4 py-3 ${allPassed ? "bg-emerald-500/10" : "bg-amber-500/10"}`}
          >
            <div className="flex items-center gap-2">
              {allPassed ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-amber-500" />
              )}
              <span className="font-medium text-sm">
                {allPassed
                  ? t("lesson.allTestsPassed")
                  : t("lesson.testsPassed", {
                      passed: passedCount,
                      total: totalTests,
                    })}
              </span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {testResults
              .filter((r) => !r.hidden)
              .map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm"
                >
                  {result.passed ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <span
                    className={
                      result.passed ? "text-foreground" : "text-red-500"
                    }
                  >
                    {result.description}
                  </span>
                </div>
              ))}
            {testResults.some((r) => r.hidden) && (
              <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground">
                <span className="h-4 w-4 shrink-0" />
                + {testResults.filter((r) => r.hidden).length} hidden test
                {testResults.filter((r) => r.hidden).length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="rounded-lg border border-border bg-muted p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t("lesson.output")}
          </p>
          <pre className="text-sm font-mono whitespace-pre-wrap">{output}</pre>
        </div>
      )}

      {/* Hint toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowHints(!showHints)}
        className="text-muted-foreground"
      >
        <Lightbulb className="h-4 w-4 mr-1" />
        Hints
        {showHints ? (
          <ChevronUp className="h-3.5 w-3.5 ml-1" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 ml-1" />
        )}
      </Button>
      {showHints && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm space-y-2">
          <p className="text-muted-foreground">
            Review the lesson content carefully. Focus on implementing each
            objective one at a time. Start with the basic structure, then handle
            edge cases.
          </p>
        </div>
      )}
    </div>
  );
}
