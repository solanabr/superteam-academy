"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Play, RotateCcw, Eye, EyeOff, CheckCircle2, XCircle, Loader2,
  Lightbulb, Terminal, Sparkles, ChevronUp, ChevronDown,
  Lock, Unlock, ArrowRight, GitCompareArrows, Copy, Check,
} from "lucide-react";
import type { SanityChallenge } from "@/lib/sanity/queries";
import { useProgressStore } from "@/stores/progress-store";
import { useNotificationStore } from "@/stores/notification-store";
import { showXPToast } from "@/components/gamification/XPToast";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAchievementTrigger } from "@/hooks/useAchievementTrigger";
import { loader } from "@monaco-editor/react";

// Load Monaco from local public/ directory instead of CDN (jsdelivr may be blocked).
loader.config({ paths: { vs: "/monaco/vs" } });

const XP_BY_DIFFICULTY: Record<number, number> = { 1: 25, 2: 50, 3: 100 };

const editorLoading = (
  <div className="relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-lg bg-muted/50 border border-border/30">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      <span className="text-xs font-medium tracking-wide">Initializing editor…</span>
    </div>
  </div>
);

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => editorLoading,
});

const MonacoDiffEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.DiffEditor), {
  ssr: false,
  loading: () => editorLoading,
});

async function fetchChallengeById(id: string): Promise<SanityChallenge | null> {
  const { publicClient } = await import("@/lib/sanity/client");
  return publicClient.fetch(
    `*[_type == "challenge" && _id == $id][0] {
      _id, title, language, starterCode, solutionCode, testCode, hints, difficulty, xpReward
    }`,
    { id }
  );
}

type TestMessages = {
  noImplementation: string;
  implementationDetected: string;
  allPassed: string;
  passCount: (count: number) => string;
  failCount: (count: number) => string;
  pass: string;
  fail: string;
};

type TestResult = { pattern: string; passed: boolean };

/* ─── Structural Token Extraction ─── */
function extractKeyTokens(code: string): string[] {
  // Strip comments and empty lines, extract meaningful tokens
  const stripped = code
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, "").trim())
    .filter(Boolean)
    .join("\n");

  const tokens: string[] = [];

  // Extract function/method calls (e.g., getAssociatedTokenAddressSync, getAccountInfo)
  const callMatches = stripped.match(/\b[a-zA-Z_]\w*(?=\s*\()/g);
  if (callMatches) tokens.push(...callMatches.filter((t) => t.length > 3 && !/^(if|for|while|return|const|let|var|function|async|await|import|export|from|new|throw|catch|try)$/.test(t)));

  // Extract property accesses (e.g., connection.getAccountInfo)
  const propMatches = stripped.match(/\w+\.\w+/g);
  if (propMatches) tokens.push(...propMatches.filter((t) => t.length > 5));

  // Extract key identifiers from assignments
  const assignMatches = stripped.match(/(?:const|let|var)\s+(\w+)/g);
  if (assignMatches) tokens.push(...assignMatches.map((m) => m.replace(/^(?:const|let|var)\s+/, "")).filter((t) => t.length > 2));

  // Extract return statement structure presence
  if (stripped.includes("return")) tokens.push("return");

  // Deduplicate
  return [...new Set(tokens)];
}

