"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { CodeEditor } from "./code-editor";
import type { ChallengeLesson, TestCase } from "@/lib/data/types";

type TestResult = {
  label: string;
  passed: boolean;
  expected?: string;
  actual?: string;
};

type Props = {
  lesson: ChallengeLesson;
  onAllTestsPass: () => void;
};

function runTypeScriptTests(
  code: string,
  testCases: TestCase[],
): { results: TestResult[]; output: string; error: string | null } {
  const results: TestResult[] = [];
  let output = "";
  let error: string | null = null;

  try {
    const fnMatch = code.match(
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*(?::\s*[\w<>,\s\[\]]+)?\s*\{/,
    );
    const fnName = fnMatch?.[1] ?? "solution";

    const wrappedCode = `
      ${code}
      if (typeof ${fnName} !== 'function') {
        throw new Error('Expected a function named ${fnName}');
      }
      return ${fnName}();
    `;

    const fn = new Function(wrappedCode);
    const actualRaw = String(fn()).trim();
    const actual = actualRaw.toLowerCase();

    for (const tc of testCases) {
      const expected = tc.expectedOutput.trim().toLowerCase();
      const passed = actual.includes(expected) || expected.includes(actual);
      results.push({
        label: tc.label,
        passed,
        expected: tc.expectedOutput,
        actual: actualRaw,
      });
    }
    output = actualRaw;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    for (const tc of testCases) {
      results.push({
        label: tc.label,
        passed: false,
        expected: tc.expectedOutput,
        actual: error,
      });
    }
  }

  return { results, output, error };
}

export function ChallengeRunner({ lesson, onAllTestsPass }: Props) {
  const t = useTranslations("lessonView");
  const [code, setCode] = useState(lesson.starterCode);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const canRun = lesson.language === "typescript";
  const allPassed =
    results !== null && results.length > 0 && results.every((r) => r.passed);

  const handleRun = () => {
    if (lesson.language !== "typescript") return;
    setRunning(true);
    setResults(null);
    setError(null);
    setOutput("");

    setTimeout(() => {
      const {
        results: r,
        output: o,
        error: e,
      } = runTypeScriptTests(code, lesson.testCases);
      setResults(r);
      setOutput(o);
      setError(e);
      setRunning(false);
      if (r.every((x) => x.passed)) {
        onAllTestsPass();
      }
    }, 100);
  };

  return (
    <div className="flex h-full min-h-[400px] flex-col">
      <div className="flex-1 overflow-hidden rounded-lg border bg-[#1e1e1e]">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={lesson.language}
          className="h-full text-sm"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        {canRun ? (
          <Button onClick={handleRun} disabled={running} size="sm">
            {running ? "Running…" : t("run")}
          </Button>
        ) : (
          <Button disabled size="sm" variant="secondary">
            {t("runComingSoon")}
          </Button>
        )}
      </div>

      {(output || error) && (
        <div className="mt-3 rounded-lg border bg-muted/30 p-3 font-mono text-sm">
          <p className="mb-1 font-semibold text-muted-foreground">
            {t("output")}
          </p>
          <pre className="whitespace-pre-wrap break-words">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : (
              output || "(no output)"
            )}
          </pre>
        </div>
      )}

      {results && (
        <div className="mt-3 space-y-2">
          <p className="font-semibold text-muted-foreground">{t("tests")}</p>
          <ul className="space-y-1.5">
            {results.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                {r.passed ? (
                  <CheckCircle
                    className="size-4 shrink-0 text-green-600"
                    weight="fill"
                  />
                ) : (
                  <XCircle
                    className="size-4 shrink-0 text-destructive"
                    weight="fill"
                  />
                )}
                <span
                  className={r.passed ? "text-foreground" : "text-destructive"}
                >
                  {r.label} {r.passed ? t("pass") : t("fail")}
                </span>
              </li>
            ))}
          </ul>
          {allPassed && (
            <p className="mt-2 flex items-center gap-2 font-medium text-green-600">
              <CheckCircle className="size-5" weight="fill" />
              {t("allTestsPassed")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
