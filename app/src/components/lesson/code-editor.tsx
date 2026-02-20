"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  RotateCcw,
  Lightbulb,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import type { Challenge, TestCase } from "@/types";

interface CodeEditorProps {
  challenge: Challenge;
  onSubmit?: (passed: boolean) => void;
}

interface TestResult {
  testCase: TestCase;
  passed: boolean;
  output?: string;
}

export function CodeEditor({ challenge, onSubmit }: CodeEditorProps) {
  const t = useTranslations("lesson.challenge");
  const { theme } = useAppStore();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [code, setCode] = useState(challenge.starterCode);
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const languageMap: Record<string, string> = {
    rust: "rust",
    typescript: "typescript",
    json: "json",
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const runTests = useCallback(async () => {
    setRunning(true);
    setResults([]);

    // Clear previous error markers
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (editor && monaco) {
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelMarkers(model, "tests", []);
      }
    }

    // Simulate test execution
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const testResults: TestResult[] = challenge.testCases.map((tc) => {
      // Simple pattern matching to simulate test results
      const hasExpectedPattern = code.includes(tc.expectedOutput) ||
        code.length > challenge.starterCode.length + 20;
      return {
        testCase: tc,
        passed: hasExpectedPattern,
        output: hasExpectedPattern ? tc.expectedOutput : "No output",
      };
    });

    setResults(testResults);
    setRunning(false);

    // Set error markers on the editor for failed tests
    if (editor && monaco) {
      const model = editor.getModel();
      if (model) {
        const failedTests = testResults.filter((r) => !r.passed);
        if (failedTests.length > 0) {
          const markers = failedTests.map((r, i) => ({
            severity: monaco.MarkerSeverity.Error,
            message: `Test failed: ${r.testCase.name} — expected "${r.testCase.expectedOutput}", got "${r.output ?? "no output"}"`,
            startLineNumber: Math.max(1, model.getLineCount() - failedTests.length + i),
            startColumn: 1,
            endLineNumber: Math.max(1, model.getLineCount() - failedTests.length + i),
            endColumn: model.getLineMaxColumn(Math.max(1, model.getLineCount() - failedTests.length + i)),
          }));
          monaco.editor.setModelMarkers(model, "tests", markers);
        }
      }
    }

    const allPassed = testResults.every((r) => r.passed);
    if (allPassed) {
      onSubmit?.(true);
    }
  }, [code, challenge, onSubmit]);

  const reset = () => {
    setCode(challenge.starterCode);
    setResults([]);
    setShowHints(false);
    setShowSolution(false);
  };

  const allPassed = results.length > 0 && results.every((r) => r.passed);
  const hasFailed = results.length > 0 && results.some((r) => !r.passed);

  return (
    <div className="flex flex-col h-full border rounded-xl overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {challenge.language}
          </Badge>
          <span className="text-sm font-medium">{t("title")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("reset")}
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={runTests}
            disabled={running}
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {t("run")}
          </Button>
        </div>
      </div>

      {/* Prompt */}
      <div className="border-b px-4 py-3 space-y-2">
        <p className="text-sm">{challenge.prompt}</p>
        {challenge.objectives.length > 0 && (
          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
            {challenge.objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-[300px]">
        <Editor
          height="100%"
          language={languageMap[challenge.language] ?? "plaintext"}
          value={code}
          onChange={(val) => setCode(val ?? "")}
          onMount={handleEditorMount}
          theme={theme === "dark" ? "vs-dark" : "light"}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "var(--font-geist-mono), monospace",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: "line",
            automaticLayout: true,
          }}
        />
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="border-t">
          <div className="px-4 py-2 bg-muted/30 flex items-center justify-between">
            <span className="text-sm font-medium">{t("testCases")}</span>
            {allPassed ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t("passed")}
              </Badge>
            ) : hasFailed ? (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                {t("failed")}
              </Badge>
            ) : null}
          </div>
          <div className="divide-y max-h-48 overflow-y-auto">
            {results
              .filter((r) => !r.testCase.hidden)
              .map((result, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm"
                >
                  {result.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <span className="flex-1 truncate">
                    {result.testCase.name}
                  </span>
                  {!result.passed && result.output && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      Got: {result.output}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Hints / Solution */}
      <div className="border-t px-4 py-2 flex items-center gap-2">
        {challenge.hints && challenge.hints.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setShowHints(!showHints)}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {t("hints")}
          </Button>
        )}
        {challenge.solution && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground"
            onClick={() => setShowSolution(!showSolution)}
          >
            <Eye className="h-3.5 w-3.5" />
            {t("solution")}
          </Button>
        )}
      </div>

      {/* Hints panel */}
      {showHints && challenge.hints && (
        <div className="border-t px-4 py-3 bg-amber-500/5">
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            {challenge.hints.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Solution panel */}
      {showSolution && challenge.solution && (
        <div className="border-t px-4 py-3 bg-muted/30">
          <pre className="text-xs overflow-x-auto font-mono whitespace-pre-wrap">
            {challenge.solution}
          </pre>
        </div>
      )}
    </div>
  );
}
