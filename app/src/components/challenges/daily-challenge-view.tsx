"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Eye,
  EyeOff,
  Play,
  Lightbulb,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { ChallengeCountdown } from "./challenge-countdown";
import {
  isTodayCompleted,
  saveCompletion,
  type DailyChallenge,
  type DailyChallengeTest,
} from "@/lib/daily-challenges";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

const CATEGORY_COLORS: Record<DailyChallenge["category"], string> = {
  rust: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  anchor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  solana: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tokens: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  defi: "bg-green-500/10 text-green-400 border-green-500/20",
};

const DIFFICULTY_LABELS: Record<DailyChallenge["difficulty"], string> = {
  beginner: "🟢 Beginner",
  intermediate: "🟡 Intermediate",
  advanced: "🔴 Advanced",
};

interface DailyChallengeViewProps {
  challenge: DailyChallenge;
  dateKey: string;
  labels: {
    dailyChallenge: string;
    xpReward: string;
    runTests: string;
    allPassed: string;
    markComplete: string;
    alreadyCompleted: string;
    showSolution: string;
    hideSolution: string;
    hintLabel: string;
    nextHint: string;
    nextReset: string;
    tags: string;
    testResults: string;
    passed: string;
    failed: string;
  };
  onComplete?: (xp: number) => void;
}

/**
 * Full interactive view for the daily coding challenge.
 * Monaco editor + test runner + hint system.
 */
export function DailyChallengeView({
  challenge,
  dateKey: _dateKey,
  labels,
  onComplete,
}: DailyChallengeViewProps) {
  const [code, setCode] = useState(challenge.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [completed, setCompleted] = useState(() => isTodayCompleted());
  const [xpEarned, setXpEarned] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [testResults, setTestResults] = useState<DailyChallengeTest[]>(() => {
    const done = isTodayCompleted();
    return done
      ? challenge.testCases.map((t) => ({ ...t, passed: true }))
      : challenge.testCases;
  });

  useEffect(() => {
    if (!completed) {
      trackEvent({
        name: "daily_challenge_started",
        params: { challenge_id: String(challenge.id) },
      });
    }
  }, [challenge.id, completed]);

  const runTests = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    // Simulate test execution (same pattern as course challenges)
    await new Promise((r) => setTimeout(r, 900));

    const solutionKeywords = challenge.solutionCode
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const codeWords = code.toLowerCase().split(/\s+/);
    const matchScore =
      solutionKeywords.filter((kw) => codeWords.some((cw) => cw.includes(kw)))
        .length / Math.max(solutionKeywords.length, 1);

    const allPass =
      matchScore > 0.45 || code.trim() === challenge.solutionCode.trim();

    setTestResults((prev) =>
      prev.map((t, i) => ({
        ...t,
        passed: allPass || (matchScore > 0.3 && i === 0),
      })),
    );

    setIsRunning(false);
  }, [code, challenge.solutionCode, isRunning]);

  const allPassed = testResults.every((t) => t.passed === true);
  const passedCount = testResults.filter((t) => t.passed === true).length;

  const handleComplete = useCallback(async () => {
    if (completed) return;
    const earned = challenge.xpReward;
    saveCompletion(challenge.id, earned);
    setXpEarned(earned);
    setCompleted(true);
    setCelebrating(true);
    setTestResults((prev) => prev.map((t) => ({ ...t, passed: true })));
    trackEvent({
      name: "daily_challenge_completed",
      params: {
        challenge_id: String(challenge.id),
        tests_passed: passedCount,
        total_tests: testResults.length,
      },
    });
    setTimeout(() => setCelebrating(false), 2500);
    onComplete?.(earned);
  }, [
    completed,
    challenge.id,
    challenge.xpReward,
    onComplete,
    passedCount,
    testResults.length,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-xl p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs text-primary border-primary/30 bg-primary/5"
          >
            {labels.dailyChallenge}
          </Badge>
          <Badge
            variant="outline"
            className={cn("text-xs", CATEGORY_COLORS[challenge.category])}
          >
            {challenge.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {DIFFICULTY_LABELS[challenge.difficulty]}
          </Badge>
          <span className="ml-auto text-sm font-semibold text-yellow-400">
            +{challenge.xpReward} {labels.xpReward}
          </span>
        </div>

        <h1 className="mb-2 text-2xl font-bold">{challenge.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {challenge.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span className="font-medium">{labels.tags}:</span>
            {challenge.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
          <ChallengeCountdown label={labels.nextReset} />
        </div>
      </div>

      {/* Split editor + results */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="flex items-center justify-between bg-[#1e1e1e] px-4 py-2">
            <span className="text-xs font-mono text-zinc-400">
              solution.{challenge.language === "rust" ? "rs" : "ts"}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {challenge.language}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 px-2 text-xs text-zinc-300 hover:text-white"
                onClick={() => setCode(challenge.starterCode)}
              >
                Reset
              </Button>
            </div>
          </div>
          <div className="h-[360px]">
            <MonacoEditor
              height="360px"
              language={challenge.language === "rust" ? "rust" : "typescript"}
              value={showSolution ? challenge.solutionCode : code}
              onChange={(v) => !showSolution && setCode(v ?? "")}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                readOnly: showSolution || completed,
              }}
            />
          </div>
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {/* Test results */}
          <div className="glass rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{labels.testResults}</h3>
              <span className="text-xs text-muted-foreground">
                {passedCount}/{testResults.length} {labels.passed}
              </span>
            </div>

            {passedCount > 0 && (
              <Progress
                value={(passedCount / testResults.length) * 100}
                className="mb-3 h-1.5"
              />
            )}

            <div className="space-y-2">
              {testResults.map((test, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
                    test.passed === true
                      ? "bg-emerald-500/10 text-emerald-400"
                      : test.passed === false
                        ? "bg-red-500/10 text-red-400"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  <span className="mt-0.5 font-bold">
                    {test.passed === true
                      ? "✓"
                      : test.passed === false
                        ? "✗"
                        : "○"}
                  </span>
                  <div>
                    <div className="font-medium">{test.description}</div>
                    <div className="text-[10px] opacity-70">
                      → {test.expectedOutput}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={runTests}
              disabled={isRunning || completed}
              className="flex-1 gap-2"
            >
              {isRunning ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {labels.runTests}
            </Button>

            <Button
              onClick={handleComplete}
              disabled={completed}
              variant={allPassed ? "default" : "secondary"}
              className={cn(
                "flex-1 gap-2 transition-all",
                completed && "bg-emerald-600 hover:bg-emerald-600 text-white",
                celebrating && "animate-bounce",
              )}
            >
              {completed ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {xpEarned > 0 ? `+${xpEarned} XP` : labels.alreadyCompleted}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {allPassed ? labels.allPassed : labels.markComplete}
                </>
              )}
            </Button>
          </div>

          {/* Hints */}
          {challenge.hints.length > 0 && (
            <div className="glass rounded-xl overflow-hidden">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
                onClick={() => setShowHints((h) => !h)}
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  {labels.hintLabel} ({hintIndex + 1}/{challenge.hints.length})
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showHints && "rotate-180",
                  )}
                />
              </button>
              {showHints && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <p className="mb-3 text-sm text-muted-foreground">
                    💡 {challenge.hints[hintIndex]}
                  </p>
                  {hintIndex < challenge.hints.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        setHintIndex((i) =>
                          Math.min(i + 1, challenge.hints.length - 1),
                        )
                      }
                    >
                      {labels.nextHint}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Show/hide solution */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowSolution((s) => !s)}
          >
            {showSolution ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> {labels.hideSolution}
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> {labels.showSolution}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
