'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  FlaskConical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

interface OutputPanelProps {
  output: string;
  testResults?: TestResult[];
  isRunning: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OutputPanel({
  output,
  testResults = [],
  isRunning,
  className,
}: OutputPanelProps) {
  const t = useTranslations('lesson');
  const [expanded, setExpanded] = useState(true);

  const passedCount = testResults.filter((r) => r.passed).length;
  const totalCount = testResults.length;
  const allPassed = totalCount > 0 && passedCount === totalCount;

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border bg-[#1e1e1e] transition-all',
        className,
      )}
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center justify-between border-b border-neutral-700 bg-[#252526] px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-neutral-800"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Terminal className="size-3.5" />
          {t('output')}
        </span>
        {expanded ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
      </button>

      {expanded && (
        <Tabs defaultValue="output" className="flex-1">
          <TabsList variant="line" className="bg-[#252526] px-2">
            <TabsTrigger
              value="output"
              className="gap-1.5 text-neutral-400 data-[state=active]:text-neutral-200"
            >
              <Terminal className="size-3" />
              {t('output')}
            </TabsTrigger>
            {testResults.length > 0 && (
              <TabsTrigger
                value="tests"
                className="gap-1.5 text-neutral-400 data-[state=active]:text-neutral-200"
              >
                <FlaskConical className="size-3" />
                {t('tests')}
                {totalCount > 0 && (
                  <span
                    className={cn(
                      'ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      allPassed
                        ? 'bg-emerald-900/50 text-emerald-400'
                        : 'bg-red-900/50 text-red-400',
                    )}
                  >
                    {passedCount}/{totalCount}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Output tab */}
          <TabsContent value="output" className="max-h-48 overflow-auto p-3">
            {isRunning ? (
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Loader2 className="size-4 animate-spin" />
                <span>{t('running')}</span>
              </div>
            ) : output ? (
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-neutral-300">
                {output}
              </pre>
            ) : (
              <p className="text-sm text-neutral-500 italic">
                {t('no_output')}
              </p>
            )}
          </TabsContent>

          {/* Tests tab */}
          {testResults.length > 0 && (
            <TabsContent value="tests" className="max-h-48 overflow-auto p-3">
              {isRunning ? (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t('running')}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Summary */}
                  <div
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium',
                      allPassed
                        ? 'bg-emerald-900/30 text-emerald-400'
                        : 'bg-red-900/30 text-red-400',
                    )}
                  >
                    {allPassed ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <XCircle className="size-3.5" />
                    )}
                    {t('tests_summary', { passed: passedCount, total: totalCount })}
                  </div>

                  {/* Individual results */}
                  {testResults.map((result, idx) => (
                    <TestResultRow key={idx} result={result} />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal: Test result row
// ---------------------------------------------------------------------------

function TestResultRow({ result }: { result: TestResult }) {
  const t = useTranslations('lesson');
  const [showDetails, setShowDetails] = useState(false);
  const hasDetails = result.expected || result.actual || result.message;

  return (
    <div className="rounded-md border border-neutral-700 bg-neutral-800/50">
      <button
        type="button"
        onClick={() => hasDetails && setShowDetails((p) => !p)}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-left text-xs',
          hasDetails && 'cursor-pointer hover:bg-neutral-800',
        )}
        disabled={!hasDetails}
      >
        {result.passed ? (
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
        ) : (
          <XCircle className="size-3.5 shrink-0 text-red-400" />
        )}

        <span className="flex-1 font-medium text-neutral-200">
          {result.name}
        </span>

        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            result.passed
              ? 'bg-emerald-900/50 text-emerald-400'
              : 'bg-red-900/50 text-red-400',
          )}
        >
          {result.passed ? t('test_passed') : t('test_failed')}
        </span>

        {result.executionTime !== undefined && (
          <span className="text-neutral-500">
            {t('execution_time', { time: result.executionTime })}
          </span>
        )}
      </button>

      {showDetails && hasDetails && (
        <div className="border-t border-neutral-700 px-3 py-2 text-xs">
          {result.message && (
            <p className="mb-1 text-neutral-400">{result.message}</p>
          )}
          {result.expected && (
            <div className="flex gap-2">
              <span className="text-neutral-500">Expected:</span>
              <code className="text-emerald-400">{result.expected}</code>
            </div>
          )}
          {result.actual && (
            <div className="flex gap-2">
              <span className="text-neutral-500">Actual:</span>
              <code className="text-red-400">{result.actual}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
