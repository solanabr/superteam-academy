"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, XCircle, Warning } from "@phosphor-icons/react";
import type { OutputPanelProps, TestResult } from "./types";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

function TestResultRow({ result }: { result: TestResult }) {
  const t = useTranslations("lesson");

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border p-3",
        result.passed
          ? "border-success/30 bg-success/5"
          : "border-danger/30 bg-danger/5"
      )}
    >
      <div className="flex items-center gap-2">
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
        <span className="text-sm font-medium">
          {result.testCase.description}
        </span>
        <span
          className={cn(
            "ml-auto text-xs font-semibold",
            result.passed ? "text-success" : "text-danger"
          )}
        >
          {result.passed ? t("passed") : t("failed")}
        </span>
      </div>
      {!result.passed && (
        <div className="mt-2 space-y-1 pl-6 text-xs">
          <div className="flex gap-2">
            <span className="font-medium text-text-3">{t("expected")}:</span>
            <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-success">
              {result.testCase.expectedOutput}
            </code>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-text-3">{t("output")}:</span>
            <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-danger">
              {result.actualOutput}
            </code>
          </div>
          {result.error && (
            <div className="mt-1 text-danger">{result.error}</div>
          )}
        </div>
      )}
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

  const hasTestResults =
    executionResult?.testResults && executionResult.testResults.length > 0;
  const passedCount =
    executionResult?.testResults?.filter((r) => r.passed).length ?? 0;
  const totalCount = executionResult?.testResults?.length ?? 0;
  const allPassed = passedCount === totalCount && totalCount > 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-md border bg-card",
        className
      )}
    >
      <Tabs defaultValue="output" className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-3 py-1">
          <TabsList className="h-8 bg-transparent p-0">
            <TabsTrigger
              value="output"
              className="data-[state=active]:bg-subtle/80 h-7 rounded-sm px-2 text-xs"
            >
              {t("output")}
            </TabsTrigger>
            <TabsTrigger
              value="tests"
              className="data-[state=active]:bg-subtle/80 h-7 rounded-sm px-2 text-xs"
            >
              {t("testCases")}
              {hasTestResults && (
                <span
                  className={cn(
                    "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    allPassed
                      ? "bg-success/20 text-success"
                      : "bg-danger/20 text-danger"
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
            Clear
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
              {executionResult.error && (
                <div className="border-danger/30 bg-danger/5 flex items-start gap-2 rounded-md border p-3">
                  <Warning
                    size={16}
                    weight="duotone"
                    className="mt-0.5 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                  <pre className="flex-1 whitespace-pre-wrap font-mono text-xs text-danger">
                    {executionResult.error}
                  </pre>
                </div>
              )}
              {executionResult.output && (
                <pre className="whitespace-pre-wrap font-mono text-xs text-text">
                  {executionResult.output}
                </pre>
              )}
              {!executionResult.error && !executionResult.output && (
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
                <div className="border-success/30 bg-success/10 mb-3 flex items-center gap-2 rounded-md border p-3">
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
              {executionResult.testResults?.map((result) => (
                <TestResultRow key={result.testCase.id} result={result} />
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
