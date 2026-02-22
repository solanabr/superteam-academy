"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Play,
  Lightbulb,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  Flame,
  Clock,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDailyChallenge,
  useCompleteDailyChallenge,
} from "@/lib/hooks/use-service";
import {
  PRACTICE_CATEGORIES,
  PRACTICE_DIFFICULTY_CONFIG,
  DAILY_STREAK_MILESTONES,
} from "@/types/practice";
import { highlight } from "@/lib/syntax-highlight";
import { toast } from "sonner";
import type { Challenge } from "@/types/course";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] rounded-lg" />,
  },
);

function getTimeUntilNextChallenge(): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const nextMidnight = new Date(brt);
  nextMidnight.setUTCHours(24, 0, 0, 0);
  const diff = nextMidnight.getTime() - brt.getTime();
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function DailyChallengePage() {
  const t = useTranslations("dailyChallenge");
  const tl = useTranslations("lesson");
  const tc = useTranslations("common");

  const { data: challenge, isLoading } = useDailyChallenge();
  const completeMutation = useCompleteDailyChallenge();

  const [code, setCode] = useState("");
  const [codeInitialized, setCodeInitialized] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [testResults, setTestResults] = useState<
    { name: string; passed: boolean; message?: string }[] | null
  >(null);
  const [aiLoading, setAiLoading] = useState<"improve" | "autofill" | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(getTimeUntilNextChallenge);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilNextChallenge());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (challenge && !codeInitialized) {
      setCode(challenge.starterCode);
      setCodeInitialized(true);
    }
  }, [challenge, codeInitialized]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{t("unavailable")}</h1>
        <Button asChild className="mt-4">
          <Link href="/practice">{t("backToPractice")}</Link>
        </Button>
      </div>
    );
  }

  const diffConfig = PRACTICE_DIFFICULTY_CONFIG[challenge.difficulty];
  const catConfig = PRACTICE_CATEGORIES[challenge.category];
  const isCompleted = challenge.completed;
  const allTestsPassed =
    testResults !== null &&
    testResults.length > 0 &&
    testResults.every((r) => r.passed);

  const handleRunTests = () => {
    if (!challenge) return;
    const results = runDailyChallengeTests(code, {
      language: challenge.language,
      prompt: challenge.description,
      starterCode: challenge.starterCode,
      solution: challenge.solution,
      testCases: challenge.testCases.map((tc) => ({
        id: tc.id,
        name: tc.name,
        input: tc.input,
        expectedOutput: tc.expected,
      })),
      hints: challenge.hints,
    });
    setTestResults(results);
    if (results.every((r) => r.passed)) {
      toast.success(t("allTestsPassed"));
    } else {
      const failed = results.filter((r) => !r.passed).length;
      toast.error(t("testsFailed", { count: failed }));
    }
  };

  const handleComplete = () => {
    if (!allTestsPassed) {
      toast.error(t("runTestsFirst"));
      return;
    }
    completeMutation.mutate(undefined, {
      onSuccess: (data) => {
        const sig = data?.txSignature;
        if (sig) {
          toast.success(t("xpEarned", { amount: challenge.xpReward }), {
            description: `Tx: ${sig.slice(0, 8)}...${sig.slice(-8)}`,
            action: {
              label: tc("view"),
              onClick: () =>
                window.open(
                  `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
                  "_blank",
                ),
            },
          });
        } else {
          toast.success(t("xpEarned", { amount: challenge.xpReward }));
        }
      },
      onError: () => toast.error(t("failedToComplete")),
    });
  };

  const handleAICode = async (mode: "improve" | "autofill") => {
    if (!challenge || aiLoading) return;
    setAiLoading(mode);
    try {
      const res = await fetch("/api/ai-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: challenge.language,
          prompt: challenge.description,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setCode(data.code);
      toast.success(tl("codeImprovedByAI"));
    } catch {
      toast.error(tl("aiUnavailable"));
    } finally {
      setAiLoading(null);
    }
  };

  const streakCurrent = challenge.dailyStreak?.current ?? 0;
  const nextMilestone =
    DAILY_STREAK_MILESTONES.find((m) => m > streakCurrent) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("backToPractice")}
        </Link>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <>
              <Badge className="bg-solana-green text-white dark:text-black">
                {t("completed")}
              </Badge>
              {challenge.txHash && (
                <a
                  href={`https://explorer.solana.com/tx/${challenge.txHash}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-solana-purple hover:underline"
                >
                  Tx: {challenge.txHash.slice(0, 4)}...
                  {challenge.txHash.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </>
          )}
          <Badge
            variant="outline"
            style={{ borderColor: diffConfig.color, color: diffConfig.color }}
          >
            {diffConfig.label}
          </Badge>
          <Badge
            variant="outline"
            style={{ borderColor: catConfig.color, color: catConfig.color }}
          >
            {catConfig.label}
          </Badge>
          <Badge variant="xp">{challenge.xpReward} XP</Badge>
        </div>
      </div>

      {/* Title + stats row */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-xp-gold" />
            <span className="text-xs font-bold uppercase tracking-wider text-xp-gold">
              {t("title")}
            </span>
            <span className="text-xs text-muted-foreground">
              — {challenge.date}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{challenge.title}</h1>
          <p className="text-muted-foreground mt-1">{challenge.description}</p>
        </div>

        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Daily streak */}
          <div className="flex items-center gap-1.5">
            <Flame className="h-5 w-5 text-streak-orange" />
            <div className="text-center">
              <p className="text-xl font-bold leading-none">{streakCurrent}</p>
              <p className="text-[10px] text-muted-foreground">
                {t("dayStreak")}
              </p>
            </div>
          </div>
          {nextMilestone && (
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {t("nextMilestone")}:{" "}
                <span className="text-foreground font-bold">
                  {nextMilestone}d
                </span>
              </p>
            </div>
          )}
          {/* Countdown */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-mono font-bold leading-none tabular-nums">
                {pad(countdown.hours)}:{pad(countdown.minutes)}:
                {pad(countdown.seconds)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t("nextChallenge")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Already completed state */}
      {isCompleted && (
        <Card className="mb-6 border-solana-green/30 bg-solana-green/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-solana-green" />
            <div>
              <p className="font-medium text-solana-green">
                {t("alreadySolved")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("comeBackTomorrow")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Challenge prompt */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tl("challenge")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{challenge.description}</p>
            </CardContent>
          </Card>

          {showHints && challenge.hints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{tl("hints")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {challenge.hints.map((hint, i) => (
                    <li key={i} className="flex gap-2">
                      <Lightbulb className="h-4 w-4 text-xp-gold shrink-0 mt-0.5" />
                      {hint}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{tl("testResults")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((r, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 text-sm">
                        {r.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-solana-green" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-destructive" />
                        )}
                        <span
                          className={
                            r.passed ? "text-solana-green" : "text-destructive"
                          }
                        >
                          {r.name}
                        </span>
                      </div>
                      {!r.passed && r.message && (
                        <p className="ml-6 mt-1 text-xs text-muted-foreground">
                          {r.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHints(!showHints)}
            >
              <Lightbulb className="h-4 w-4" />{" "}
              {showHints ? tl("hideHints") : tl("showHints")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSolution(!showSolution)}
            >
              {showSolution ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showSolution ? tl("hideSolution") : tl("showSolution")}
            </Button>
          </div>

          {showSolution && (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-2 bg-[#16161e]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7f849c]">
                  Solution — {challenge.language}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[#7f849c] hover:text-white hover:bg-white/10"
                  onClick={() => {
                    navigator.clipboard.writeText(challenge.solution);
                    setCopied(true);
                    toast.success(tl("solutionCopied"));
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span className="text-xs ml-1">
                    {copied ? tc("copied") : tc("copy")}
                  </span>
                </Button>
              </div>
              <div className="bg-[#1e1e2e] p-4 overflow-x-auto">
                <pre className="m-0">
                  <code
                    className="font-mono text-[13px] leading-relaxed text-[#cdd6f4]"
                    dangerouslySetInnerHTML={{
                      __html: highlight(challenge.solution, challenge.language),
                    }}
                  />
                </pre>
              </div>
            </Card>
          )}
        </div>

        {/* Right: Code editor */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-sm font-medium capitalize">
                {challenge.language}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAICode("improve")}
                  disabled={!!aiLoading || isCompleted}
                  className="text-solana-purple border-solana-purple/30 hover:bg-solana-purple/10"
                >
                  {aiLoading === "improve" ? (
                    <span className="flex gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-solana-purple animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-solana-purple animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-solana-purple animate-bounce [animation-delay:300ms]" />
                    </span>
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {tl("improveWithAI")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleRunTests}
                  disabled={isCompleted}
                >
                  <Play className="h-4 w-4" /> {tl("runTests")}
                </Button>
              </div>
            </div>
            <div className="h-[400px]">
              <MonacoEditor
                height="100%"
                language={challenge.language === "rust" ? "rust" : "typescript"}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v ?? "")}
                beforeMount={(monaco) => {
                  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
                    {
                      noSemanticValidation: true,
                      noSyntaxValidation: false,
                    },
                  );
                  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
                    {
                      target: monaco.languages.typescript.ScriptTarget.ESNext,
                      module: monaco.languages.typescript.ModuleKind.ESNext,
                      moduleResolution:
                        monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                      allowNonTsExtensions: true,
                      noEmit: true,
                    },
                  );
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 16 },
                  readOnly: isCompleted,
                }}
              />
            </div>
          </Card>

          {!isCompleted && (
            <Button
              onClick={handleComplete}
              size="sm"
              variant={allTestsPassed ? "solana" : "outline"}
              disabled={completeMutation.isPending || !allTestsPassed}
            >
              <CheckCircle2 className="h-4 w-4" />
              {completeMutation.isPending
                ? tl("completing")
                : allTestsPassed
                  ? tl("markComplete")
                  : tl("passAllTestsFirst")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function runDailyChallengeTests(
  code: string,
  challenge: Challenge,
): { name: string; passed: boolean; message?: string }[] {
  const clean = code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const hasPlaceholder = /\/\/\s*your code here/i.test(code);

  const solutionPatterns = extractPatterns(challenge.solution);

  return challenge.testCases.map((tc) => {
    if (
      hasPlaceholder &&
      clean.trim() === challenge.starterCode.replace(/\/\/.*$/gm, "").trim()
    ) {
      return {
        name: tc.name,
        passed: false,
        message: "Replace the placeholder comments with your implementation",
      };
    }

    const results = solutionPatterns.map((p) => ({
      pattern: p.label,
      found: p.regex.test(clean),
    }));

    const matchCount = results.filter((r) => r.found).length;
    const totalPatterns = results.length;

    if (matchCount === totalPatterns) {
      return { name: tc.name, passed: true };
    }

    const missing = results.filter((r) => !r.found).map((r) => r.pattern);
    return {
      name: tc.name,
      passed: false,
      message: `Missing: ${missing.join(", ")}`,
    };
  });
}

function extractPatterns(solution: string): { label: string; regex: RegExp }[] {
  const patterns: { label: string; regex: RegExp }[] = [];
  const clean = solution
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  if (/Keypair\.generate\(\)/.test(clean)) {
    patterns.push({
      label: "Keypair.generate()",
      regex: /Keypair\.generate\(\)/,
    });
  }
  if (/\.toBase58\(\)/.test(clean)) {
    patterns.push({ label: ".toBase58()", regex: /\.toBase58\(\)/ });
  }
  if (/\.secretKey/.test(clean)) {
    patterns.push({ label: ".secretKey", regex: /\.secretKey/ });
  }
  if (/new\s+PublicKey\(/.test(clean)) {
    patterns.push({ label: "new PublicKey()", regex: /new\s+PublicKey\(/ });
  }
  if (/SystemProgram\.transfer\(/.test(clean)) {
    patterns.push({
      label: "SystemProgram.transfer()",
      regex: /SystemProgram\.transfer\(/,
    });
  }
  if (/sendAndConfirmTransaction\(/.test(clean)) {
    patterns.push({
      label: "sendAndConfirmTransaction()",
      regex: /sendAndConfirmTransaction\(/,
    });
  }
  if (/new\s+Transaction\(\)\.add\(/.test(clean)) {
    patterns.push({
      label: "new Transaction().add()",
      regex: /new\s+Transaction\(\)\.add\(/,
    });
  }
  if (/findProgramAddressSync\(/.test(clean)) {
    patterns.push({
      label: "findProgramAddressSync()",
      regex: /findProgramAddressSync\(/,
    });
  }
  if (/Buffer\.from\(/.test(clean)) {
    patterns.push({ label: "Buffer.from()", regex: /Buffer\.from\(/ });
  }
  if (/\.toBuffer\(\)/.test(clean)) {
    patterns.push({ label: ".toBuffer()", regex: /\.toBuffer\(\)/ });
  }
  if (/return\s+[^;]+/.test(clean)) {
    patterns.push({ label: "return statement", regex: /return\s+[^;]+/ });
  }

  // Rust patterns
  for (const m of clean.matchAll(/struct\s+(\w+)/g)) {
    patterns.push({
      label: `struct ${m[1]}`,
      regex: new RegExp(`struct\\s+${m[1]}[^{]*\\{`),
    });
  }
  for (const m of clean.matchAll(/enum\s+(\w+)/g)) {
    patterns.push({
      label: `enum ${m[1]}`,
      regex: new RegExp(`enum\\s+${m[1]}[^{]*\\{`),
    });
  }
  for (const m of clean.matchAll(/impl\s+(\w+)/g)) {
    patterns.push({
      label: `impl ${m[1]}`,
      regex: new RegExp(`impl\\s+${m[1]}`),
    });
  }
  for (const m of clean.matchAll(/(?:pub\s+)?fn\s+(\w+)/g)) {
    patterns.push({
      label: `fn ${m[1]}`,
      regex: new RegExp(`fn\\s+${m[1]}\\s*(?:<[^>]*>)?\\s*\\(`),
    });
  }
  for (const m of clean.matchAll(/#\[derive\(([^)]+)\)\]/g)) {
    patterns.push({
      label: `#[derive(${m[1]})]`,
      regex: new RegExp(`#\\[derive\\([^)]*${m[1].split(",")[0].trim()}`),
    });
  }
  for (const m of clean.matchAll(/pub\s+(\w+)\s*:\s*(\w+)/g)) {
    patterns.push({
      label: `${m[1]}: ${m[2]}`,
      regex: new RegExp(`${m[1]}\\s*:\\s*${m[2]}`),
    });
  }
  for (const m of clean.matchAll(/(\w+)::(\w+)\(/g)) {
    if (!["use", "super", "Self", "self"].includes(m[1])) {
      patterns.push({
        label: `${m[1]}::${m[2]}()`,
        regex: new RegExp(`${m[1]}::${m[2]}\\(`),
      });
    }
  }

  if (patterns.length === 0) {
    patterns.push({
      label: "implementation",
      regex: /(?:return|=>|=)\s*[^\/\n]+/,
    });
  }

  return patterns;
}
