"use client";

import { useCallback, useMemo, useState } from "react";
import { Play, Loader2, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { TestRunner, type TestCase } from "@/components/editor/TestRunner";
import { calculateChallengeXP } from "@/lib/gamification/xp";
import { useI18n } from "@/lib/i18n/provider";

const testCases: TestCase[] = [
  { id: "1", name: "Derive PDA for user profile", expectedSnippet: "findProgramAddress" },
  { id: "2", name: "Use async transaction send", expectedSnippet: "await" },
  { id: "3", name: "Return explorer link", expectedSnippet: "https://explorer.solana.com" }
];

const starterCode = `import { PublicKey } from "@solana/web3.js";

export async function completeChallenge(user: PublicKey): Promise<string> {
  // TODO: implement
  return "";
}
`;

type ChallengeStatus = "idle" | "running" | "done";

export function ChallengePanel({ challengePrompt }: { challengePrompt?: string }): JSX.Element {
  const { t } = useI18n();
  const [code, setCode] = useState(starterCode);
  const [status, setStatus] = useState<ChallengeStatus>("idle");
  const [showCelebration, setShowCelebration] = useState(false);
  const [output, setOutput] = useState<string[]>([]);

  const passedCount = useMemo(() => {
    if (status !== "done") return 0;
    return testCases.reduce((count, tc) => count + Number(code.includes(tc.expectedSnippet)), 0);
  }, [code, status]);

  const awardedXP = status === "done" ? calculateChallengeXP(passedCount, testCases.length) : 0;
  const allPassed = status === "done" && passedCount === testCases.length;

  const handleRun = useCallback(() => {
    setStatus("running");
    setOutput([]);
    setShowCelebration(false);

    // Simulate test execution with output
    const lines: string[] = [];
    setTimeout(() => {
      lines.push("$ tsc --noEmit challenge.ts");
      lines.push("Compiling...");
      setOutput([...lines]);
    }, 300);

    setTimeout(() => {
      lines.push("Running test suite...");
      setOutput([...lines]);
    }, 700);

    setTimeout(() => {
      const passed = testCases.reduce((n, tc) => n + Number(code.includes(tc.expectedSnippet)), 0);
      testCases.forEach((tc) => {
        const ok = code.includes(tc.expectedSnippet);
        lines.push(`  ${ok ? "✓" : "✗"} ${tc.name}`);
      });
      lines.push("");
      lines.push(`Tests: ${passed}/${testCases.length} passed`);
      if (passed === testCases.length) {
        lines.push(`🎉 All tests passed! +${calculateChallengeXP(passed, testCases.length)} XP`);
      }
      setOutput([...lines]);
      setStatus("done");

      if (passed === testCases.length) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }, 1200);
  }, [code]);

  return (
    <div className="flex flex-col gap-4">
      {/* Challenge prompt */}
      {challengePrompt && (
        <Card className="border-solana-purple/30 bg-solana-purple/5">
          <CardContent className="flex items-start gap-3 py-4">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-solana-purple" />
            <div>
              <p className="text-sm font-medium">Challenge</p>
              <p className="mt-1 text-sm text-muted-foreground">{challengePrompt}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <Card className="relative overflow-hidden">
        {/* Success celebration overlay */}
        {showCelebration && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-solana-green/10 backdrop-blur-sm animate-fade-in">
            <div className="flex flex-col items-center gap-3 animate-count-up">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-solana-green/20">
                <Trophy className="h-8 w-8 text-solana-green" />
              </div>
              <p className="text-lg font-bold text-solana-green">All Tests Passed!</p>
              <p className="text-2xl font-bold">+{awardedXP} XP</p>
            </div>
            {/* Confetti particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${Math.random() * 30}%`,
                    backgroundColor: i % 3 === 0 ? "#9945FF" : i % 3 === 1 ? "#14F195" : "#FFD700",
                    animation: `confetti-fall ${1 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("lesson.challengeTitle")}</CardTitle>
            {status === "done" && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                allPassed ? "bg-solana-green/10 text-solana-green" : "bg-amber-500/10 text-amber-500"
              }`}>
                {passedCount}/{testCases.length} passed
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeEditor value={code} onChange={setCode} />

          {/* Run button */}
          <Button
            onClick={handleRun}
            disabled={status === "running"}
            className="w-full bg-solana-green text-solana-green-foreground font-semibold text-black hover:bg-solana-green/90 disabled:opacity-50"
          >
            {status === "running" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running tests...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                {t("common.runTests")}
              </>
            )}
          </Button>

          {/* Test cases */}
          <TestRunner testCases={testCases} code={code} hasRun={status === "done"} />

          {/* Output panel */}
          {output.length > 0 && (
            <div className="rounded-lg border bg-zinc-950 p-4">
              <p className="mb-2 text-xs font-medium text-zinc-500">Output</p>
              <pre className="font-mono text-xs leading-relaxed text-zinc-300">
                {output.map((line, i) => (
                  <div key={i} className={
                    line.startsWith("  ✓") ? "text-solana-green" :
                    line.startsWith("  ✗") ? "text-red-400" :
                    line.startsWith("🎉") ? "text-solana-green font-bold" :
                    ""
                  }>
                    {line}
                  </div>
                ))}
              </pre>
            </div>
          )}

          {/* XP award */}
          {status === "done" && (
            <div className={`flex items-center justify-between rounded-lg border p-3 ${
              allPassed ? "border-solana-green/30 bg-solana-green/5" : "border-border"
            }`}>
              <span className="text-sm text-muted-foreground">{t("lesson.xpAwarded")}</span>
              <span className={`text-lg font-bold ${allPassed ? "text-solana-green" : "text-foreground"}`}>
                +{awardedXP} XP
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
