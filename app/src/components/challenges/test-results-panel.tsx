'use client';

import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  FlaskConical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TestCaseRow } from '@/components/challenges/test-case-row';
import type { TestResult } from '@/components/challenges/test-case-row';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestResultsPanelProps {
  results: TestResult[];
  isRunning: boolean;
  onRunAll: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TestResultsPanel({
  results,
  isRunning,
  onRunAll,
  className,
}: TestResultsPanelProps) {
  const t = useTranslations('challenge');

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const allPassed = totalCount > 0 && passedCount === totalCount;
  const hasResults = totalCount > 0;

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border bg-card',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            {t('run_tests')}
          </h3>

          {/* Summary badge */}
          {hasResults && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                allPassed
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              )}
            >
              {allPassed ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <XCircle className="size-3" />
              )}
              {t('tests_summary', { passed: passedCount, total: totalCount })}
            </span>
          )}
        </div>

        {/* Run button */}
        <Button
          onClick={onRunAll}
          disabled={isRunning}
          size="sm"
          variant={allPassed ? 'outline' : 'default'}
          className="gap-1.5"
        >
          {isRunning ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              {t('running_tests')}
            </>
          ) : (
            <>
              <Play className="size-3.5" />
              {t('run_tests')}
            </>
          )}
        </Button>
      </div>

      {/* Results list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
          {isRunning && !hasResults ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span>{t('running_tests')}</span>
            </div>
          ) : hasResults ? (
            results.map((result, idx) => (
              <TestCaseRow key={idx} result={result} index={idx} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <FlaskConical className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Run tests to check your solution
              </p>
            </div>
          )}

          {/* Success banner when all pass */}
          {allPassed && !isRunning && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 dark:bg-emerald-900/20">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {t('all_tests_passed')}
                </p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  Submit your solution to earn XP.
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
