"use client";

import { use, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getLessonById } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Play,
  RotateCcw,
  Lightbulb,
  Eye,
  BookOpen,
  Code,
  Star,
} from "lucide-react";
import dynamic from "next/dynamic";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    ),
  },
);

export default function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);
  const t = useTranslations("lessons");
  const tc = useTranslations("common");
  const data = getLessonById(slug, id);

  const [code, setCode] = useState(data?.lesson.challenge?.starterCode ?? "");
  const [output, setOutput] = useState<string>("");
  const [testResults, setTestResults] = useState<
    { label: string; passed: boolean; expected: string; actual: string }[]
  >([]);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  const runCode = useCallback(async () => {
    if (!data?.lesson.challenge) return;
    setRunning(true);
    setOutput("");
    setTestResults([]);

    await new Promise((r) => setTimeout(r, 200));
    const challenge = data.lesson.challenge;

    const fnNameMatch = challenge.starterCode.match(/function\s+(\w+)/);
    const fnName = fnNameMatch?.[1] ?? "solution";

    // Strip TypeScript type annotations so new Function() can parse it
    const jsCode = code
      .replace(
        /:\s*(?:number|string|boolean|void|any|never|unknown|bigint|symbol|object|null|undefined)(?:\[\])*/g,
        "",
      )
      .replace(/\s+\{/, " {");

    const results = challenge.testCases.map((tc) => {
      try {
        const parseArgs = `
          var __args = (function(raw) {
            var parts = raw.split(',').map(function(s) { return s.trim(); });
            return parts.map(function(p) {
              if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
                return p.slice(1, -1);
              }
              var n = Number(p);
              if (!isNaN(n) && p !== '') return n;
              return p;
            });
          })(${JSON.stringify(tc.input)});
        `;

        const fn = new Function(
          parseArgs + jsCode + `\nreturn ${fnName}.apply(null, __args);`,
        );
        const actual = String(fn());
        return {
          label: tc.label,
          passed: actual.trim() === tc.expectedOutput.trim(),
          expected: tc.expectedOutput,
          actual: actual.trim(),
        };
      } catch (e) {
        return {
          label: tc.label,
          passed: false,
          expected: tc.expectedOutput,
          actual: e instanceof Error ? e.message : "Error",
        };
      }
    });

    setTestResults(results);
    const allPassed = results.every((r) => r.passed);
    setOutput(
      allPassed
        ? t("allTestsPassed")
        : `${results.filter((r) => r.passed).length}/${results.length} tests passed`,
    );
    if (allPassed) setCompleted(true);
    setRunning(false);
  }, [code, data, t]);

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Lesson not found</h1>
        <Link href="/courses">
          <Button className="mt-4">{tc("back")}</Button>
        </Link>
      </div>
    );
  }

  const { lesson, module: mod, course } = data;
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIdx = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const isChallenge = lesson.type === "challenge" && lesson.challenge;

  return (
    <div className="flex h-[calc(100vh-4.5rem)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href={`/courses/${slug}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              {t("backToCourse")}
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            {mod.title} / {lesson.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {completed && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {t("lessonComplete")}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Star className="h-3 w-3" />
            {lesson.xpReward} {tc("xp")}
          </Badge>
        </div>
      </div>

      {/* Content area */}
      {isChallenge ? (
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          {/* Left: Problem description */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <div className="h-full overflow-y-auto p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold">{lesson.title}</h1>
              </div>
              <Badge variant="secondary" className="mb-4">
                {lesson.challenge!.language === "typescript"
                  ? "TypeScript"
                  : "Rust"}
              </Badge>
              <div className="max-w-none">
                <MarkdownRenderer content={lesson.challenge!.prompt} />
              </div>

              {/* Hints */}
              <div className="mt-6">
                {!showHint ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowHint(true)}
                  >
                    <Lightbulb className="h-4 w-4" />
                    {t("showHint")}
                  </Button>
                ) : (
                  <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2.5 text-sm">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-muted-foreground/70">
                        Hint {hintIndex + 1}/{lesson.challenge!.hints.length}
                      </span>
                      <p className="mt-0.5 text-muted-foreground">
                        {lesson.challenge!.hints[hintIndex]}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {hintIndex > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setHintIndex((i) => i - 1)}
                        >
                          Prev
                        </Button>
                      )}
                      {hintIndex < lesson.challenge!.hints.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setHintIndex((i) => i + 1)}
                        >
                          Next
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Solution toggle */}
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowSolution(!showSolution)}
                >
                  <Eye className="h-4 w-4" />
                  {showSolution ? "Hide Solution" : t("showSolution")}
                </Button>
                {showSolution && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-[#373e47] bg-[#22272e]">
                    <div className="flex items-center border-b border-[#373e47] bg-[#2d333b] px-4 py-2">
                      <span className="text-xs font-medium text-[#768390]">
                        Solution
                      </span>
                    </div>
                    <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-[#adbac7]">
                      <code>{lesson.challenge!.solution}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-sm mb-2">{output}</h3>
                  <div className="space-y-2">
                    {testResults.map((r, i) => (
                      <div
                        key={i}
                        className={`rounded-lg p-3 text-sm ${
                          r.passed
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-red-500/10 text-red-700 dark:text-red-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`h-4 w-4 ${r.passed ? "" : "opacity-30"}`}
                          />
                          <span className="font-medium">{r.label}</span>
                        </div>
                        {!r.passed && (
                          <div className="mt-1 text-xs">
                            <p>
                              {t("expected")}: {r.expected}
                            </p>
                            <p>
                              {t("actual")}: {r.actual}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Code editor */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <span className="text-sm font-medium">
                  {lesson.challenge!.language === "typescript"
                    ? "TypeScript"
                    : "Rust"}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      setCode(lesson.challenge!.starterCode);
                      setTestResults([]);
                      setOutput("");
                      setCompleted(false);
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    {t("resetCode")}
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={runCode}
                    disabled={running}
                  >
                    <Play className="h-3 w-3" />
                    {running ? "Running..." : t("runCode")}
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <MonacoEditor
                  height="100%"
                  language={lesson.challenge!.language}
                  value={code}
                  onChange={(v) => setCode(v ?? "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        /* Content lesson */
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">{lesson.title}</h1>
            </div>
            {lesson.videoUrl && (
              <div className="mb-8 aspect-video w-full overflow-hidden rounded-lg border bg-black">
                <iframe
                  src={lesson.videoUrl}
                  title={lesson.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            <MarkdownRenderer content={lesson.content ?? ""} />
            <div className="mt-8">
              <Button className="gap-2" onClick={() => setCompleted(true)}>
                <CheckCircle2 className="h-4 w-4" />
                Mark as Complete (+{lesson.xpReward} {tc("xp")})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="flex items-center justify-between border-t px-4 py-3">
        {prevLesson ? (
          <Link href={`/courses/${slug}/lessons/${prevLesson.id}`}>
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              {tc("previous")}
            </Button>
          </Link>
        ) : (
          <div />
        )}
        <span className="text-xs text-muted-foreground">
          {currentIdx + 1} / {allLessons.length}
        </span>
        {nextLesson ? (
          <Link href={`/courses/${slug}/lessons/${nextLesson.id}`}>
            <Button size="sm" className="gap-1">
              {tc("next")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href={`/courses/${slug}`}>
            <Button size="sm" variant="outline">
              {t("backToCourse")}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
