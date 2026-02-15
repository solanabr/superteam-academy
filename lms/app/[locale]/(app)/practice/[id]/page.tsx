"use client";

import { use, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Play, Lightbulb, Eye, EyeOff,
  Sparkles, Loader2, Copy, Check, Code2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePracticeProgress, useCompletePracticeChallenge } from "@/lib/hooks/use-service";
import { PRACTICE_CHALLENGES } from "@/lib/data/practice-challenges";
import { PRACTICE_CATEGORIES, PRACTICE_DIFFICULTY_CONFIG } from "@/types/practice";
import type { Challenge } from "@/types/course";
import { highlight } from "@/lib/syntax-highlight";
import { toast } from "sonner";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] rounded-lg" />,
});

export default function PracticeChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { completed: completedIds, txHashes } = usePracticeProgress();
  const completeMutation = useCompletePracticeChallenge();
  const t = useTranslations("lesson");
  const tp = useTranslations("practice");
  const tc = useTranslations("common");

  const [code, setCode] = useState<string>("");
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean; message?: string }[] | null>(null);
  const [codeInitialized, setCodeInitialized] = useState(false);
  const [aiLoading, setAiLoading] = useState<"improve" | "autofill" | null>(null);
  const [copied, setCopied] = useState(false);

  const { challenge: practiceChallenge, prevChallenge, nextChallenge } = useMemo(() => {
    const idx = PRACTICE_CHALLENGES.findIndex((c) => c.id === id);
    const challenge = PRACTICE_CHALLENGES[idx] ?? null;
    if (challenge && !codeInitialized) {
      setCode(challenge.challenge.starterCode);
      setCodeInitialized(true);
    }
    // Next/prev within same category
    const sameCat = PRACTICE_CHALLENGES.filter((c) => c.category === challenge?.category);
    const catIdx = sameCat.findIndex((c) => c.id === id);
    return {
      challenge,
      prevChallenge: catIdx > 0 ? sameCat[catIdx - 1] : null,
      nextChallenge: catIdx < sameCat.length - 1 ? sameCat[catIdx + 1] : null,
    };
  }, [id, codeInitialized]);

  const isCompleted = completedIds.includes(id);
  const allTestsPassed = testResults !== null && testResults.length > 0 && testResults.every((r) => r.passed);

  const handleComplete = () => {
    if (!allTestsPassed) {
      toast.error(tp("runTestsFirst"));
      return;
    }
    if (!practiceChallenge) return;
    completeMutation.mutate(
      { challengeId: id, xpReward: practiceChallenge.xpReward },
      {
        onSuccess: (data) => {
          const sig = data?.txSignature;
          if (sig) {
            toast.success(t("xpEarned", { amount: practiceChallenge.xpReward }), {
              description: `Tx: ${sig.slice(0, 8)}...${sig.slice(-8)}`,
              action: {
                label: tc("view"),
                onClick: () => window.open(`https://explorer.solana.com/tx/${sig}?cluster=devnet`, "_blank"),
              },
            });
          } else {
            toast.success(t("xpEarned", { amount: practiceChallenge.xpReward }));
          }
        },
        onError: () => toast.error(t("failedToComplete")),
      }
    );
  };

  const handleRunTests = () => {
    if (!practiceChallenge) return;
    const results = runChallengeTests(code, practiceChallenge.challenge);
    setTestResults(results);
    if (results.every((r) => r.passed)) {
      toast.success(tp("allTestsPassed"));
    } else {
      const failed = results.filter((r) => !r.passed).length;
      toast.error(tp("testsFailed", { count: failed }));
    }
  };

  const handleAICode = async (mode: "improve" | "autofill") => {
    if (!practiceChallenge || aiLoading) return;
    setAiLoading(mode);
    try {
      const res = await fetch("/api/ai-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: practiceChallenge.challenge.language,
          prompt: practiceChallenge.challenge.prompt,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setCode(data.code);
      toast.success(t("codeImprovedByAI"));
    } catch {
      toast.error(t("aiUnavailable"));
    } finally {
      setAiLoading(null);
    }
  };

  if (!practiceChallenge) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{tp("challengeNotFound")}</h1>
        <Button asChild className="mt-4"><Link href="/practice">{tp("backToPractice")}</Link></Button>
      </div>
    );
  }

  const ch = practiceChallenge;
  const diffConfig = PRACTICE_DIFFICULTY_CONFIG[ch.difficulty];
  const catConfig = PRACTICE_CATEGORIES[ch.category];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/practice" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {tp("title")}
        </Link>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <>
              <Badge className="bg-solana-green text-white dark:text-black">{tc("solved")}</Badge>
              {txHashes[id] && (
                <a
                  href={`https://explorer.solana.com/tx/${txHashes[id]}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-solana-purple hover:underline"
                >
                  Tx: {txHashes[id].slice(0, 4)}...{txHashes[id].slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </>
          )}
          <Badge variant="outline" style={{ borderColor: diffConfig.color, color: diffConfig.color }}>
            {diffConfig.label}
          </Badge>
          <Badge variant="outline" style={{ borderColor: catConfig.color, color: catConfig.color }}>
            {catConfig.label}
          </Badge>
          <Badge variant="xp">{ch.xpReward} XP</Badge>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">{ch.title}</h1>
      <p className="text-muted-foreground mb-6">{ch.description}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Challenge prompt */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("challenge")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{ch.challenge.prompt}</p>
            </CardContent>
          </Card>

          {showHints && (
            <Card>
              <CardHeader><CardTitle className="text-base">{t("hints")}</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {ch.challenge.hints.map((hint, i) => (
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
              <CardHeader><CardTitle className="text-base">{t("testResults")}</CardTitle></CardHeader>
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
                        <span className={r.passed ? "text-solana-green" : "text-destructive"}>{r.name}</span>
                      </div>
                      {!r.passed && r.message && (
                        <p className="ml-6 mt-1 text-xs text-muted-foreground">{r.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHints(!showHints)}>
              <Lightbulb className="h-4 w-4" /> {showHints ? t("hideHints") : t("showHints")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSolution(!showSolution)}>
              {showSolution ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSolution ? t("hideSolution") : t("showSolution")}
            </Button>
          </div>

          {showSolution && (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-2 bg-[#16161e]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7f849c]">Solution — {ch.challenge.language}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[#7f849c] hover:text-white hover:bg-white/10"
                  onClick={() => {
                    navigator.clipboard.writeText(ch.challenge.solution);
                    setCopied(true);
                    toast.success(t("solutionCopied"));
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="text-xs ml-1">{copied ? tc("copied") : tc("copy")}</span>
                </Button>
              </div>
              <div className="bg-[#1e1e2e] p-4 overflow-x-auto">
                <pre className="m-0"><code
                  className="font-mono text-[13px] leading-relaxed text-[#cdd6f4]"
                  dangerouslySetInnerHTML={{ __html: highlight(ch.challenge.solution, ch.challenge.language) }}
                /></pre>
              </div>
            </Card>
          )}
        </div>

        {/* Right: Code editor */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-sm font-medium capitalize">{ch.challenge.language}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAICode("improve")}
                  disabled={!!aiLoading}
                  className="text-solana-purple border-solana-purple/30 hover:bg-solana-purple/10"
                >
                  {aiLoading === "improve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {t("improveWithAI")}
                </Button>
                <Button size="sm" onClick={handleRunTests}>
                  <Play className="h-4 w-4" /> {t("runTests")}
                </Button>
              </div>
            </div>
            <div className="h-[400px]">
              <MonacoEditor
                height="100%"
                language={ch.challenge.language === "rust" ? "rust" : "typescript"}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v ?? "")}
                beforeMount={(monaco) => {
                  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: true,
                    noSyntaxValidation: false,
                  });
                  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.ESNext,
                    module: monaco.languages.typescript.ModuleKind.ESNext,
                    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                    allowNonTsExtensions: true,
                    noEmit: true,
                  });
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 16 },
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
              {completeMutation.isPending ? t("completing") : allTestsPassed ? t("markComplete") : t("passAllTestsFirst")}
            </Button>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {prevChallenge ? (
          <Button asChild variant="outline">
            <Link href={`/practice/${prevChallenge.id}`}>
              <ArrowLeft className="h-4 w-4" /> {prevChallenge.title}
            </Link>
          </Button>
        ) : <div />}
        {nextChallenge ? (
          <Button asChild>
            <Link href={`/practice/${nextChallenge.id}`}>
              {nextChallenge.title} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="solana">
            <Link href="/practice">{tp("backToPractice")}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function runChallengeTests(
  code: string,
  challenge: Challenge
): { name: string; passed: boolean; message?: string }[] {
  const clean = code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const hasPlaceholder = /\/\/\s*your code here/i.test(code);

  const solutionPatterns = extractPatterns(challenge.solution);

  return challenge.testCases.map((tc) => {
    if (hasPlaceholder && clean.trim() === challenge.starterCode.replace(/\/\/.*$/gm, "").trim()) {
      return { name: tc.name, passed: false, message: "Replace the placeholder comments with your implementation" };
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
  const clean = solution.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  if (/Keypair\.generate\(\)/.test(clean)) {
    patterns.push({ label: "Keypair.generate()", regex: /Keypair\.generate\(\)/ });
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
    patterns.push({ label: "SystemProgram.transfer()", regex: /SystemProgram\.transfer\(/ });
  }
  if (/sendAndConfirmTransaction\(/.test(clean)) {
    patterns.push({ label: "sendAndConfirmTransaction()", regex: /sendAndConfirmTransaction\(/ });
  }
  if (/new\s+Transaction\(\)\.add\(/.test(clean)) {
    patterns.push({ label: "new Transaction().add()", regex: /new\s+Transaction\(\)\.add\(/ });
  }
  if (/findProgramAddressSync\(/.test(clean)) {
    patterns.push({ label: "findProgramAddressSync()", regex: /findProgramAddressSync\(/ });
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
    patterns.push({ label: `struct ${m[1]}`, regex: new RegExp(`struct\\s+${m[1]}[^{]*\\{`) });
  }
  for (const m of clean.matchAll(/enum\s+(\w+)/g)) {
    patterns.push({ label: `enum ${m[1]}`, regex: new RegExp(`enum\\s+${m[1]}[^{]*\\{`) });
  }
  for (const m of clean.matchAll(/impl\s+(\w+)/g)) {
    patterns.push({ label: `impl ${m[1]}`, regex: new RegExp(`impl\\s+${m[1]}`) });
  }
  for (const m of clean.matchAll(/(?:pub\s+)?fn\s+(\w+)/g)) {
    patterns.push({ label: `fn ${m[1]}`, regex: new RegExp(`fn\\s+${m[1]}\\s*(?:<[^>]*>)?\\s*\\(`) });
  }
  for (const m of clean.matchAll(/#\[derive\(([^)]+)\)\]/g)) {
    patterns.push({ label: `#[derive(${m[1]})]`, regex: new RegExp(`#\\[derive\\([^)]*${m[1].split(",")[0].trim()}`) });
  }
  for (const m of clean.matchAll(/pub\s+(\w+)\s*:\s*(\w+)/g)) {
    patterns.push({ label: `${m[1]}: ${m[2]}`, regex: new RegExp(`${m[1]}\\s*:\\s*${m[2]}`) });
  }
  for (const m of clean.matchAll(/(\w+)::(\w+)\(/g)) {
    if (!["use", "super", "Self", "self"].includes(m[1])) {
      patterns.push({ label: `${m[1]}::${m[2]}()`, regex: new RegExp(`${m[1]}::${m[2]}\\(`) });
    }
  }

  if (patterns.length === 0) {
    patterns.push({ label: "implementation", regex: /(?:return|=>|=)\s*[^\/\n]+/ });
  }

  return patterns;
}
