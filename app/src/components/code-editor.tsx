"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Lesson } from "@/data/courses";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[200px] items-center justify-center bg-[#1e1e1e] text-muted-foreground">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  ),
});

interface CodeEditorProps {
  lesson: Lesson;
  defaultValue?: string;
  onRun?: (code: string) => void;
  onSubmit?: (code: string) => void;
  runLoading?: boolean;
  testResults?: { passed: number; total: number; details?: string };
  runLabel?: string;
  submitLabel?: string;
  allTestsPassedLabel?: string;
  passedCountLabel?: string;
}

const languageMap = {
  rust: "rust",
  typescript: "typescript",
  json: "json",
} as const;

export function CodeEditor({
  lesson,
  defaultValue,
  onRun,
  onSubmit,
  runLoading = false,
  testResults,
  runLabel = "Run",
  submitLabel = "Submit",
  allTestsPassedLabel = "All tests passed.",
  passedCountLabel = "passed",
}: CodeEditorProps) {
  const [code, setCode] = React.useState(
    defaultValue ?? lesson.challenge?.starterCode ?? "",
  );
  const lang = lesson.challenge?.language
    ? languageMap[lesson.challenge.language]
    : "typescript";

  return (
    <div className="flex h-full flex-col rounded-lg border bg-[#1e1e1e]">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm text-muted-foreground">
          {lesson.challenge?.language ?? "typescript"}
        </span>
        <div className="flex gap-2">
          {onRun && (
            <button
              type="button"
              onClick={() => onRun(code)}
              disabled={runLoading}
              className="rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {runLoading ? "..." : runLabel}
            </button>
          )}
          {onSubmit && (
            <button
              type="button"
              onClick={() => onSubmit(code)}
              className="rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {submitLabel}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-[200px]">
        <Editor
          height="100%"
          language={lang}
          value={code}
          onChange={(v) => setCode(v ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
          }}
        />
      </div>
      {testResults != null && (
        <div className="border-t px-3 py-2 text-sm">
          {testResults.passed === testResults.total ? (
            <span className="text-green-500">{allTestsPassedLabel}</span>
          ) : (
            <span className="text-amber-500">
              {testResults.passed}/{testResults.total} {passedCountLabel}.
            </span>
          )}
          {testResults.details && (
            <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {testResults.details}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
