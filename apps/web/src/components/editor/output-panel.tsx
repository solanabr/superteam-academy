"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CaretDown,
  CheckCircle,
  XCircle,
  Warning,
} from "@phosphor-icons/react";
import type { OutputPanelProps, TestResult } from "./types";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

/** Max characters of captured stdout/stderr rendered in the Output tab. */
const OUTPUT_CAP_CHARS = 10_000;

function capOutput(text: string): { text: string; truncated: boolean } {
  return text.length > OUTPUT_CAP_CHARS
    ? { text: text.slice(0, OUTPUT_CAP_CHARS), truncated: true }
    : { text, truncated: false };
}

function TestResultRow({
  result,
  index,
  expanded,
  onToggle,
}: {
  result: TestResult;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("lesson");
  const detailId = `test-result-detail-${index}`;

  // Degenerate rows — Rust compile failures and build-server compilation
  // checks (parseRustTestResults / runBuildChallenge) — can carry empty
  // input/expectedOutput and multi-line compiler dumps in actualOutput.
  // Omit the test-code pane when there is no test code, and render the
  // message in a wrapping, scroll-capped <pre> so no shape breaks layout.
  const input = result.testCase.input.trim();
  const expectedOutput = result.testCase.expectedOutput.trim();
  const hasTestCode = input.length > 0 || expectedOutput.length > 0;
  const message = result.actualOutput.trim();

  return (
    <div
      className={cn(
        "rounded-md border",
        result.passed
          ? "[background:var(--success-bg)] [border-color:var(--success-border)]"
          : "[background:var(--danger-light)] [border-color:var(--danger-border)]"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={detailId}
        className="flex w-full items-center gap-2 rounded-md p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {result.passed ? (
          <CheckCircle
            size={16}
            weight="duotone"
            className="shrink-0 text-success"
            aria-hidden="true"
          />
        ) : (
          <XCircle
            size={16}
            weight="duotone"
            className="shrink-0 text-danger"
            aria-hidden="true"
          />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {result.testCase.description}
        </span>
        <span
          className={cn(
            "shrink-0 text-xs font-semibold",
            result.passed ? "text-success" : "text-danger"
          )}
        >
          {result.passed ? t("passed") : t("failed")}
        </span>
        <CaretDown
          size={14}
          weight="bold"
          className={cn(
            "shrink-0 text-text-3 transition-transform",
            expanded && "rotate-180"
          )}
          aria-hidden="true"
        />
        <span className="sr-only">
          {expanded ? t("hideTestDetails") : t("showTestDetails")}
        </span>
      </button>
      <div id={detailId} hidden={!expanded}>
        <div
          className={cn(
            "grid gap-3 px-3 pb-3 pl-9 text-xs",
            hasTestCode && "sm:grid-cols-2"
          )}
        >
          {hasTestCode && (
            <div className="min-w-0 space-y-1">
              <div className="font-medium text-text-3">{t("testCode")}</div>
              {input.length > 0 && (
                <div className="flex min-w-0 gap-2">
                  <span className="shrink-0 font-medium text-text-3">
                    {t("input")}:
                  </span>
                  <code className="min-w-0 whitespace-pre-wrap break-words rounded bg-subtle px-1.5 py-0.5 font-mono">
                    {input}
                  </code>
                </div>
              )}
              {expectedOutput.length > 0 && (
                <div className="flex min-w-0 gap-2">
                  <span className="shrink-0 font-medium text-text-3">
                    {t("expected")}:
                  </span>
                  <code className="min-w-0 whitespace-pre-wrap break-words rounded bg-subtle px-1.5 py-0.5 font-mono text-success">
                    {expectedOutput}
                  </code>
                </div>
              )}
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <div className="font-medium text-text-3">{t("testMessage")}</div>
            {message.length > 0 && (
              <pre
                className={cn(
                  "max-h-40 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded bg-subtle px-1.5 py-0.5 font-mono",
                  result.passed ? "text-success" : "text-danger"
                )}
              >
                {message}
              </pre>
            )}
            {result.error && (
              <pre className="max-h-40 min-w-0 overflow-auto whitespace-pre-wrap break-words font-mono text-danger">
                {result.error}
              </pre>
            )}
            {message.length === 0 && !result.error && (
              <span className="text-text-3">&mdash;</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OutputPanel({
  executionResult,
  isRunning,
  onClear,
  className,
}: OutputPanelProps) {
  const t = useTranslations("lesson");
  const tA11y = useTranslations("a11y");

  const [activeTab, setActiveTab] = useState<string>("output");
  const [expandedRows, setExpandedRows] = useState<ReadonlySet<number>>(
    () => new Set()
  );

  const testResults = executionResult?.testResults;

  useEffect(() => {
    if (!testResults || testResults.length === 0) {
      setExpandedRows(new Set());
      return;
    }
    const firstFailure = testResults.findIndex((r) => !r.passed);
    if (firstFailure === -1) {
      setExpandedRows(new Set());
      return;
    }
    // On run-result arrival with a failure: auto-expand exactly the first
    // failing test and surface the Tests tab (Exercism convention). Only the
    // tab *selection* changes — DOM focus is never moved, so a user typing
    // in the editor is not interrupted.
    setExpandedRows(new Set([firstFailure]));
    setActiveTab("tests");
  }, [testResults]);

  const toggleRow = (index: number): void => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const hasTestResults = Boolean(testResults && testResults.length > 0);
  const passedCount = testResults?.filter((r) => r.passed).length ?? 0;
  const totalCount = testResults?.length ?? 0;
  const allPassed = passedCount === totalCount && totalCount > 0;

  const cappedError = executionResult?.error
    ? capOutput(executionResult.error)
    : null;
  const cappedOutput = executionResult?.output
    ? capOutput(executionResult.output)
    : null;

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-md border bg-card",
        className
      )}
    >
      <div role="status" className="sr-only">
        {hasTestResults && !isRunning
          ? allPassed
            ? t("testsPassed")
            : t("testsFailed")
          : null}
      </div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full flex-col"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-1">
          <TabsList className="h-8 bg-transparent p-0">
            <TabsTrigger
              value="output"
              className="h-7 rounded-sm px-2 text-xs data-[state=active]:[background:var(--input)]"
            >
              {t("output")}
            </TabsTrigger>
            <TabsTrigger
              value="tests"
              className="h-7 rounded-sm px-2 text-xs data-[state=active]:[background:var(--input)]"
            >
              {t("testCases")}
              {hasTestResults && (
                <span
                  className={cn(
                    "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    allPassed
                      ? "text-success [background:var(--success-light)]"
                      : "text-danger [background:var(--danger-light)]"
                  )}
                >
                  {passedCount}/{totalCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onClear}
            aria-label={tA11y("clearOutput")}
          >
            {t("clearOutput")}
          </Button>
        </div>

        <TabsContent value="output" className="m-0 flex-1 overflow-auto p-3">
          {isRunning ? (
            <div className="flex items-center gap-2 text-sm text-text-3">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {t("runCode")}...
            </div>
          ) : executionResult ? (
            <div className="space-y-2">
              {cappedError && (
                <div className="flex items-start gap-2 rounded-md border p-3 [background:var(--danger-light)] [border-color:var(--danger-border)]">
                  <Warning
                    size={16}
                    weight="duotone"
                    className="mt-0.5 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs text-danger">
                      {cappedError.text}
                    </pre>
                    {cappedError.truncated && (
                      <p className="text-xs text-text-3">
                        {t("outputTruncated", { limit: OUTPUT_CAP_CHARS })}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {cappedOutput && (
                <>
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs text-text">
                    {cappedOutput.text}
                  </pre>
                  {cappedOutput.truncated && (
                    <p className="text-xs text-text-3">
                      {t("outputTruncated", { limit: OUTPUT_CAP_CHARS })}
                    </p>
                  )}
                </>
              )}
              {!cappedError && !cappedOutput && (
                <p className="text-sm text-text-3">{t("noOutput")}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-3">{t("runCodePrompt")}</p>
          )}
        </TabsContent>

        <TabsContent value="tests" className="m-0 flex-1 overflow-auto p-3">
          {hasTestResults ? (
            <div className="space-y-2">
              {allPassed && (
                <div className="mb-3 flex items-center gap-2 rounded-md border p-3 [background:var(--success-bg)] [border-color:var(--success-border)]">
                  <CheckCircle
                    size={20}
                    weight="duotone"
                    className="text-success"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-success">
                    {t("testsPassed")}
                  </span>
                </div>
              )}
              {testResults?.map((result, index) => (
                <TestResultRow
                  key={`${result.testCase.id}-${index}`}
                  result={result}
                  index={index}
                  expanded={expandedRows.has(index)}
                  onToggle={() => toggleRow(index)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-3">{t("testCasesPrompt")}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
