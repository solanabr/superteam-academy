"use client";

import { useState, useMemo, useRef } from "react";
import type { CourseDetail, LessonRef, ModuleRef } from "@/sanity/lib/queries";
import { Button } from "@/components/ui/button";
import { ChallengeRunner } from "./ChallengeRunner";
import { CodeEditor, SupportedLanguage } from "./CodeEditor";
import { TerminalOutput } from "./TerminalOutput";

type LessonViewClientProps = {
  course: CourseDetail;
  lesson: LessonRef;
};

function flattenLessons(modules: ModuleRef[] | undefined) {
  const list: Array<{ lesson: LessonRef; index: number }> = [];
  if (!modules) return list;
  let idx = 0;
  for (const mod of modules.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))) {
    const lessons = mod.lessons ?? [];
    for (const lesson of lessons.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))) {
      list.push({ lesson, index: idx });
      idx++;
    }
  }
  return list;
}

function portableTextToParagraphs(content: unknown): string[] {
  if (!Array.isArray(content)) return [];
  return (content as any[])
    .filter((b) => b && b._type === "block")
    .map((b) =>
      (Array.isArray(b.children) ? b.children : [])
        .map((c: any) => c?.text ?? "")
        .join("")
        .trim()
    )
    .filter(Boolean);
}

