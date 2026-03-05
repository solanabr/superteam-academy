"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { ChallengeBlock } from "@/data/challenges";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[200px] items-center justify-center bg-[#1e1e1e] text-muted-foreground">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  ),
});

const languageMap = {
  rust: "rust",
  typescript: "typescript",
  json: "json",
} as const;

interface ChallengePlaygroundProps {
  challengeBlock: ChallengeBlock;
}

export function ChallengePlayground({
  challengeBlock,
}: ChallengePlaygroundProps) {
  const t = useTranslations("challenges");
  const [code, setCode] = React.useState(challengeBlock.starterCode);
  const [testResults, setTestResults] = React.useState<{
    passed: number;
    total: number;
    details?: string;
  } | null>(null);

  const lang = languageMap[challengeBlock.language] ?? "typescript";

  const handleRun = () => {
    // Mock test runner: check if code contains expected patterns
    const total = challengeBlock.testCases.length;
    let passed = 0;
    const details: string[] = [];

    for (const tc of challengeBlock.testCases) {
      if (code.includes(tc.input) || code.includes(tc.expected)) {
        passed++;
        details.push(`✓ ${tc.input}`);
      } else {
        details.push(`✗ ${tc.input} — esperado: ${tc.expected}`);
      }
    }

    setTestResults({ passed, total, details: details.join("\n") });
  };

  const handleSubmit = () => {
    handleRun();
  };

  return (
    <div className="flex h-full flex-col rounded-lg border bg-[#1e1e1e]">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm text-muted-foreground">
          {challengeBlock.language}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRun}
            className="rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("run")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-[hsl(var(--brand-logo-green))] px-3 py-1 text-sm font-medium text-white hover:opacity-90"
          >
            {t("submit")}
          </button>
        </div>
      </div>
      <div className="min-h-[400px] flex-1">
        <Editor
          height="100%"
          language={lang}
          value={code}
          onChange={(v) => setCode(v ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
        />
      </div>
      {testResults != null && (
        <div className="border-t px-3 py-2 text-sm">
          {testResults.passed === testResults.total ? (
            <span className="text-green-500">{t("allTestsPassed")}</span>
          ) : (
            <span className="text-amber-500">
              {testResults.passed}/{testResults.total} {t("testsPassed")}
            </span>
          )}
          {testResults.details && (
            <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {testResults.details}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
