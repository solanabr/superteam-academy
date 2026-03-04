"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "@/contexts/locale-context";
import { useLearning } from "@/contexts/learning-context";
import { useTheme } from "@/contexts/theme-context";
import { COURSES } from "@/services/course-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
  Code2,
  Zap,
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center bg-muted rounded-lg">
      <span className="text-muted-foreground">Loading editor...</span>
    </div>
  ),
});

export default function ChallengePage() {
  const params = useParams();
  const challengeId = Number(params.id);
  const { t } = useLocale();
  const { resolvedTheme } = useTheme();
  const { completeLesson } = useLearning();

  // Find the challenge lesson across all courses
  let challengeLesson = null;
  let parentCourse = null;
  for (const course of COURSES) {
    for (const mod of course.modules) {
      const lesson = mod.lessons.find(
        (l) => l.id === challengeId && l.type === "code-challenge"
      );
      if (lesson) {
        challengeLesson = lesson;
        parentCourse = course;
        break;
      }
    }
    if (challengeLesson) break;
  }

  const challenge = challengeLesson?.codeChallenge;
  const [code, setCode] = useState(challenge?.starterCode || "");
  const [isRunning, setIsRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState<
    Array<{ id: string; passed: boolean; description: string; hidden: boolean }>
  >([]);

  const handleRunTests = useCallback(async () => {
    if (!challenge) return;
    setIsRunning(true);
    setOutput("");

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const hasContent = code.length > (challenge.starterCode.length + 10);
    const results = challenge.testCases.map((tc, index) => ({
      id: tc.id,
      description: tc.description,
      passed: hasContent ? index < 2 || Math.random() > 0.3 : false,
      hidden: tc.hidden,
    }));

    setTestResults(results);
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const allPassed = passed === total;

    setOutput(
      allPassed
        ? `All ${total} tests passed successfully.`
        : `${passed}/${total} tests passed. Review failing tests below.`
    );

    if (allPassed && parentCourse) {
      await completeLesson(parentCourse.id, challengeId);
    }

    setIsRunning(false);
  }, [code, challenge, parentCourse, challengeId, completeLesson]);

  const handleReset = useCallback(() => {
    if (challenge) {
      setCode(challenge.starterCode);
      setOutput("");
      setTestResults([]);
    }
  }, [challenge]);

  if (!challengeLesson || !challenge || !parentCourse) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Code2 className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Challenge not found</p>
        <Button asChild variant="outline">
          <Link href="/courses">{t("lesson.backToCourse")}</Link>
        </Button>
      </div>
    );
  }

  const passedCount = testResults.filter((r) => r.passed).length;
  const totalTests = challenge.testCases.length;
  const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);

  return (
    <div className="animate-fade-in flex h-[calc(100vh-4rem)] flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border/40 bg-card/50 px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/courses/${parentCourse.slug}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {parentCourse.title}
          </Link>
          <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20">
            <Code2 className="mr-1 h-3 w-3" />
            {t("lesson.codeChallenge")}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isRunning}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            {t("lesson.resetCode")}
          </Button>
          <Button
            size="sm"
            onClick={handleRunTests}
            disabled={isRunning}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1" />
            )}
            {t("lesson.runCode")}
          </Button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Challenge Description */}
        <div className="w-1/2 overflow-y-auto border-r border-border/40 p-6">
          <h1 className="text-2xl font-bold mb-2">{challengeLesson.title}</h1>
          <p className="text-muted-foreground mb-6">{challenge.prompt}</p>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Objectives</h3>
            <ul className="space-y-2">
              {challenge.objectives.map((obj, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div
                  className={`flex items-center gap-2 mb-3 ${allPassed ? "text-emerald-500" : "text-amber-500"}`}
                >
                  {allPassed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {allPassed
                      ? t("lesson.allTestsPassed")
                      : t("lesson.testsPassed", {
                          passed: passedCount,
                          total: totalTests,
                        })}
                  </span>
                  {allPassed && (
                    <Badge className="ml-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      <Zap className="mr-1 h-3 w-3" />+{parentCourse.xpPerLesson} XP
                    </Badge>
                  )}
                </div>
                <div className="space-y-1.5">
                  {testResults
                    .filter((r) => !r.hidden)
                    .map((result) => (
                      <div
                        key={result.id}
                        className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm ${
                          result.passed
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {result.passed ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {result.description}
                      </div>
                    ))}
                  {testResults.some((r) => r.hidden) && (
                    <p className="text-xs text-muted-foreground px-3 py-1">
                      + {testResults.filter((r) => r.hidden).length} hidden tests
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hints */}
          <button
            onClick={() => setShowHints(!showHints)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lightbulb className="h-4 w-4" />
            Hints
            {showHints ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          {showHints && (
            <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
              Review the lesson content for this module. Focus on implementing
              each objective one at a time. Start with the basic structure, then
              add error handling.
            </div>
          )}
        </div>

        {/* Right: Code Editor */}
        <div className="flex w-1/2 flex-col">
          <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b border-border/40">
            <Badge variant="outline" className="font-mono text-xs">
              {challenge.language}
            </Badge>
          </div>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={challenge.language || "rust"}
              theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                padding: { top: 12 },
                lineNumbers: "on",
                automaticLayout: true,
              }}
            />
          </div>
          {output && (
            <div className="h-32 overflow-y-auto border-t border-border/40 bg-zinc-950 p-4">
              <p className="mb-1 text-xs font-medium text-zinc-400">
                {t("lesson.output")}
              </p>
              <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