function runPatternTests(
  code: string,
  testCode: string,
  solutionCode: string,
  msgs: TestMessages
): { passed: boolean; output: string; results: TestResult[] } {
  const patterns = testCode
    .split("\n")
    .filter((l) => l.trim().startsWith("// expect:"))
    .map((l) => l.replace("// expect:", "").trim());

  if (patterns.length === 0) {
    // No explicit patterns → structural comparison against solution
    const trimmed = code.trim();
    if (trimmed === "" || trimmed.includes("// TODO") || trimmed === solutionCode.trim().split("\n").slice(0, 3).join("\n").trim()) {
      return {
        passed: false,
        output: `${msgs.fail}: ${msgs.noImplementation}`,
        results: [],
      };
    }

    // Extract key tokens from solution and check user's code
    const solutionTokens = extractKeyTokens(solutionCode);
    if (solutionTokens.length === 0) {
      // Fallback: at least ensure code has function bodies
      const hasFunctionBody = /\{[\s\S]*\S[\s\S]*\}/.test(code);
      return {
        passed: hasFunctionBody,
        output: hasFunctionBody
          ? `${msgs.pass}: ${msgs.implementationDetected}\n\n${msgs.allPassed}`
          : `${msgs.fail}: ${msgs.noImplementation}`,
        results: [],
      };
    }

    const results: TestResult[] = solutionTokens.map((token) => ({
      pattern: token,
      passed: code.includes(token),
    }));

    const matched = results.filter((r) => r.passed).length;
    const score = matched / solutionTokens.length;

    if (score >= 0.5) {
      return {
        passed: true,
        output: `${msgs.pass}: ${msgs.passCount(matched)}/${solutionTokens.length} key patterns matched\n\n${msgs.allPassed}`,
        results,
      };
    }

    const missing = results.filter((r) => !r.passed).slice(0, 3);
    return {
      passed: false,
      output: `${msgs.fail}: Only ${matched}/${solutionTokens.length} key patterns found\n\nMissing:\n${missing.map((r) => `  • ${r.pattern}`).join("\n")}`,
      results,
    };
  }

  // Explicit patterns mode
  const results: TestResult[] = patterns.map((pattern) => ({
    pattern,
    passed: code.includes(pattern),
  }));

  const failures = results.filter((r) => !r.passed);

  return failures.length === 0
    ? { passed: true, output: `${msgs.pass}: ${msgs.passCount(patterns.length)}`, results }
    : {
      passed: false,
      output: `${msgs.fail}: ${msgs.failCount(failures.length)}\n${failures.map((r) => `  Expected: ${r.pattern}`).join("\n")}`,
      results,
    };
}

/* ─── Component ─── */

interface Props {
  challenge?: SanityChallenge;
  challengeId?: string;
  standalone?: boolean;
}

