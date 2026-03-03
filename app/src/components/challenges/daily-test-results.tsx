"use client";

import { useState } from "react";
import { Check, X, ChevronDown, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface DailyTestResult {
  description: string;
  expectedOutput: string;
  actualOutput?: string;
  executionTimeMs?: number;
  passed?: boolean;
}

export interface DailyTestResultsProps {
  results: DailyTestResult[];
  labels: {
    testResults: string;
    passed: string;
    expected: string;
    actual: string;
  };
}

export function DailyTestResults({ results, labels }: DailyTestResultsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const passedCount = results.filter((r) => r.passed === true).length;
  const hasResults = results.some((r) => r.passed !== undefined);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs font-semibold text-[#ccc]">
          {labels.testResults}
        </h3>
        {hasResults && (
          <span className="text-[10px] text-[#888]">
            {passedCount}/{results.length} {labels.passed}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {hasResults && (
        <div className="px-3 pb-2">
          <Progress
            value={(passedCount / results.length) * 100}
            className="h-1"
          />
        </div>
      )}

      {/* Test list */}
      <div className="space-y-1 px-2 pb-2">
        {results.map((result, i) => {
          const isExpanded = expandedIdx === i;
          const hasFailed = result.passed === false && result.actualOutput;

          return (
            <div key={i}>
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors",
                  hasFailed
                    ? "hover:bg-red-500/10 cursor-pointer"
                    : "cursor-default",
                )}
                onClick={() =>
                  hasFailed && setExpandedIdx(isExpanded ? null : i)
                }
              >
                {/* Status icon */}
                {result.passed === true ? (
                  <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                ) : result.passed === false ? (
                  <X className="h-3 w-3 shrink-0 text-red-400" />
                ) : (
                  <div className="h-3 w-3 shrink-0 rounded-full border border-[#555]" />
                )}

                {/* Description */}
                <span
                  className={cn(
                    "flex-1 text-left",
                    result.passed === true
                      ? "text-emerald-400"
                      : result.passed === false
                        ? "text-red-400"
                        : "text-[#888]",
                  )}
                >
                  {result.description}
                </span>

                {/* Execution time */}
                {result.executionTimeMs !== undefined &&
                  result.passed !== undefined && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[#666]">
                      <Clock className="h-2.5 w-2.5" />
                      {result.executionTimeMs}ms
                    </span>
                  )}

                {/* Expand indicator */}
                {hasFailed && (
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-[#666] transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                )}
              </button>

              {/* Expanded detail for failed tests */}
              {isExpanded && hasFailed && (
                <div className="mx-2 mb-1 rounded border border-[#333] bg-[#252526] p-2 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 font-medium text-[#888]">
                      {labels.expected}:
                    </span>
                    <code className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">
                      {result.expectedOutput}
                    </code>
                  </div>
                  <div className="mt-1.5 flex items-start gap-2">
                    <span className="shrink-0 font-medium text-[#888]">
                      {labels.actual}:
                    </span>
                    <code className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-400">
                      {result.actualOutput}
                    </code>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
