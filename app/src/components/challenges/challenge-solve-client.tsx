"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import {
  CheckCircle2,
  Sparkles,
  Play,
  Loader2,
  ArrowLeft,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChallengeTimer } from "./challenge-timer";
import { DailyChallengePrompt } from "./daily-challenge-prompt";
import { DailyTestResults, type DailyTestResult } from "./daily-test-results";
import { OutputDisplay } from "@/components/editor/output-display";
import { saveCompletion, type DailyChallenge } from "@/lib/daily-challenges";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

const DIFFICULTY_LABELS: Record<DailyChallenge["difficulty"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const DIFFICULTY_COLORS: Record<DailyChallenge["difficulty"], string> = {
  beginner: "text-emerald-400",
  intermediate: "text-yellow-400",
  advanced: "text-red-400",
};

interface ChallengeSolveClientProps {
  challenge: DailyChallenge;
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
    tags: string;
    testResults: string;
    passed: string;
    failed: string;
    elapsedTime: string;
    challengeComplete: string;
    yourTime: string;
    backToChallenges: string;
    prerequisites: string;
    description?: string;
    expectedBehavior?: string;
    examples?: string;
    input?: string;
    output?: string;
    expected?: string;
    actual?: string;
    runningTests?: string;
    compileError?: string;
    submitSolution?: string;
  };
}

// ── Mobile tab view ──────────────────────────────────────────────────────────

type MobileTab = "description" | "editor" | "results";