export function CodeChallenge({ challenge: challengeProp, challengeId, standalone = false }: Props) {
  const t = useTranslations("challenge");
  const tc = useTranslations("common");
  const { resolvedTheme } = useTheme();

  // Data
  const [challenge, setChallenge] = useState<SanityChallenge | null>(challengeProp ?? null);
  const [loadingChallenge, setLoadingChallenge] = useState(!challengeProp && !!challengeId);
  const [code, setCode] = useState(challengeProp?.starterCode ?? "");

  // Test state
  const [output, setOutput] = useState("");
  const [testResult, setTestResult] = useState<"pass" | "fail" | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [copiedSolution, setCopiedSolution] = useState(false);
  const [running, setRunning] = useState(false);

  // UI state
  const [showSolution, setShowSolution] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);
  const [infoCardExpanded, setInfoCardExpanded] = useState(false);
  const [outputExpanded, setOutputExpanded] = useState(true);

  // Refs & stores
  const xpAwardedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const addBonusXp = useProgressStore((s) => s.addBonusXp);
  const recordActivity = useProgressStore((s) => s.recordActivity);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const { trigger: triggerAchievement } = useAchievementTrigger();

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (challengeProp) {
      setChallenge(challengeProp);
      setCode(challengeProp.starterCode);
      setOutput("");
      setTestResult(null);
      setTestResults([]);
      setShowSolution(false);
      setRevealedHints(0);
      return;
    }
    if (!challengeId) return;
    setLoadingChallenge(true);
    fetchChallengeById(challengeId)
      .then((data) => {
        if (data) {
          setChallenge(data);
          setCode(data.starterCode);
        }
      })
      .finally(() => setLoadingChallenge(false));
  }, [challengeId, challengeProp]);

  const copySolution = useCallback(() => {
    if (!challenge?.solutionCode) return;
    navigator.clipboard.writeText(challenge.solutionCode).then(() => {
      setCopiedSolution(true);
      setTimeout(() => setCopiedSolution(false), 2000);
    });
  }, [challenge?.solutionCode]);

  const runTests = useCallback(() => {
    if (!challenge) return;
    setRunning(true);
    setTestResult(null);
    setOutput(`${t("tests.running")}\n`);
    // Auto-expand output when running
    setOutputExpanded(true);
    // Auto-hide solution diff when running tests
    if (showSolution) setShowSolution(false);

    timerRef.current = setTimeout(() => {
      const msgs: TestMessages = {
        noImplementation: t("tests.noImplementation"),
        implementationDetected: t("tests.implementationDetected"),
        allPassed: t("tests.allPassed"),
        passCount: (count: number) => t("tests.passCount", { count }),
        failCount: (count: number) => t("tests.failCount", { count }),
        pass: t("tests.pass"),
        fail: t("tests.fail"),
      };
      const { passed, output: testOutput, results } = runPatternTests(
        code, challenge.testCode, challenge.solutionCode, msgs
      );
      setTestResult(passed ? "pass" : "fail");
      setTestResults(results);
      setOutput(testOutput);
      setRunning(false);

      if (passed && standalone && !xpAwardedRef.current) {
        const xpAmount = challenge.xpReward ?? XP_BY_DIFFICULTY[challenge.difficulty] ?? 25;
        addBonusXp(xpAmount, "challenge_complete");
        recordActivity();
        showXPToast(xpAmount);
        xpAwardedRef.current = true;
        addNotification({
          type: "xp_earned",
          title: t("xpEarned"),
          message: `+${xpAmount} XP`,
        });
        import("@/lib/analytics/events").then(({ trackChallengeComplete }) => {
          trackChallengeComplete(challenge._id, challenge.difficulty);
        }).catch(() => { });
        void triggerAchievement("challenge_complete", { isFirstAttempt: true });
      }
    }, 400);
  }, [challenge, code, standalone, showSolution, t, addBonusXp, recordActivity, addNotification, triggerAchievement]);

  const reset = useCallback(() => {
    if (!challenge) return;
    setCode(challenge.starterCode);
    setOutput("");
    setTestResult(null);
    setTestResults([]);
    setShowSolution(false);
    setRevealedHints(0);
  }, [challenge]);

  useKeyboardShortcuts([
    {
      key: "Enter",
      ctrl: true,
      description: "Run code",
      handler: () => { if (!running && challenge) runTests(); },
      skipWhenTyping: false,
    },
    {
      key: "s",
      ctrl: true,
      description: "Save progress",
      handler: () => { /* auto-saved */ },
      skipWhenTyping: false,
    },
  ]);

  if (loadingChallenge) {
    return (
      <div className="flex h-full items-center justify-center" role="status" aria-label={tc("loading")}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t("notFound")}</p>
      </div>
    );
  }

  const difficultyLabel = (["", t("difficulty.beginner"), t("difficulty.intermediate"), t("difficulty.advanced")] as const)[
    challenge.difficulty
  ];
  const monacoLang = challenge.language === "ts" ? "typescript" : challenge.language === "json" ? "json" : "rust";
  const totalHints = (challenge.hints ?? []).length;

  const handleEditorDidMount = (editor: unknown, monaco: {
    languages: {
      registerCompletionItemProvider: (lang: string, provider: {
        provideCompletionItems: (model: unknown, position: { lineNumber: number; column: number }) => { suggestions: unknown[] };
      }) => void;
      CompletionItemKind: { Keyword: number };
    };
  }) => {
    if (challenge.language === "rust") {
      monaco.languages.registerCompletionItemProvider("rust", {
        provideCompletionItems: (_model: unknown, position: { lineNumber: number; column: number }) => {
          const suggestions = [
            "pub fn", "pub struct", "use anchor_lang::prelude::*",
            "Account", "Program", "Signer", "SystemProgram",
            "msg!", "require!", "err!", "Ok(())",
            "ctx.accounts", "ctx.program_id", "ctx.bumps",
            "#[derive(Accounts)]", "#[account]", "#[program]",
            "declare_id!", "Pubkey", "Clock", "Rent",
          ].map((label) => ({
            label,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: label,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column,
              endColumn: position.column,
            },
          }));
          return { suggestions };
        },
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* ── Toolbar ── */}
      <div className="relative shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="flex items-center gap-2 px-4 py-2">
          {/* Challenge title + badges — compact */}
          <div className="hidden lg:flex items-center gap-2 mr-3 pr-3 border-r border-border/30">
            <span className="text-sm font-semibold truncate max-w-[200px]">{challenge.title}</span>
            <Badge className="text-[10px] font-mono border-primary/30 bg-primary/5 text-primary" variant="outline">
              {challenge.language.toUpperCase()}
            </Badge>
            {difficultyLabel && (
              <Badge className={`text-[10px] ${challenge.difficulty === 1 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : challenge.difficulty === 2 ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-red-500/10 text-red-500 border-red-500/20"
                } border`}>
                {difficultyLabel}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 text-[10px] border-yellow-500/30 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400">
              <Sparkles className="h-2.5 w-2.5" />
              {challenge.xpReward ?? XP_BY_DIFFICULTY[challenge.difficulty] ?? 25} XP
            </Badge>
          </div>

          {/* Run tests — with inline keyboard shortcut */}
          <Button
            onClick={runTests}
            size="sm"
            className="gap-1.5 shadow-sm group"
            disabled={running}
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Running…" : t("runTests")}
            {!running && (
              <kbd className="hidden sm:inline-flex ml-1 h-4 items-center rounded border border-border/50 bg-muted/60 px-1 font-mono text-[9px] text-muted-foreground group-hover:border-primary/30">
                ⌘↵
              </kbd>
            )}
          </Button>

          <Button onClick={reset} variant="outline" size="sm" className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            {t("reset")}
          </Button>

          {/* Solution toggle — switches editor to side-by-side diff view */}
          <Button
            variant={showSolution ? "default" : "ghost"}
            size="sm"
            className={`gap-1.5 transition-all ${showSolution ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20" : ""}`}
            onClick={() => setShowSolution(!showSolution)}
          >
            {showSolution ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hide Solution to Edit</span>
                <span className="sm:hidden">Hide</span>
              </>
            ) : (
              <>
                <GitCompareArrows className="h-3.5 w-3.5" />
                {t("showSolution")}
              </>
            )}
          </Button>

          <div className="flex-1" />

          {/* Animated status badge */}
          {testResult === "pass" && (
            <Badge className="gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-in fade-in-0 zoom-in-95 duration-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("allTestsPassed")}
            </Badge>
          )}
          {testResult === "fail" && (
            <Badge className="gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 animate-in fade-in-0 slide-in-from-right-2 duration-300">
              <XCircle className="h-3.5 w-3.5" />
              {t("testsFailing")}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Editor Area — toggles between normal editor and diff view ── */}
      <div className="flex-1 min-h-[200px] relative">
        {showSolution && (
          <div className="absolute top-2 left-0 right-0 z-10 flex items-center justify-center pointer-events-none animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-primary/20 bg-background/90 backdrop-blur-sm px-4 py-1.5 shadow-lg">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3 w-3 text-primary" />
                Your Code
              </span>
              <span className="text-[10px] text-muted-foreground/40">←  diff  →</span>
              <span className="text-xs font-medium text-emerald-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Solution
              </span>
              <div className="w-px h-3 bg-border/40" />
              <button
                onClick={copySolution}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedSolution ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copiedSolution ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {showSolution ? (
          <MonacoDiffEditor
            height="100%"
            language={monacoLang}
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            original={code}
            modified={challenge.solutionCode}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              padding: { top: 40, bottom: 16 },
              scrollBeyondLastLine: false,
              readOnly: true,
              renderSideBySide: true,
              originalEditable: false,
              renderOverviewRuler: false,
              diffWordWrap: "on" as const,
              ariaLabel: "Solution diff view",
            }}
          />
        ) : (
          <MonacoEditor
            height="100%"
            language={monacoLang}
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            value={code}
            onChange={(v) => setCode(v ?? "")}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              tabSize: 2,
              ariaLabel: t("codeEditorLabel"),
              suggestOnTriggerCharacters: true,
              quickSuggestions: { other: true, strings: true, comments: false },
              acceptSuggestionOnEnter: "on" as const,
              wordBasedSuggestions: "currentDocument" as const,
              parameterHints: { enabled: true },
            }}
          />
        )}
      </div>

      {/* ── Bottom Panel: Test Results + Output + Info Card ── */}
      <div className="shrink-0 border-t border-border/40">
        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="border-b border-border/30 px-4 py-2.5 bg-muted/10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{t("testCases")}</p>
            <div className="flex flex-wrap gap-1.5">
              {testResults.map((result, i) => (
                <div
                  key={i}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-mono ${result.passed
                    ? "bg-emerald-500/5 text-emerald-500 border border-emerald-500/15"
                    : "bg-red-500/5 text-red-400 border border-red-500/15"
                    }`}
                >
                  {result.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  <span className="truncate max-w-[180px]">{result.pattern}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Output Console */}
        {output && (
          <div className={`border-b transition-colors duration-300 ${testResult === "pass" ? "border-emerald-500/30" : testResult === "fail" ? "border-red-500/30" : "border-border/30"
            }`}>
            <button
              onClick={() => setOutputExpanded(!outputExpanded)}
              className="flex w-full items-center gap-2 px-4 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Terminal className={`h-3 w-3 transition-colors ${testResult === "pass" ? "text-emerald-500" : testResult === "fail" ? "text-red-400" : ""
                }`} />
              Output
              {testResult && (
                <span className={`ml-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full ${testResult === "pass" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-400"
                  }`}>
                  {testResult === "pass" ? "PASS" : "FAIL"}
                </span>
              )}
              <ChevronDown className={`h-3 w-3 ml-auto transition-transform duration-200 ${outputExpanded ? "rotate-180" : ""}`} />
            </button>
            {outputExpanded && (
              <div aria-live="assertive" className="max-h-32 overflow-y-auto px-4 pb-2 bg-background/50">
                <pre className={`font-mono text-xs leading-relaxed ${testResult === "pass" ? "text-emerald-600 dark:text-emerald-400"
                    : testResult === "fail" ? "text-red-600 dark:text-red-400"
                      : "text-foreground/80"
                  }`}>
                  {output}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ── Info Card: Challenge Details + Progressive Hints ── */}
        <div className="bg-gradient-to-t from-muted/20 to-transparent">
          <button
            onClick={() => setInfoCardExpanded(!infoCardExpanded)}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted/20 transition-colors"
          >
            {/* Mobile title (hidden on desktop where title is in toolbar) */}
            <span className="lg:hidden font-semibold truncate">{challenge.title}</span>
            <span className="hidden lg:inline text-muted-foreground text-xs">Challenge Details</span>

            {/* Mobile badges */}
            <div className="lg:hidden flex items-center gap-1.5 ml-auto mr-2">
              <Badge className="text-[9px] font-mono" variant="outline">{challenge.language.toUpperCase()}</Badge>
              <Badge variant="outline" className="gap-0.5 text-[9px] border-yellow-500/30 text-yellow-500">
                <Sparkles className="h-2 w-2" />{challenge.xpReward ?? XP_BY_DIFFICULTY[challenge.difficulty] ?? 25}
              </Badge>
            </div>

            {/* Hint progress indicator */}
            {totalHints > 0 && (
              <span className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground ml-auto mr-2">
                <Lightbulb className="h-3 w-3 text-amber-500" />
                {revealedHints}/{totalHints}
              </span>
            )}
            <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${infoCardExpanded ? "" : "rotate-180"}`} />
          </button>

          {infoCardExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {/* ── Progressive Hints ── */}
              {totalHints > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-medium">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      {t("hints.title")}
                      <span className="text-muted-foreground">({revealedHints}/{totalHints})</span>
                    </span>
                    {revealedHints < totalHints && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                        onClick={() => setRevealedHints((r) => Math.min(r + 1, totalHints))}
                      >
                        <Unlock className="h-3 w-3" />
                        Reveal Hint {revealedHints + 1}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Hint progress bar */}
                  <div className="flex gap-1">
                    {(challenge.hints ?? []).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < revealedHints ? "bg-amber-500" : "bg-border/50"
                          }`}
                      />
                    ))}
                  </div>

                  {/* Revealed hints */}
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {(challenge.hints ?? []).map((hint, i) => (
                      <div
                        key={i}
                        className={`relative rounded-lg border p-3 text-sm transition-all duration-300 ${i < revealedHints
                          ? "border-amber-500/20 bg-amber-500/5 opacity-100 translate-y-0"
                          : "border-border/20 bg-muted/20 opacity-40 pointer-events-none"
                          }`}
                      >
                        <div className="flex gap-2.5">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${i < revealedHints
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-border/40 text-muted-foreground"
                            }`}>
                            {i < revealedHints ? i + 1 : <Lock className="h-2.5 w-2.5" />}
                          </span>
                          <span className={`leading-relaxed ${i < revealedHints ? "text-foreground/90" : "blur-[3px] select-none"}`}>
                            {i < revealedHints ? hint : "This hint is locked. Click Reveal to unlock."}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
