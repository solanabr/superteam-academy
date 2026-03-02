"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle, Circle, Play, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

interface TestRunnerProps {
  testCases: TestCase[];
  userCode: string;
}

type TestStatus = "pending" | "pass" | "fail";

export function TestRunner({ testCases, userCode }: TestRunnerProps) {
  const t = useTranslations("lessons");
  const [results, setResults] = useState<TestStatus[]>(
    testCases.map(() => "pending")
  );
  const [expanded, setExpanded] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  const runTests = () => {
    setRunning(true);
    // Simulate test execution
    setTimeout(() => {
      const newResults = testCases.map(() =>
        Math.random() > 0.3 ? "pass" : "fail"
      ) as TestStatus[];
      setResults(newResults);
      setRunning(false);
    }, 1500);
  };

  const passCount = results.filter((r) => r === "pass").length;
  const allPassed = passCount === testCases.length && results.every((r) => r !== "pending");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{t("testCases")}</h4>
        <Button size="sm" onClick={runTests} disabled={running}>
          <Play className="h-3 w-3 mr-1" />
          {running ? t("running") : t("runTests")}
        </Button>
      </div>

      {results.some((r) => r !== "pending") && (
        <div
          className={cn(
            "text-xs px-3 py-2 rounded-md",
            allPassed
              ? "bg-superteam-green/10 text-superteam-green"
              : "bg-red-500/10 text-red-500"
          )}
        >
          {passCount}/{testCases.length} {t("testsPassed")}
        </div>
      )}

      <div className="space-y-1">
        {testCases.map((tc, i) => {
          const status = results[i];
          const isExpanded = expanded === i;

          return (
            <div key={i} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : i)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                {status === "pass" ? (
                  <CheckCircle2 className="h-4 w-4 text-superteam-green shrink-0" />
                ) : status === "fail" ? (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="flex-1 text-left truncate">{tc.description}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">{t("input")}:</span>
                    <pre className="bg-muted p-2 rounded mt-1 font-mono">{tc.input}</pre>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("expected")}:</span>
                    <pre className="bg-muted p-2 rounded mt-1 font-mono">
                      {tc.expectedOutput}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
