"use client";

import { CheckCircle2, XCircle, Minus } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export type TestCase = {
  id: string;
  name: string;
  expectedSnippet: string;
};

type TestRunnerProps = {
  testCases: TestCase[];
  code: string;
  hasRun: boolean;
};

export function TestRunner({ testCases, code, hasRun }: TestRunnerProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t("lesson.testCasesLabel")}</p>
      <ul className="space-y-1.5">
        {testCases.map((testCase) => {
          const passed = code.includes(testCase.expectedSnippet);
          return (
            <li
              key={testCase.id}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                !hasRun
                  ? "border-border bg-transparent"
                  : passed
                    ? "border-solana-green/30 bg-solana-green/5"
                    : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <span className="text-sm">{testCase.name}</span>
              {!hasRun ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Minus className="h-3.5 w-3.5" />
                  {t("common.pending")}
                </span>
              ) : passed ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-solana-green">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("common.pass")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                  <XCircle className="h-4 w-4" />
                  {t("common.fail")}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
