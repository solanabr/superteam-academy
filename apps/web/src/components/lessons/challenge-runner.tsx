'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CodeEditor } from './code-editor';
import { LessonContent } from './lesson-content';
import { ConfettiCelebration } from '@/components/ui/confetti';
import {
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Lightbulb,
  Eye,
  EyeOff,
  Trophy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ChallengeData, TestCase } from '@/lib/mock-data';

interface ChallengeRunnerProps {
  challenge: ChallengeData;
  onComplete: () => void;
}

export function ChallengeRunner({ challenge, onComplete }: ChallengeRunnerProps) {
  const t = useTranslations('lessonView');
  const [code, setCode] = useState(challenge.starterCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestCase[]>(challenge.testCases);
  const [allPassed, setAllPassed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setOutput('');

    // Simulate code execution
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const hasChanges = code !== challenge.starterCode;
    const results = challenge.testCases.map((tc, i) => ({
      ...tc,
      passed: hasChanges && (showSolution || Math.random() > 0.3 - i * 0.1),
    }));

    setTestResults(results);

    const passed = results.every((r) => r.passed);
    setAllPassed(passed);

    if (passed) {
      setOutput(`✅ ${t('allTestsPassed')}\n\n${t('xpEarned')}: +${challenge.xpReward} XP`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } else {
      const failedTests = results.filter((r) => !r.passed);
      setOutput(
        `❌ ${failedTests.length} ${t('testsFailed')}\n\n` +
          failedTests
            .map(
              (tc) =>
                `${t('testCase')}: ${tc.name}\n  ${t('expected')}: ${tc.expectedOutput}\n`
            )
            .join('\n')
      );
    }

    setIsRunning(false);
  }, [code, challenge, showSolution, t]);

  const handleMarkComplete = useCallback(() => {
    setIsCompleted(true);
    onComplete();
  }, [onComplete]);

  return (
    <div className="flex h-full flex-col gap-4 lg:flex-row">
      <ConfettiCelebration show={showConfetti} />

      {/* Left: Challenge description */}
      <div className="flex flex-col gap-4 overflow-y-auto lg:w-1/2">
        <LessonContent content={challenge.description} />

        {/* Test Cases */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('testCases')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {testResults.map((tc) => (
              <div
                key={tc.id}
                className="flex items-center gap-2 rounded-md bg-accent/30 px-3 py-2 text-sm"
              >
                {tc.passed === undefined ? (
                  <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                ) : tc.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-muted-foreground">{tc.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Hints */}
        {challenge.hints.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <button
                onClick={() => setShowHints(!showHints)}
                className="flex w-full items-center justify-between"
              >
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  {t('hints')} ({challenge.hints.length})
                </CardTitle>
                {showHints ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </CardHeader>
            {showHints && (
              <CardContent className="space-y-2">
                {challenge.hints.slice(0, currentHint + 1).map((hint, i) => (
                  <div
                    key={i}
                    className="rounded-md bg-yellow-500/5 border border-yellow-500/20 px-3 py-2 text-sm text-muted-foreground"
                  >
                    💡 {hint}
                  </div>
                ))}
                {currentHint < challenge.hints.length - 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentHint((h) => h + 1)}
                  >
                    {t('showNextHint')}
                  </Button>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Solution Toggle */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setShowSolution(!showSolution);
            if (!showSolution) {
              setCode(challenge.solution);
            } else {
              setCode(challenge.starterCode);
            }
          }}
        >
          {showSolution ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {showSolution ? t('hideSolution') : t('showSolution')}
        </Button>
      </div>

      {/* Right: Editor + Output */}
      <div className="flex flex-col gap-4 lg:w-1/2">
        <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-lg border border-border">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={challenge.language}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="solana"
            className="gap-2"
            onClick={runCode}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? t('running') : t('runCode')}
          </Button>

          {allPassed && !isCompleted && (
            <Button variant="default" className="gap-2" onClick={handleMarkComplete}>
              <Trophy className="h-4 w-4" />
              {t('markComplete')} (+{challenge.xpReward} XP)
            </Button>
          )}

          {isCompleted && (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t('completed')}
            </Badge>
          )}
        </div>

        {/* Output Console */}
        {output && (
          <div className="rounded-lg border border-border bg-[#1a1a2e] p-4 font-mono text-sm">
            <div className="mb-2 text-xs text-muted-foreground">{t('output')}</div>
            <pre className="whitespace-pre-wrap text-green-400">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
