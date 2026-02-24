'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Clock,
  Loader2,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChallengeInstructions } from '@/components/challenges/challenge-instructions';
import { TestResultsPanel } from '@/components/challenges/test-results-panel';
import type { TestResult } from '@/components/challenges/test-case-row';
import { MonacoEditorWrapper } from '@/components/editor/monaco-editor-wrapper';
import { XpToast } from '@/components/gamification/xp-toast';
import { ConfettiAnimation } from '@/components/gamification/confetti-animation';
import { useEnrollment } from '@/lib/hooks/use-enrollment';
import { useStreak } from '@/lib/hooks/use-streak';

// ---------------------------------------------------------------------------
// Mock starter code
// ---------------------------------------------------------------------------

const CHALLENGE_STARTER_CODE = `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("ChAL1enge111111111111111111111111111111111");

#[program]
pub mod token_transfer {
  use super::*;

  pub fn transfer_tokens(
    ctx: Context<TransferTokens>,
    amount: u64,
  ) -> Result<()> {
    // TODO: Implement token transfer with PDA authority
    //
    // 1. Derive the PDA seeds
    // 2. Execute the CPI transfer using invoke_signed
    // 3. Emit a log message

    Ok(())
  }
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
  #[account(mut)]
  pub source_ata: Account<'info, TokenAccount>,
  #[account(mut)]
  pub dest_ata: Account<'info, TokenAccount>,
  /// CHECK: PDA authority
  pub authority: UncheckedAccount<'info>,
  pub token_program: Program<'info, Token>,
}`;

// ---------------------------------------------------------------------------
// Timer hook
// ---------------------------------------------------------------------------

function useElapsedTimer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatted = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  return { seconds, formatted };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChallengePage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const t = useTranslations('challenge');

  const { isLoading: enrollmentLoading } = useEnrollment(courseId);
  const { recordActivity } = useStreak();
  const { formatted: timeElapsed } = useElapsedTimer();

  const [code, setCode] = useState(CHALLENGE_STARTER_CODE);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showXpToast, setShowXpToast] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const allTestsPassed =
    testResults.length > 0 && testResults.every((r) => r.passed);

  // Simulate running tests
  const handleRunTests = useCallback(async () => {
    setIsRunning(true);
    setTestResults([]);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const hasTransferLogic = code.includes('invoke_signed') || code.includes('transfer');

    setTestResults([
      {
        name: 'PDA derivation is correct',
        passed: code.includes('find_program_address'),
        expected: 'PDA derived with seeds [b"authority", source_wallet]',
        actual: code.includes('find_program_address')
          ? 'PDA correctly derived'
          : 'No PDA derivation found',
        executionTime: 45,
      },
      {
        name: 'CPI transfer executes correctly',
        passed: hasTransferLogic,
        expected: 'invoke_signed with correct seeds and transfer instruction',
        actual: hasTransferLogic
          ? 'CPI transfer implemented'
          : 'No CPI transfer found in code',
        executionTime: 120,
      },
      {
        name: 'Handles insufficient balance',
        passed: code.includes('balance') || code.includes('amount'),
        message: 'Program should check source balance before transfer',
        expected: 'Err(TokenError::InsufficientFunds)',
        actual: code.includes('balance')
          ? 'Balance check found'
          : 'No balance validation',
        executionTime: 30,
      },
      {
        name: 'Emits correct log message',
        passed: code.includes('msg!'),
        expected: 'msg! macro with transfer details',
        actual: code.includes('msg!')
          ? 'Log message found'
          : 'No log message emitted',
        executionTime: 10,
      },
      {
        name: 'Accounts struct is valid',
        passed: true,
        executionTime: 5,
      },
    ]);

    setIsRunning(false);
  }, [code]);

  // Submit solution
  const handleSubmit = useCallback(async () => {
    if (!allTestsPassed || isSubmitting) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitted(true);
    setIsSubmitting(false);

    recordActivity();
    setShowXpToast(true);
    setShowConfetti(true);
  }, [allTestsPassed, isSubmitting, recordActivity]);

  // Reset code
  const handleReset = useCallback(() => {
    setCode(CHALLENGE_STARTER_CODE);
    setTestResults([]);
    setSubmitted(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (enrollmentLoading) {
    return (
      <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col lg:-m-8">
        <Skeleton className="h-12 w-full" />
        <div className="flex flex-1">
          <Skeleton className="w-1/2" />
          <Skeleton className="w-1/2" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col lg:-m-8">
      {/* Celebration effects */}
      {showXpToast && <XpToast amount={500} />}
      <ConfettiAnimation trigger={showConfetti} />

      {/* Top bar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2 lg:px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={`/courses/${courseId}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{t('title')}</h2>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Clock className="size-3" />
              {timeElapsed}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {submitted ? (
            <Badge className="gap-1 bg-emerald-600 text-white">
              <CheckCircle2 className="size-3.5" />
              {t('all_tests_passed')}
            </Badge>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allTestsPassed || isSubmitting}
              size="sm"
              className="gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  {t('submit_solution')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left: Instructions */}
        <div className="flex-1 overflow-hidden border-b lg:border-r lg:border-b-0">
          <ChallengeInstructions courseId={courseId} />
        </div>

        {/* Right: Editor + Tests */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Code editor */}
          <MonacoEditorWrapper
            defaultValue={CHALLENGE_STARTER_CODE}
            language="rust"
            onChange={setCode}
            onRun={handleRunTests}
            onReset={handleReset}
            isRunning={isRunning}
            className="flex-1"
          />

          {/* Test results */}
          <TestResultsPanel
            results={testResults}
            isRunning={isRunning}
            onRunAll={handleRunTests}
            className="h-64 shrink-0 border-t"
          />
        </div>
      </div>
    </div>
  );
}
