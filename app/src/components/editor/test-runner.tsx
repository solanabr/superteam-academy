"use client";

import { Check, X, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { TestCase } from "@/types";

export interface TestRunnerProps {
  testResults: TestCase[];
  variant?: "inline" | "panel" | "compact";
}

function TestStatusIcon({
  passed,
  size,
}: {
  passed: boolean | undefined;
  size: "sm" | "md";
}) {
  const iconClass = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const wrapperClass =
    size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  if (passed === true) {
    return size === "sm" ? (
      <Check className={cn(iconClass, "shrink-0 text-brazil-green")} />
    ) : (
      <CheckCircle2
        className={cn(iconClass, "shrink-0 text-brazil-green")}
      />
    );
  }
  if (passed === false) {
    return size === "sm" ? (
      <X className={cn(iconClass, "shrink-0 text-destructive")} />
    ) : (
      <XCircle className={cn(iconClass, "shrink-0 text-destructive")} />
    );
  }
  return (
    <div
      className={cn(
        wrapperClass,
        "shrink-0 rounded-full border",
        size === "sm" ? "border-[#555]" : "border-2 border-muted-foreground/30"
      )}
    />
  );
}

export function TestRunner({
  testResults,
  variant = "panel",
}: TestRunnerProps) {
  const t = useTranslations("lesson.challenge");

  if (variant === "inline") {
    return (
      <div className="space-y-2">
        {testResults.map((tc) => (
          <div
            key={tc.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 text-sm"
          >
            <div className="mt-0.5 shrink-0">
              <TestStatusIcon passed={tc.passed} size="md" />
            </div>
            <div>
              <div className="font-medium">{tc.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t("testInput", { input: tc.input })}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("testExpected", { expected: tc.expectedOutput })}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="space-y-2">
        {testResults.map((tc) => (
          <div
            key={tc.id}
            className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-2.5 text-xs"
          >
            <div className="mt-0.5 shrink-0">
              <TestStatusIcon passed={tc.passed} size="md" />
            </div>
            <div>
              <div className="font-medium">{tc.name}</div>
              <div className="mt-0.5 text-muted-foreground">
                {tc.expectedOutput}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // panel variant — used inside dark editor test tabs
  return (
    <div className="space-y-1.5">
      {testResults.map((tc) => (
        <div
          key={tc.id}
          className="flex items-center gap-2 rounded px-2 py-1.5 text-xs"
        >
          <TestStatusIcon passed={tc.passed} size="sm" />
          <span
            className={cn(
              tc.passed === true
                ? "text-brazil-green"
                : tc.passed === false
                  ? "text-destructive"
                  : "text-[#888]"
            )}
          >
            {tc.name}
          </span>
        </div>
      ))}
    </div>
  );
}