export function LessonViewClient({ course, lesson }: LessonViewClientProps) {
  const [language, setLanguage] = useState<SupportedLanguage>(
    (lesson.lessonType === "challenge" && (lesson.challenge?.language as SupportedLanguage)) ||
      "rust"
  );

  // Playground state (for non-challenge lessons)
  const [playgroundCode, setPlaygroundCode] = useState<string>("");
  const [playgroundOutput, setPlaygroundOutput] = useState<string>("");
  const [playgroundStatus, setPlaygroundStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [executionStats, setExecutionStats] = useState<{ memory?: string; cpuTime?: string }>({});
  // Ref to get code directly from editor (fallback if onChange doesn't fire)
  const getCodeFromEditorRef = useRef<(() => string) | null>(null);

  const flattened = useMemo(() => flattenLessons(course.modules), [course.modules]);
  const current = flattened.find((l) => l.lesson._id === lesson._id);
  const currentIndex = current?.index ?? 0;
  const prevLesson = flattened[currentIndex - 1]?.lesson;
  const nextLesson = flattened[currentIndex + 1]?.lesson;

  const contentParagraphs = portableTextToParagraphs(lesson.content);

  const handleComplete = async () => {
    try {
      const res = await fetch("/api/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.slug,
          lessonIndex: currentIndex,
        }),
      });
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error("Failed to mark lesson complete");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error marking lesson complete:", e);
    }
  };

  const handleRunCode = async () => {
    // Get code from editor directly (fallback if state is stale)
    const codeToRun = getCodeFromEditorRef.current?.() || playgroundCode;
    
    if (!codeToRun.trim()) {
      setPlaygroundOutput("> error: no code provided. Please write some code first.\n");
      setPlaygroundStatus("error");
      return;
    }

    setPlaygroundStatus("running");
    setPlaygroundOutput("");
    setExecutionStats({});
    setDailyLimitReached(false);

    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code: codeToRun,
          // No test cases for playground mode
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setPlaygroundStatus("error");
        setPlaygroundOutput(`> error: ${errorData.stderr || errorData.error || "API request failed"}\n`);
        return;
      }

      const data = (await res.json()) as {
        stdout?: string;
        stderr?: string;
        passed?: boolean;
        memory?: string;
        cpuTime?: string;
        dailyLimitReached?: boolean;
      };

      setDailyLimitReached(Boolean(data.dailyLimitReached));

      // Combine stdout and stderr for display (stderr contains errors)
      const lines: string[] = [];
      if (data.stdout) lines.push(data.stdout);
      if (data.stderr) lines.push(data.stderr);
      // If both are empty but execution failed, show a message
      const combinedOutput = lines.join("\n");
      setPlaygroundOutput(combinedOutput || (data.passed ? "> No output\n" : "> Execution failed with no output\n"));

      // Set execution stats
      if (data.memory || data.cpuTime) {
        setExecutionStats({
          memory: data.memory,
          cpuTime: data.cpuTime,
        });
      }

      setPlaygroundStatus(data.passed ? "success" : "error");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("run-code error", err);
      setPlaygroundStatus("error");
      setPlaygroundOutput(`> error: ${err instanceof Error ? err.message : "Failed to contact runner API"}\n`);
    }
  };

  const isChallenge = lesson.lessonType === "challenge";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-text-primary text-2xl font-semibold">
            {lesson.title}
          </h1>
          <p className="text-text-secondary text-xs">
            {course.title}
            {" • "}
            Lesson {currentIndex + 1}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>Editor language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="border-border-subtle bg-void rounded-md border px-2 py-1 text-xs"
          >
            <option value="rust">Rust</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="json">JSON</option>
          </select>
        </div>
      </div>

      {/* Two-column layout: Lesson content (left) and Code editor (right) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        {/* Lesson Content Box */}
        <div className="glass-panel rounded-lg border p-6">
          <div className="flex flex-col gap-4">
            {isChallenge && lesson.challenge?.title && (
              <p className="text-solana text-xs font-semibold uppercase tracking-wide">
                Challenge: {lesson.challenge.title}
              </p>
            )}

            {contentParagraphs.length === 0 ? (
              <p className="text-text-secondary text-sm">No lesson content yet.</p>
            ) : (
              <div className="prose prose-invert max-w-none text-sm">
                {contentParagraphs.map((p, idx) => (
                  <p key={idx} className="text-text-secondary leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            )}

            {!isChallenge && (
              <div className="mt-2">
                <Button
                  size="sm"
                  onClick={handleComplete}
                >
                  Mark lesson complete
                </Button>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-secondary">
              {prevLesson && (
                <a
                  href={`/courses/${course.slug}/lessons/${prevLesson._id}`}
                  className="hover:text-solana"
                >
                  ← Previous lesson
                </a>
              )}
              {nextLesson && (
                <a
                  href={`/courses/${course.slug}/lessons/${nextLesson._id}`}
                  className="hover:text-solana"
                >
                  Next lesson →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Code Editor Box */}
        <div className="glass-panel rounded-lg border p-6">
          <div className="flex h-full min-h-[500px] flex-col gap-2">
            {isChallenge ? (
              <ChallengeRunner
                language={language}
                starterCode={lesson.challenge?.starterCode ?? ""}
                testCases={lesson.challenge?.testCases}
                onComplete={handleComplete}
              />
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
                  <span>Playground</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border-subtle px-2 py-0.5">
                      <kbd className="rounded bg-void/70 px-1">Ctrl/Cmd+F</kbd> search •{" "}
                      <kbd className="rounded bg-void/70 px-1">Ctrl+Space</kbd> autocomplete •{" "}
                      <kbd className="rounded bg-void/70 px-1">Ctrl/Cmd+/</kbd> comment •{" "}
                      <kbd className="rounded bg-void/70 px-1">Ctrl/Cmd+Z</kbd> undo •{" "}
                      <kbd className="rounded bg-void/70 px-1">Ctrl/Cmd+Shift+[</kbd> fold •{" "}
                      <kbd className="rounded bg-void/70 px-1">Alt+Drag</kbd> column select
                    </span>
                    <Button
                      size="sm"
                      onClick={handleRunCode}
                      disabled={playgroundStatus === "running"}
                      className="shrink-0"
                    >
                      {playgroundStatus === "running" ? "Running…" : "Run Code"}
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden rounded-md border border-border-subtle bg-void/60">
                  <CodeEditor
                    initialValue=""
                    language={language}
                    onChange={setPlaygroundCode}
                    onGetCode={(getCode) => {
                      getCodeFromEditorRef.current = getCode;
                    }}
                    className="h-full"
                  />
                </div>
                {/* Terminal Output Box */}
                <TerminalOutput
                  output={playgroundOutput}
                  status={playgroundStatus}
                  executionStats={executionStats}
                  dailyLimitReached={dailyLimitReached}
                  onClear={() => {
                    setPlaygroundOutput("");
                    setPlaygroundStatus("idle");
                    setExecutionStats({});
                    setDailyLimitReached(false);
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

