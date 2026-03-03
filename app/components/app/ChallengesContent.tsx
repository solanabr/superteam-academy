"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import type { editor as MonacoEditor } from "monaco-editor";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Play,
  RotateCcw,
  Target,
  Trophy,
  AlertCircle,
  Lightbulb,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { useCompleteLesson, useEnroll, useEnrollment } from "@/hooks";
import { useRequireWallet } from "@/hooks/useRequireWallet";
import { getLessonFlagsFromEnrollment, isLessonComplete } from "@/lib/lesson-bitmap";
import {
  DAILY_CHALLENGE_COURSE_ID,
  getDailyChallengeLessonIndex,
  getTimeUntilNextUtcDayMs,
  getUtcDateKey,
  type DailyChallenge,
  type DailyChallengeResponse,
} from "@/lib/services/daily-challenge";
import { cn } from "@/lib/utils";

interface DailyChallengeSession {
  startedAt: number;
  expiresAt: number;
  submitted: boolean;
  submittedAt?: number;
  txSignature?: string;
}

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const SESSION_STORAGE_PREFIX = "st-daily-challenge-session-v1";

function stripComments(value: string): string {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .trim();
}

function normalizeForComparison(value: string): string {
  return stripComments(value).replace(/\s+/g, " ").trim();
}

function parseRules(expected: string): string[] {
  return expected
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);
}

function matchesRule(code: string, rawRule: string): boolean {
  const rule = rawRule.trim();
  if (!rule) return true;

  const regexPrefixed = rule.startsWith("regex:");
  if (regexPrefixed) {
    const source = rule.slice("regex:".length).trim();
    try {
      const slashMatch = source.match(/^\/(.*)\/([dgimsuy]*)$/);
      if (slashMatch) {
        const [, pattern, flags] = slashMatch;
        return new RegExp(pattern, flags).test(code);
      }
      return new RegExp(source, "m").test(code);
    } catch {
      return code.includes(source);
    }
  }

  const containsPrefixed = rule.startsWith("contains:")
    ? rule.slice("contains:".length).trim()
    : rule;
  return code.includes(containsPrefixed);
}

function runDailyChallengeTests(code: string, challenge: DailyChallenge): TestResult[] {
  const normalizedCode = stripComments(code);
  const starterBaseline = normalizeForComparison(challenge.starterCode);
  const submissionBaseline = normalizeForComparison(code);

  if (!submissionBaseline || submissionBaseline === starterBaseline) {
    return challenge.testCases.map((testCase) => ({
      name: testCase.name,
      passed: false,
      message: "Replace the starter code before running tests.",
    }));
  }

  return challenge.testCases.map((testCase) => {
    const rules = parseRules(testCase.expected);
    if (rules.length === 0) {
      return {
        name: testCase.name,
        passed: false,
        message: "No rules configured for this test case in CMS.",
      };
    }

    const failedRules = rules.filter((rule) => !matchesRule(normalizedCode, rule));
    if (failedRules.length === 0) {
      return { name: testCase.name, passed: true };
    }

    return {
      name: testCase.name,
      passed: false,
      message: `Missing checks: ${failedRules.slice(0, 3).join(" | ")}`,
    };
  });
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function formatUtcDateTime(timestamp: number): string {
  return `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(timestamp))} UTC`;
}

function formatMarkerSeverity(marker: MonacoEditor.IMarker): "error" | "warning" | "info" {
  if (marker.severity === 8) return "error";
  if (marker.severity === 4) return "warning";
  return "info";
}

function buildSessionKey(wallet: string | null, date: string): string {
  return `${SESSION_STORAGE_PREFIX}:${wallet ?? "guest"}:${date}`;
}

function readSession(key: string): DailyChallengeSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<DailyChallengeSession>;
    if (
      typeof parsed.startedAt !== "number" ||
      typeof parsed.expiresAt !== "number" ||
      typeof parsed.submitted !== "boolean"
    ) {
      return null;
    }

    return {
      startedAt: parsed.startedAt,
      expiresAt: parsed.expiresAt,
      submitted: parsed.submitted,
      submittedAt: typeof parsed.submittedAt === "number" ? parsed.submittedAt : undefined,
      txSignature: typeof parsed.txSignature === "string" ? parsed.txSignature : undefined,
    };
  } catch {
    return null;
  }
}

