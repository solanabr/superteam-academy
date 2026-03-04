"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Play,
  Timer,
  Lightning,
  XCircle,
} from "@phosphor-icons/react";
import { CodeEditor } from "./code-editor";
import { runClientTests } from "@/lib/academy/run-tests-client";
import type { ChallengeLesson } from "@/lib/data/types";

type TestResult = {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
  timedOut: boolean;
  exitCode: number | null;
};

type Props = {
  lesson: ChallengeLesson;
  onAllTestsPass: () => void;
};

function getFileName(language: "typescript" | "rust"): string {
  return language === "typescript" ? "solution.ts" : "main.rs";
}

export function ChallengeEditorPanel({ lesson, onAllTestsPass }: Props) {
  const t = useTranslations("lessonView");
  const [code, setCode] = useState(lesson.starterCode);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientOnly = lesson.language === "typescript";
  const allPassed =
    results !== null &&
    results.length > 0 &&
    results.every((result) => result.passed);

  const handleRun = () => {
    if (!clientOnly) return;
    setRunning(true);
    setError(null);
    setResults(null);
    setTimeout(() => {
      try {
        const { passed, results: r } = runClientTests(code, lesson.testCases);
        setResults(r);
        if (passed) onAllTestsPass();
      } catch (runError) {
        setError(
          runError instanceof Error ? runError.message : "Execution failed.",
        );
      } finally {
        setRunning(false);
      }
    }, 0);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--editor-bg)]">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--editor-border)] px-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <Timer className="size-3" weight="bold" />
            {lesson.duration}m
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-secondary">
            <Lightning className="size-3" weight="fill" />
            {lesson.xp} XP
          </span>
        </div>
        <Button
          onClick={handleRun}
          disabled={running || !clientOnly}
          size="sm"
          className="h-6 gap-1 rounded-sm px-2.5 text-[11px] font-semibold"
          title={
            clientOnly ? undefined : "Run tests (TypeScript only in browser)"
          }
        >
          <Play className="size-3" weight="fill" />
          {running ? "Running..." : "Run Tests"}
        </Button>
      </div>

      <div className="flex shrink-0 border-b border-[var(--editor-border)] bg-[var(--editor-bg)]">
        <div className="flex items-center border-b-2 border-primary px-3 py-1.5 font-mono text-[11px] text-foreground">
          {getFileName(lesson.language)}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={lesson.language}
          className="min-h-0 flex-1"
        />
      </div>

      <div className="shrink-0 border-t border-[var(--editor-border)] bg-background/80 p-3">
        {error ? (
          <p className="font-mono text-xs text-destructive">{error}</p>
        ) : null}

        {results ? (
          <div className="space-y-2">
            <p className="font-semibold text-muted-foreground">{t("tests")}</p>
            <ul className="space-y-1.5">
              {results.map((result) => (
                <li
                  key={result.label}
                  className="flex items-start gap-2 text-sm"
                >
                  {result.passed ? (
                    <CheckCircle
                      className="mt-0.5 size-4 shrink-0 text-green-600"
                      weight="fill"
                    />
                  ) : (
                    <XCircle
                      className="mt-0.5 size-4 shrink-0 text-destructive"
                      weight="fill"
                    />
                  )}
                  <div className="min-w-0">
                    <p
                      className={
                        result.passed ? "text-foreground" : "text-destructive"
                      }
                    >
                      {result.label} {result.passed ? t("pass") : t("fail")}
                    </p>
                    {!result.passed ? (
                      <p className="font-mono text-xs text-muted-foreground">
                        expected: {result.expected || "(empty)"} | actual:{" "}
                        {result.actual || "(empty)"}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            {allPassed ? (
              <p className="mt-2 flex items-center gap-2 font-medium text-green-600">
                <CheckCircle className="size-5" weight="fill" />
                {t("allTestsPassed")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
