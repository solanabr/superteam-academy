'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  expected?: string;
  actual?: string;
  executionTime?: number;
}

interface TestCaseRowProps {
  result: TestResult;
  index: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TestCaseRow({ result, index: _index }: TestCaseRowProps) {
  const t = useTranslations('challenge');
  const [expanded, setExpanded] = useState(!result.passed);

  const hasDetails = !!(result.expected || result.actual || result.message);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border transition-colors',
        result.passed
          ? 'border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20'
          : 'border-red-500/20 bg-red-50/50 dark:bg-red-950/20',
      )}
    >
      {/* Row header */}
      <button
        type="button"
        onClick={() => hasDetails && setExpanded((p) => !p)}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors',
          hasDetails && 'cursor-pointer hover:bg-accent/30',
        )}
        disabled={!hasDetails}
        aria-expanded={hasDetails ? expanded : undefined}
      >
        {/* Pass/fail icon */}
        {result.passed ? (
          <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
        ) : (
          <XCircle className="size-5 shrink-0 text-red-500" />
        )}

        {/* Test name */}
        <span className="flex-1 font-medium">
          {result.name}
        </span>

        {/* Execution time */}
        {result.executionTime !== undefined && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {result.executionTime}ms
          </span>
        )}

        {/* Expand indicator */}
        {hasDetails && (
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        )}
      </button>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="border-t px-4 py-3 text-sm">
          {result.message && (
            <p className="mb-3 text-muted-foreground">{result.message}</p>
          )}

          <div className="flex flex-col gap-2">
            {result.expected && (
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                  {t('expected')}
                </span>
                <code className="flex-1 rounded bg-emerald-100 px-2 py-1 font-mono text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {result.expected}
                </code>
              </div>
            )}
            {result.actual && (
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                  {t('actual')}
                </span>
                <code className="flex-1 rounded bg-red-100 px-2 py-1 font-mono text-xs text-red-800 dark:bg-red-900/40 dark:text-red-300">
                  {result.actual}
                </code>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
