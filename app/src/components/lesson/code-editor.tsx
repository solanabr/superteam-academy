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
  AlertTriangle,
} from "lucide-react";
import type { Challenge, TestCase } from "@/types";

interface CodeEditorProps {
  challenge: Challenge;
  courseSlug: string;
  lessonId: string;
  onSubmit?: (passed: boolean) => void;
}

interface TestResult {
  testCase: TestCase;
  passed: boolean;
  output?: string;
}

/** Strip single-line (//) and multi-line comments from source code. */
function stripComments(source: string): string {
  return source
    .replace(/\/\/.*$/gm, "")   // single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ""); // multi-line comments
}

// TS error codes to ignore in challenge context:
// 2307 = Cannot find module (imports won't resolve without node_modules)
// 2304 = Cannot find name (external types not available)
// 2468 = Cannot find global value (no DOM/Node globals)
// 1378 = Top-level await requires module option
// 1375 = Top-level await requires target
// 7016 = Could not find declaration file
const IGNORED_TS_ERROR_CODES = new Set([2307, 2304, 2468, 1378, 1375, 7016]);

/** Get Monaco diagnostics (syntax errors only) for the current editor model. */
function getEditorDiagnostics(
  monaco: Monaco,
  modelUri: Parameters<typeof monaco.editor.getModelMarkers>[0] extends { resource?: infer R } ? R : never,
): Promise<Array<{ message: string; line: number }>> {
  return new Promise((resolve) => {
    // Wait briefly for Monaco workers to process changes
    setTimeout(() => {
      const markers = monaco.editor.getModelMarkers({ resource: modelUri })
        .filter((m: { severity: number; code?: string | number }) =>
          m.severity >= monaco.MarkerSeverity.Error &&
          !IGNORED_TS_ERROR_CODES.has(Number(m.code)),
        );
      resolve(
        markers.map((m: { message: string; startLineNumber: number }) => ({
          message: m.message,
          line: m.startLineNumber,
        })),
      );
    }, 500);
  });
}

export function CodeEditor({ challenge, courseSlug, lessonId, onSubmit }: CodeEditorProps) {
  const t = useTranslations("lesson.challenge");
  const { theme } = useAppStore();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [code, setCode] = useState(challenge.starterCode);
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [diagnosticErrors, setDiagnosticErrors] = useState<string[]>([]);
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

    // Configure TS compiler to be lenient for challenge code snippets
    if (challenge.language === "typescript") {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        allowJs: true,
        noResolve: true,       // Don't resolve imports (no node_modules)
        allowImportingTsExtensions: true,
        strict: false,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      });
      // Suppress semantic diagnostics (module resolution, missing types)
      // while keeping syntax diagnostics
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });
    }
  };

  const runTests = useCallback(async () => {
    setRunning(true);
    setResults([]);
    setDiagnosticErrors([]);

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Clear previous error markers
    if (editor && monaco) {
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelMarkers(model, "tests", []);
      }
    }

    // Step 1: Client-side diagnostics pre-check (TS only — fast feedback)
    if (
      challenge.language === "typescript" &&
      editor &&
      monaco
    ) {
      const model = editor.getModel();
      if (model) {
        const diagnostics = await getEditorDiagnostics(monaco, model.uri);
        if (diagnostics.length > 0) {
          const errorMessages = diagnostics.map(
            (d) => `Line ${d.line}: ${d.message}`,
          );
          setDiagnosticErrors(errorMessages);
          const testResults: TestResult[] = challenge.testCases.map((tc) => ({
            testCase: tc,
            passed: false,
            output: "Compile error",
          }));
          setResults(testResults);
          setRunning(false);
          return;
        }
      }
    }

    // Step 2: Server-side validation — test cases are verified on the server
    try {
      const res = await fetch("/api/challenges/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          lessonId,
          code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // API error — fall back to client-side pattern matching
        console.warn("Server validation failed, using client fallback:", data.error);
        const strippedCode = stripComments(code);
        const fallbackResults: TestResult[] = challenge.testCases.map((tc) => ({
          testCase: tc,
          passed: strippedCode.includes(tc.expectedOutput),
          output: strippedCode.includes(tc.expectedOutput)
            ? tc.expectedOutput
            : "Pattern not found in code",
        }));
        setResults(fallbackResults);
        setRunning(false);

        if (fallbackResults.every((r) => r.passed)) {
          onSubmit?.(true);
        }
        return;
      }

      // Map server results back to TestResult format
      const serverResults: TestResult[] = (data.results as Array<{
        id: string;
        name: string;
        passed: boolean;
        output?: string;
        hidden: boolean;
      }>).map((sr) => ({
        testCase: {
          id: sr.id,
          name: sr.name,
          expectedOutput: "",
          hidden: sr.hidden,
        },
        passed: sr.passed,
        output: sr.output,
      }));

      setResults(serverResults);
      setRunning(false);

      // Set error markers for failed tests
      if (editor && monaco) {
        const model = editor.getModel();
        if (model) {
          const failedTests = serverResults.filter((r) => !r.passed && !r.testCase.hidden);
          if (failedTests.length > 0) {
            const markers = failedTests.map((r, i) => ({
              severity: monaco.MarkerSeverity.Error,
              message: `Test failed: ${r.testCase.name}`,
              startLineNumber: Math.max(1, model.getLineCount() - failedTests.length + i),
              startColumn: 1,
              endLineNumber: Math.max(1, model.getLineCount() - failedTests.length + i),
              endColumn: model.getLineMaxColumn(Math.max(1, model.getLineCount() - failedTests.length + i)),
            }));
            monaco.editor.setModelMarkers(model, "tests", markers);
          }
        }
      }

      if (data.passed) {
        onSubmit?.(true);
      }
    } catch {
      // Network error — fall back to client-side
      console.warn("Network error, using client fallback");
      const strippedCode = stripComments(code);
      const fallbackResults: TestResult[] = challenge.testCases.map((tc) => ({
        testCase: tc,
        passed: strippedCode.includes(tc.expectedOutput),
        output: strippedCode.includes(tc.expectedOutput)
          ? tc.expectedOutput
          : "Pattern not found in code",
      }));
      setResults(fallbackResults);
      setRunning(false);

      if (fallbackResults.every((r) => r.passed)) {
        onSubmit?.(true);
      }
    }
  }, [code, challenge, courseSlug, lessonId, onSubmit]);

  const reset = () => {
    setCode(challenge.starterCode);
    setResults([]);
    setDiagnosticErrors([]);
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

          {/* Diagnostic errors (compile/syntax) */}
          {diagnosticErrors.length > 0 && (
            <div className="px-4 py-2 bg-destructive/5 border-b">
              <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Compile errors
              </div>
              <ul className="text-xs text-destructive/80 space-y-0.5 font-mono">
                {diagnosticErrors.slice(0, 5).map((err, i) => (
                  <li key={i} className="truncate">{err}</li>
                ))}
                {diagnosticErrors.length > 5 && (
                  <li className="text-muted-foreground">
                    +{diagnosticErrors.length - 5} more...
                  </li>
                )}
              </ul>
            </div>
          )}

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