function persistSession(key: string, session: DailyChallengeSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(session));
}

async function fetchDailyChallenge(): Promise<DailyChallenge> {
  const response = await fetch(`/api/challenges/daily?date=${getUtcDateKey()}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as DailyChallengeResponse & { error?: string };
  if (!response.ok || !payload.challenge) {
    throw new Error(payload.error ?? "Could not load daily challenge.");
  }

  return payload.challenge;
}

export function ChallengesContent() {
  const { publicKey } = useWallet();
  const { requireWallet } = useRequireWallet();
  const walletAddress = publicKey?.toBase58() ?? null;

  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [editorMarkers, setEditorMarkers] = useState<MonacoEditor.IMarker[]>([]);
  const [session, setSession] = useState<DailyChallengeSession | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const challengeQuery = useQuery({
    queryKey: ["dailyChallenge", getUtcDateKey()],
    queryFn: fetchDailyChallenge,
    staleTime: 30_000,
  });

  const challenge = challengeQuery.data;
  const challengeDate = challenge?.date ?? getUtcDateKey();
  const sessionKey = useMemo(
    () => buildSessionKey(walletAddress, challengeDate),
    [walletAddress, challengeDate]
  );

  const lessonIndex = useMemo(
    () => (challenge ? getDailyChallengeLessonIndex(challenge.date) : 0),
    [challenge]
  );

  const courseId = DAILY_CHALLENGE_COURSE_ID || null;
  const { data: enrollment, isLoading: isEnrollmentLoading } = useEnrollment(courseId);
  const enroll = useEnroll();
  const completeLesson = useCompleteLesson();

  const lessonFlags = useMemo(
    () => getLessonFlagsFromEnrollment(enrollment ?? undefined),
    [enrollment]
  );

  const completedOnChain = useMemo(() => {
    if (!challenge || !courseId || lessonFlags.length === 0) return false;
    return isLessonComplete(lessonFlags, lessonIndex);
  }, [challenge, courseId, lessonFlags, lessonIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!challenge) return;
    setCode(challenge.starterCode);
    setTestResults(null);
    setEditorMarkers([]);
    setShowHints(false);
    setShowSolution(false);
  }, [challenge?.id]);

  useEffect(() => {
    setSession(readSession(sessionKey));
  }, [sessionKey]);

  useEffect(() => {
    if (!completedOnChain || !challenge) return;

    setSession((current) => {
      if (current?.submitted) return current;
      const next: DailyChallengeSession = {
        startedAt: current?.startedAt ?? Date.now(),
        expiresAt: current?.expiresAt ?? Date.now(),
        submitted: true,
        submittedAt: Date.now(),
        txSignature: current?.txSignature,
      };
      persistSession(sessionKey, next);
      return next;
    });
  }, [completedOnChain, challenge, sessionKey]);

  const writeSession = useCallback(
    (updater: (current: DailyChallengeSession | null) => DailyChallengeSession | null) => {
      setSession((current) => {
        const next = updater(current);
        persistSession(sessionKey, next);
        return next;
      });
    },
    [sessionKey]
  );

  const hasStarted = !!session?.startedAt;
  const isSubmitted = !!session?.submitted || completedOnChain;
  const remainingSeconds = hasStarted
    ? Math.max(0, Math.floor(((session?.expiresAt ?? 0) - nowMs) / 1000))
    : (challenge?.timeLimitMinutes ?? 0) * 60;
  const timerExpired = hasStarted && !isSubmitted && remainingSeconds <= 0;
  const hasEditorIssues = editorMarkers.length > 0;
  const allTestsPassed =
    Array.isArray(testResults) && testResults.length > 0 && testResults.every((result) => result.passed);

  const resetInSeconds = Math.floor(getTimeUntilNextUtcDayMs(new Date(nowMs)) / 1000);
  const attemptStatus = useMemo(() => {
    if (isSubmitted) {
      return {
        tone: "success" as const,
        icon: CheckCircle2,
        title: "Challenge passed for today",
        description: session?.submittedAt
          ? `Submitted at ${formatUtcDateTime(session.submittedAt)}.`
          : "You already submitted this challenge today.",
      };
    }

    if (!hasStarted) {
      return null;
    }

    if (timerExpired) {
      return {
        tone: "destructive" as const,
        icon: AlertCircle,
        title: "Challenge attempted, timer expired",
        description: "You already used today’s attempt. A new attempt unlocks at the next UTC reset.",
      };
    }

    return {
      tone: "warning" as const,
      icon: Clock3,
      title: "Challenge already started",
      description: session?.startedAt
        ? `Started at ${formatUtcDateTime(session.startedAt)}. Continue your attempt before time runs out.`
        : "Continue your current attempt before time runs out.",
    };
  }, [hasStarted, isSubmitted, session?.startedAt, session?.submittedAt, timerExpired]);

  const handleStart = () => {
    if (!challenge || hasStarted || isSubmitted) return;
    const startedAt = Date.now();
    const nextSession: DailyChallengeSession = {
      startedAt,
      expiresAt: startedAt + challenge.timeLimitMinutes * 60_000,
      submitted: false,
    };
    writeSession(() => nextSession);
    toast.success("Challenge timer started.");
  };

  const handleResetCode = () => {
    if (!challenge) return;
    setCode(challenge.starterCode);
    setTestResults(null);
  };

  const handleRunTests = () => {
    if (!challenge) return;
    if (!hasStarted) {
      toast.info("Click Start Challenge to begin the timer first.");
      return;
    }
    if (timerExpired) {
      toast.error("Time is up for today’s attempt.");
      return;
    }

    const results = runDailyChallengeTests(code, challenge);
    setTestResults(results);
    const failures = results.filter((result) => !result.passed).length;

    if (failures === 0) {
      toast.success("All tests passed.");
    } else {
      toast.error(`${failures} test${failures > 1 ? "s" : ""} failed.`);
    }
  };

  const handleSubmit = async () => {
    if (!challenge) return;
    if (isSubmitted) {
      toast.info("You already submitted today’s challenge.");
      return;
    }
    if (!hasStarted) {
      toast.info("Start the challenge before submitting.");
      return;
    }
    if (timerExpired) {
      toast.error("Timer expired. Submit is locked for today.");
      return;
    }
    if (!allTestsPassed) {
      toast.error("Pass all tests before submitting.");
      return;
    }
    if (!requireWallet()) return;
    if (!walletAddress) return;

    setIsSubmitting(true);
    try {
      let txSignature: string | undefined;

      if (courseId) {
        if (isEnrollmentLoading) {
          toast.info("Checking challenge enrollment state. Please retry in a moment.");
          return;
        }

        if (enrollment == null) {
          await enroll.mutateAsync({ courseId });
        }

        txSignature = await completeLesson.mutateAsync({
          courseId,
          learner: walletAddress,
          lessonIndex,
          xpEarned: challenge.xpReward,
        });
      }

      writeSession((current) => {
        const startedAt = current?.startedAt ?? Date.now();
        const expiresAt = current?.expiresAt ?? Date.now();
        return {
          startedAt,
          expiresAt,
          submitted: true,
          submittedAt: Date.now(),
          txSignature: txSignature ?? current?.txSignature,
        };
      });

      if (!courseId) {
        toast.success("Challenge saved locally. Configure DAILY_CHALLENGE_COURSE_ID to award on-chain XP.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submission failed.";
      const alreadyIssued = /already|completed|claimed|6008|6016/i.test(message);

      if (alreadyIssued) {
        writeSession((current) => {
          const startedAt = current?.startedAt ?? Date.now();
          const expiresAt = current?.expiresAt ?? Date.now();
          return {
            startedAt,
            expiresAt,
            submitted: true,
            submittedAt: Date.now(),
            txSignature: current?.txSignature,
          };
        });
        toast.info("Today’s challenge is already completed for this wallet.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (challengeQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 pt-6 sm:pt-8">
        <div className="h-32 animate-pulse rounded-2xl border bg-card" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-[420px] animate-pulse rounded-2xl border bg-card" />
          <div className="h-[420px] animate-pulse rounded-2xl border bg-card" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="mx-auto w-full max-w-3xl pt-8">
        <Card className="rounded-2xl border p-6 sm:p-8 text-center space-y-3">
          <p className="font-game text-3xl">Daily challenge unavailable</p>
          <p className="font-game text-muted-foreground text-lg">
            {challengeQuery.error instanceof Error
              ? challengeQuery.error.message
              : "No published daily challenge found in Sanity."}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" className="font-game" onClick={() => void challengeQuery.refetch()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pt-6 sm:pt-8">
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
              <Target className="size-4 text-yellow-400" />
              <span className="font-game text-yellow-400 text-lg">Daily Challenge</span>
            </div>
            <h1 className="mt-3 font-game text-4xl sm:text-5xl">{challenge.title}</h1>
            <p className="mt-2 max-w-3xl font-game text-muted-foreground text-lg">{challenge.description}</p>
            <p className="mt-2 font-game text-sm text-muted-foreground">
              UTC date: {challenge.date} · One submission per wallet per UTC day
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:max-w-sm">
            <Badge variant="outline" className="font-game text-md px-3 py-1 capitalize">
              {challenge.language}
            </Badge>
            <Badge variant="outline" className="font-game text-md px-3 py-1">
              <Trophy className="mr-1 size-3.5" />
              {challenge.xpReward} XP
            </Badge>
            <Badge variant="outline" className="font-game text-md px-3 py-1">
              <Clock3 className="mr-1 size-3.5" />
              Timer {challenge.timeLimitMinutes}m
            </Badge>
            <Badge variant="outline" className="font-game text-md px-3 py-1">
              Reset in {formatDuration(resetInSeconds)}
            </Badge>
          </div>
        </div>

        {!courseId && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-game text-amber-400">
            XP minting is disabled until `NEXT_PUBLIC_DAILY_CHALLENGE_COURSE_ID` is configured.
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant={hasStarted ? "outline" : "pixel"}
            className="font-game text-md"
            onClick={handleStart}
            disabled={hasStarted || isSubmitted}
          >
            <Play className="size-4" />
            {hasStarted ? "Challenge Started" : "Start Challenge"}
          </Button>

          <Button
            variant="outline"
            className="font-game text-md"
            onClick={handleRunTests}
            disabled={!hasStarted || timerExpired || isSubmitted}
          >
            Run Tests
          </Button>

          <Button
            variant={allTestsPassed && !timerExpired && !isSubmitted ? "pixel" : "outline"}
            className="font-game text-md"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !hasStarted || timerExpired || !allTestsPassed || isSubmitted}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Submit for XP
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="font-game text-md"
            onClick={handleResetCode}
            disabled={!hasStarted || isSubmitted}
          >
            <RotateCcw className="size-4" />
            Reset Code
          </Button>

          <Button
            variant="outline"
            className="font-game text-md"
            onClick={() => setShowHints((value) => !value)}
          >
            <Lightbulb className="size-4" />
            {showHints ? "Hide Hints" : "Show Hints"}
          </Button>

          <Button
            variant="outline"
            className="font-game text-md"
            onClick={() => setShowSolution((value) => !value)}
          >
            {showSolution ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {showSolution ? "Hide Solution" : "Show Solution"}
          </Button>
        </div>

        <div className="mt-4 rounded-xl border bg-muted/20 px-3 py-2">
          <p
            className={cn(
              "font-game text-lg",
              timerExpired && !isSubmitted
                ? "text-destructive"
                : isSubmitted
                  ? "text-green-500"
                  : "text-muted-foreground"
            )}
          >
            {isSubmitted
              ? "Completed for today. New challenge unlocks at next UTC day."
              : !hasStarted
                ? `Timer ready: ${challenge.timeLimitMinutes}m`
                : timerExpired
                  ? "Time is up for today’s attempt."
                  : `Time left: ${formatDuration(remainingSeconds)}`}
          </p>
          {session?.txSignature && (
            <p className="mt-1 font-game text-sm text-muted-foreground break-all">
              Tx: {session.txSignature}
            </p>
          )}
        </div>

        {attemptStatus && (
          <div
            className={cn(
              "mt-3 rounded-xl border px-3 py-2 flex items-start gap-2",
              attemptStatus.tone === "success" && "border-green-500/40 bg-green-500/10",
              attemptStatus.tone === "warning" && "border-amber-500/40 bg-amber-500/10",
              attemptStatus.tone === "destructive" && "border-destructive/40 bg-destructive/10"
            )}
          >
            <attemptStatus.icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                attemptStatus.tone === "success" && "text-green-500",
                attemptStatus.tone === "warning" && "text-amber-400",
                attemptStatus.tone === "destructive" && "text-destructive"
              )}
            />
            <div>
              <p className="font-game text-base leading-tight">{attemptStatus.title}</p>
              <p className="font-game text-xs text-muted-foreground mt-0.5">{attemptStatus.description}</p>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-2xl border p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="font-game text-2xl">Acceptance Tests</h2>
            <p className="font-game text-muted-foreground text-sm mt-1">
              Tests run lightweight checks against your code. Pass all tests within time to submit.
            </p>
          </div>

          <div className="space-y-2">
            {challenge.testCases.map((testCase) => {
              const result = testResults?.find((item) => item.name === testCase.name);
              return (
                <div
                  key={testCase.id}
                  className={cn(
                    "rounded-xl border px-3 py-2",
                    result?.passed
                      ? "border-green-500/40 bg-green-500/10"
                      : result && !result.passed
                        ? "border-destructive/40 bg-destructive/10"
                        : "bg-background"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-game text-lg">{testCase.name}</p>
                    {result?.passed ? (
                      <Badge className="bg-green-500 text-black font-game">Passed</Badge>
                    ) : result && !result.passed ? (
                      <Badge variant="destructive" className="font-game">Failed</Badge>
                    ) : (
                      <Badge variant="outline" className="font-game">Pending</Badge>
                    )}
                  </div>
                  {result?.message && (
                    <p className="mt-1 text-xs font-game text-muted-foreground">{result.message}</p>
                  )}
                </div>
              );
            })}
          </div>

          {showHints && (
            <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
              <p className="font-game text-xl">Hints</p>
              {challenge.hints.length === 0 ? (
                <p className="font-game text-sm text-muted-foreground">No hints configured for this challenge.</p>
              ) : (
                challenge.hints.map((hint, index) => (
                  <p key={`${hint}-${index}`} className="font-game text-sm text-muted-foreground">
                    {index + 1}. {hint}
                  </p>
                ))
              )}
            </div>
          )}

          {showSolution && (
            <div className="rounded-xl border bg-background p-3 space-y-2">
              <p className="font-game text-xl">Reference Solution</p>
              <pre className="max-h-72 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
                <code>{challenge.solutionCode}</code>
              </pre>
            </div>
          )}

          {timerExpired && !isSubmitted && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 text-destructive" />
              <p className="font-game text-sm text-destructive">
                Timer expired for this UTC day. A new challenge opens at reset.
              </p>
            </div>
          )}

          {hasEditorIssues && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3">
              <p className="font-game text-sm text-destructive mb-1">
                Editor issues ({editorMarkers.length})
              </p>
              <div className="space-y-1">
                {editorMarkers.slice(0, 4).map((marker, index) => {
                  const severity = formatMarkerSeverity(marker);
                  return (
                    <p
                      key={`${marker.startLineNumber}-${marker.startColumn}-${index}`}
                      className="font-game text-xs text-muted-foreground"
                    >
                      <span className={severity === "error" ? "text-destructive" : "text-amber-400"}>
                        [{severity.toUpperCase()}]
                      </span>{" "}
                      L{marker.startLineNumber}:C{marker.startColumn} {marker.message}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border overflow-hidden">
          <div className="border-b px-4 py-2 flex items-center justify-between">
            <p className="font-game text-xl capitalize">{challenge.language} Editor</p>
            <Badge variant="outline" className="font-game text-sm">Slot #{lessonIndex}</Badge>
          </div>
          <div className="h-[560px]">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={challenge.language}
              readOnly={!hasStarted || timerExpired || isSubmitted}
              height="560px"
              onValidate={(markers) => {
                setEditorMarkers(
                  markers.filter((marker) => marker.severity === 8 || marker.severity === 4)
                );
              }}
            />
          </div>
        </Card>
      </section>
    </div>
  );
}