export function ChallengeSolveClient({
  challenge,
  labels,
}: ChallengeSolveClientProps) {
  const router = useRouter();
  const [code, setCode] = useState(challenge.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tests" | "output">("tests");
  const [mobileTab, setMobileTab] = useState<MobileTab>("description");
  const [runOutput, setRunOutput] = useState("");
  const [testResults, setTestResults] = useState<DailyTestResult[]>(
    challenge.testCases.map((tc) => ({
      description: tc.description,
      expectedOutput: tc.expectedOutput,
    })),
  );

  const editorLanguage = useMemo(() => {
    return challenge.language === "rust" ? "rust" : "typescript";
  }, [challenge.language]);

  // Record start time on mount
  useEffect(() => {
    fetch("/api/daily-challenges/start", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.startedAt) setStartedAt(data.startedAt);
      })
      .catch(() => {});
  }, []);

  const runTests = useCallback(async () => {
    if (isRunning || completed) return;
    setIsRunning(true);
    setActiveTab("tests");
    setRunOutput("");

    try {
      const res = await fetch("/api/daily-challenges/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id, code }),
      });

      if (!res.ok) {
        setRunOutput("> Error: Failed to validate code. Please try again.");
        setIsRunning(false);
        return;
      }

      const data: {
        results: DailyTestResult[];
        output: string;
        allPassed: boolean;
        compileError: boolean;
      } = await res.json();

      setTestResults(data.results);
      setRunOutput(data.output);
    } catch {
      setRunOutput("> Error: Network error. Please check your connection.");
    } finally {
      setIsRunning(false);
    }
  }, [code, challenge.id, isRunning, completed]);

  const handleSubmit = useCallback(async () => {
    if (completed) return;
    const earned = challenge.xpReward;
    const passedCount = testResults.filter((t) => t.passed === true).length;

    saveCompletion(challenge.id, earned);
    setXpEarned(earned);
    setCompleted(true);
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 2500);

    const elapsedSeconds = startedAt
      ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      : null;

    fetch("/api/daily-challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId: String(challenge.id),
        xpEarned: earned,
        testsPassed: passedCount,
        totalTests: testResults.length,
        timeSeconds: elapsedSeconds,
      }),
    }).catch(() => {});
  }, [completed, challenge.id, challenge.xpReward, testResults, startedAt]);

  const handleReset = useCallback(() => {
    setCode(challenge.starterCode);
    setTestResults(
      challenge.testCases.map((tc) => ({
        description: tc.description,
        expectedOutput: tc.expectedOutput,
      })),
    );
    setRunOutput("");
  }, [challenge]);

  const allPassed = testResults.every((t) => t.passed === true);
  const hasRun = testResults.some((t) => t.passed !== undefined);

  const promptLabels = {
    description: labels.description ?? "Description",
    expectedBehavior: labels.expectedBehavior ?? "Expected Behavior",
    examples: labels.examples ?? "Examples",
    input: labels.input ?? "Input",
    output: labels.output ?? "Output",
    hintLabel: labels.hintLabel,
    nextHint: labels.nextHint,
    showSolution: labels.showSolution,
    hideSolution: labels.hideSolution,
  };

  const testLabels = {
    testResults: labels.testResults,
    passed: labels.passed,
    expected: labels.expected ?? "Expected",
    actual: labels.actual ?? "Actual",
  };

  // ── Sticky header bar ──────────────────────────────────────────────────────

  const headerBar = (
    <div className="flex items-center gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link
        href="/challenges"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{labels.backToChallenges}</span>
      </Link>

      <div className="h-4 w-px bg-border" />

      <span className="text-xs font-medium">{labels.dailyChallenge}</span>

      <div className="h-4 w-px bg-border" />

      {/* Timer — prominent */}
      {startedAt && (
        <ChallengeTimer
          startedAt={startedAt}
          stopped={completed}
          label={labels.elapsedTime}
        />
      )}

      <div className="ml-auto flex items-center gap-2">
        <span
          className={cn(
            "text-xs font-medium",
            DIFFICULTY_COLORS[challenge.difficulty],
          )}
        >
          {DIFFICULTY_LABELS[challenge.difficulty]}
        </span>
        <span className="text-xs font-semibold text-yellow-400">
          +{challenge.xpReward} {labels.xpReward}
        </span>
      </div>
    </div>
  );

  // ── Celebration overlay ────────────────────────────────────────────────────

  const celebrationOverlay = celebrating && (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400 animate-bounce" />
        <h2 className="text-2xl font-bold text-emerald-400">
          {labels.challengeComplete}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          +{xpEarned} {labels.xpReward}
        </p>
        <button
          className="mt-4 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
          onClick={() => router.push("/challenges")}
        >
          {labels.backToChallenges}
        </button>
      </div>
    </div>
  );

  // ── Editor + bottom panel (shared between desktop right panel & mobile) ───

  const editorSection = (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between border-b border-[#333] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#ccc]">
            solution.{challenge.language === "rust" ? "rs" : "ts"}
          </span>
          <span className="rounded bg-[#333] px-1.5 py-0.5 text-[10px] uppercase text-[#888]">
            {challenge.language}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            disabled={completed}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#888] transition-colors hover:bg-[#333] hover:text-[#ccc] disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={runTests}
            disabled={isRunning || completed}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              isRunning
                ? "bg-[#333] text-[#888]"
                : "bg-brazil-green text-white hover:bg-brazil-green/90",
            )}
          >
            {isRunning ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {labels.runningTests ?? "Running..."}
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                {labels.runTests}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language={editorLanguage}
          value={showSolution ? challenge.solutionCode : code}
          onChange={(v) => !showSolution && !completed && setCode(v ?? "")}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            readOnly: showSolution || completed,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Bottom tabs: Tests / Output */}
      <div className="border-t border-[#333]">
        <div className="flex items-center gap-px bg-[#252526]">
          <button
            onClick={() => setActiveTab("tests")}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors",
              activeTab === "tests"
                ? "bg-[#1e1e1e] text-[#ccc]"
                : "text-[#888] hover:text-[#ccc]",
            )}
          >
            {labels.testResults}
            {hasRun && (
              <span className="ml-1.5">
                {testResults.filter((r) => r.passed).length}/
                {testResults.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors",
              activeTab === "output"
                ? "bg-[#1e1e1e] text-[#ccc]"
                : "text-[#888] hover:text-[#ccc]",
            )}
          >
            Output
          </button>
        </div>
        <div className="h-36 overflow-y-auto bg-[#1e1e1e]">
          {activeTab === "tests" ? (
            <DailyTestResults results={testResults} labels={testLabels} />
          ) : (
            <div className="p-3">
              <OutputDisplay output={runOutput} />
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="relative flex items-center justify-between border-t border-[#333] px-4 py-2.5">
          <div className="text-xs text-[#888]">
            {allPassed && !completed && labels.allPassed}
            {completed && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> +{xpEarned} XP
              </span>
            )}
          </div>
          {completed ? (
            <Link
              href="/challenges"
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {labels.backToChallenges}
            </Link>
          ) : allPassed ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-brazil-gold to-brazil-gold-light px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-brazil-gold/20 transition-all hover:shadow-xl hover:shadow-brazil-gold/30"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {labels.submitSolution ?? labels.allPassed}
            </button>
          ) : (
            <button
              onClick={runTests}
              disabled={isRunning}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-all",
                isRunning
                  ? "bg-[#333] text-[#888]"
                  : "bg-brazil-green text-white hover:bg-brazil-green/90",
              )}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {labels.runningTests ?? "Running..."}
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  {labels.runTests}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Desktop layout (split-pane) ────────────────────────────────────────────

  const desktopLayout = (
    <div className="hidden h-full lg:flex lg:flex-col">
      <PanelGroup orientation="horizontal" className="flex-1">
        <Panel defaultSize={40} minSize={25}>
          <DailyChallengePrompt
            challenge={challenge}
            showSolution={showSolution}
            onToggleSolution={() => setShowSolution((s) => !s)}
            labels={promptLabels}
          />
        </Panel>
        <PanelResizeHandle className="w-1.5 bg-border transition-colors hover:bg-primary/50 data-[resize-handle-active]:bg-primary" />
        <Panel defaultSize={60} minSize={35}>
          {editorSection}
        </Panel>
      </PanelGroup>
    </div>
  );

  // ── Mobile layout (tabbed) ─────────────────────────────────────────────────

  const mobileLayout = (
    <div className="flex h-full flex-col lg:hidden">
      {/* Tab switcher */}
      <div className="flex border-b border-border">
        {(["description", "editor", "results"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={cn(
              "flex-1 px-4 py-2.5 text-xs font-medium capitalize transition-colors",
              mobileTab === tab
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {mobileTab === "description" && (
          <DailyChallengePrompt
            challenge={challenge}
            showSolution={showSolution}
            onToggleSolution={() => setShowSolution((s) => !s)}
            labels={promptLabels}
          />
        )}
        {mobileTab === "editor" && editorSection}
        {mobileTab === "results" && (
          <div className="h-full overflow-y-auto bg-[#1e1e1e] p-3">
            <DailyTestResults results={testResults} labels={testLabels} />
            {runOutput && (
              <div className="mt-3 border-t border-[#333] pt-3">
                <OutputDisplay output={runOutput} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col">
      {headerBar}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {celebrationOverlay}
        {desktopLayout}
        {mobileLayout}
      </div>
    </div>
  );
}
