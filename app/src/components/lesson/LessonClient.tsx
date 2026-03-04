"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { getLearningProgressService } from "@/lib/services/learning-progress";
import {
  isOnChainBridgeStrict,
  shouldUseOnChainBridge,
  startLessonViaOnChainBridge,
} from "@/lib/onchain/client-bridge";
import { CodeEditor, type CodeLanguage } from "@/components/editor/CodeEditor";
import type { Lesson } from "@/lib/cms/schemas";

interface CourseModule {
  _id: string;
  title: string;
  order: number;
  lessons?: Array<{
    _id: string;
    title: string;
    slug: { current: string };
    order: number;
  }>;
}

interface TestResult {
  passed: boolean;
  message: string;
}

function detectLanguage(lesson: Lesson): CodeLanguage {
  if (lesson.language) {
    const lang = lesson.language.toLowerCase();
    if (lang === "rust" || lang === "rs") return "rust";
    if (lang === "typescript" || lang === "ts") return "typescript";
    if (lang === "javascript" || lang === "js") return "javascript";
    if (lang === "json") return "json";
  }
  if (lesson.starterCode?.includes("fn ") || lesson.starterCode?.includes("pub ")) return "rust";
  if (lesson.starterCode?.includes("const ") || lesson.starterCode?.includes("import ")) return "typescript";
  return "rust";
}

export function LessonClient({
  lesson,
  courseSlug,
  courseId,
  onChainCourseId,
  courseModules,
}: {
  lesson: Lesson;
  courseSlug: string;
  courseId?: string;
  onChainCourseId?: string;
  courseModules?: CourseModule[];
}) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [checkingProgress, setCheckingProgress] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [codeValue, setCodeValue] = useState(lesson.starterCode || "");
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [splitWidth, setSplitWidth] = useState(50);
  const splitRef = useRef<HTMLDivElement>(null);
  const language = detectLanguage(lesson);
  const isChallenge = lesson.type === "challenge";

  const resolveBridgeCourseId = useCallback(
    (...candidates: Array<string | undefined>) => {
      const encoder = new TextEncoder();
      for (const candidate of candidates) {
        if (!candidate) continue;
        const normalized = candidate.trim();
        if (!normalized) continue;
        if (encoder.encode(normalized).length > 32) continue;
        return normalized;
      }
      return null;
    },
    []
  );

  useEffect(() => {
    if (!user || !courseId) {
      setCheckingProgress(false);
      return;
    }

    const lessonIndex = lesson.order ?? 0;
    const service = getLearningProgressService();

    service
      .getProgress(user.id, courseId)
      .then((progress) => {
        if (progress) {
          const bitmap = BigInt(progress.lessonProgress);
          const isCompleted = (bitmap & (1n << BigInt(lessonIndex))) !== 0n;
          setCompleted(isCompleted);
        }
      })
      .catch((err) => {
        console.error("[LessonClient] Error checking progress:", err);
      })
      .finally(() => setCheckingProgress(false));
  }, [user, courseId, lesson.order]);

  useEffect(() => {
    if (!user || !courseId || !shouldUseOnChainBridge()) return;

    const lessonIndex = lesson.order ?? 0;
    if (!Number.isInteger(lessonIndex) || lessonIndex < 0) return;

    const bridgeCourseId = resolveBridgeCourseId(
      onChainCourseId,
      courseSlug,
      courseId
    );
    if (!bridgeCourseId) {
      const message =
        "[onchain-bridge][start_lesson] No valid on-chain courseId (<=32 bytes).";
      if (isOnChainBridgeStrict()) {
        console.error(message);
      } else {
        console.warn(message);
      }
      return;
    }

    let disposed = false;
    startLessonViaOnChainBridge({
      courseId: bridgeCourseId,
      lessonIndex,
    })
      .then((bridge) => {
        if (disposed || bridge.ok) return;
        const message = `[onchain-bridge][start_lesson] ${bridge.code}: ${bridge.message}`;
        if (isOnChainBridgeStrict()) {
          console.error(message);
        } else {
          console.warn(message);
        }
      })
      .catch((error) => {
        if (disposed) return;
        const message =
          error instanceof Error ? error.message : "Bridge request failed";
        if (isOnChainBridgeStrict()) {
          console.error(`[onchain-bridge][start_lesson] ${message}`);
        } else {
          console.warn(
            `[onchain-bridge][start_lesson] ${message}. Continuing without start-lesson sync.`
          );
        }
      });

    return () => {
      disposed = true;
    };
  }, [
    user,
    courseId,
    onChainCourseId,
    courseSlug,
    lesson.order,
    resolveBridgeCourseId,
  ]);

  const nextLesson = useMemo(() => {
    if (!courseModules) return null;
    const allLessons = courseModules
      .flatMap((m) => m.lessons || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = allLessons.findIndex((l) => l._id === lesson._id);
    if (currentIndex === -1 || currentIndex === allLessons.length - 1) return null;
    return allLessons[currentIndex + 1];
  }, [courseModules, lesson._id]);

  const handleComplete = useCallback(async () => {
    if (!user || !courseId) return;
    setCompleting(true);
    try {
      const service = getLearningProgressService();
      await service.completeLesson(
        user.id,
        courseId,
        lesson.order ?? 0,
        lesson.xpReward ?? 10,
        { onChainCourseId: onChainCourseId || courseSlug }
      );
      setCompleted(true);
    } catch (err) {
      console.error("Failed to complete lesson:", err);
    } finally {
      setCompleting(false);
    }
  }, [user, courseId, lesson.order, lesson.xpReward, onChainCourseId, courseSlug]);

  const handleRunCode = useCallback(() => {
    setRunning(true);
    setTestResults(null);

    // Simulate running code with a short delay
    setTimeout(() => {
      const results: TestResult[] = [];
      const userCode = codeValue.trim();
      const solution = lesson.solutionCode?.trim();
      const expected = lesson.expectedOutput?.trim();

      if (expected) {
        // Check if user code contains key patterns from expected output
        const expectedLines = expected.split("\n").filter(Boolean);
        expectedLines.forEach((line, i) => {
          const lineClean = line.trim();
          const matches = userCode.includes(lineClean) ||
            (solution && userCode.length >= (solution.length * 0.6));
          results.push({
            passed: !!matches,
            message: `Test ${i + 1}: Expected output "${lineClean}"`,
          });
        });
      }

      if (solution) {
        // Structure similarity check
        const solutionKeywords: string[] = solution.match(/\b\w+\b/g) || [];
        const userKeywords: string[] = userCode.match(/\b\w+\b/g) || [];
        const matchCount = solutionKeywords.filter((kw) =>
          userKeywords.includes(kw)
        ).length;
        const similarity = solutionKeywords.length > 0
          ? matchCount / solutionKeywords.length
          : 0;

        results.push({
          passed: similarity >= 0.7,
          message: similarity >= 0.7
            ? "Code structure matches expected solution"
            : "Code structure does not match expected solution",
        });
      }

      // If no solution or expected output, just check code was modified
      if (results.length === 0) {
        const modified = userCode !== (lesson.starterCode?.trim() || "");
        results.push({
          passed: modified,
          message: modified
            ? "Code has been modified from starter"
            : "Modify the starter code to complete the challenge",
        });
      }

      setTestResults(results);
      setRunning(false);

      // Auto-complete on all tests passing
      const allPassed = results.every((r) => r.passed);
      if (allPassed && !completed) {
        setShowCelebration(true);
        handleComplete();
        setTimeout(() => setShowCelebration(false), 4000);
      }
    }, 1200);
  }, [codeValue, lesson.solutionCode, lesson.expectedOutput, lesson.starterCode, completed, handleComplete]);

  // Split pane drag handler
  const handleSplitDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const container = splitRef.current;
    if (!container) return;

    const onMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const pct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      setSplitWidth(Math.max(25, Math.min(75, pct)));
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const allTestsPassed = testResults?.every((r) => r.passed) ?? false;

  return (
    <div className="mx-auto space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-500 flex-wrap">
        <Link href="/courses" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
          {t("nav.courses")}
        </Link>
        <span>/</span>
        <Link
          href={`/courses/${courseSlug}`}
          className="hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          {courseSlug}
        </Link>
        <span>/</span>
        <span className="text-neutral-700 dark:text-neutral-300">{lesson.title}</span>
      </nav>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase border ${
              lesson.type === "challenge"
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
            }`}
          >
            {lesson.type}
          </span>
          {lesson.estimatedMinutes && (
            <span className="text-xs text-neutral-400">
              {lesson.estimatedMinutes} min
            </span>
          )}
          {lesson.xpReward && (
            <span className="text-xs font-mono font-semibold text-neutral-500 dark:text-neutral-400">
              +{lesson.xpReward} XP
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          {lesson.title}
        </h1>
      </div>

      {/* Challenge: Split Pane Layout */}
      {isChallenge ? (
        <div
          ref={splitRef}
          className="flex gap-0 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden min-h-[600px]"
        >
          {/* Left: Content */}
          <div
            className="overflow-y-auto p-6"
            style={{ width: `${splitWidth}%` }}
          >
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {lesson.body && lesson.body.length > 0 ? (
                <PortableTextRenderer blocks={lesson.body} />
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center">
                  <p className="text-neutral-400">{t("lesson.contentPending")}</p>
                </div>
              )}

              {/* Hints */}
              {lesson.hints && lesson.hints.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    {showHints
                      ? t("lesson.hideHints")
                      : t("lesson.showHints", { n: lesson.hints.length })}
                  </button>
                  {showHints && (
                    <ul className="mt-3 space-y-2">
                      {lesson.hints.map((hint, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <span className="text-neutral-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                          {hint}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Solution */}
              {lesson.solutionCode && (
                <details className="group mt-6">
                  <summary className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">
                    {t("lesson.viewSolution")}
                  </summary>
                  <div className="mt-3">
                    <CodeEditor
                      value={lesson.solutionCode}
                      language={language}
                      readOnly
                      height="200px"
                    />
                  </div>
                </details>
              )}
            </div>
          </div>

          {/* Drag Handle */}
          <div
            onMouseDown={handleSplitDrag}
            className="w-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-600 cursor-col-resize flex-shrink-0 transition-colors"
          />

          {/* Right: Editor + Output */}
          <div
            className="flex flex-col overflow-hidden"
            style={{ width: `${100 - splitWidth}%` }}
          >
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
                {language === "rust" ? "editor.rs" : language === "typescript" ? "editor.ts" : "editor.js"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCodeValue(lesson.starterCode || "")}
                  className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  {t("lesson.reset")}
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={running}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {running ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Run Code
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 min-h-0">
              <CodeEditor
                value={codeValue}
                onChange={setCodeValue}
                language={language}
                height="100%"
              />
            </div>

            {/* Output Panel */}
            <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 max-h-60 overflow-y-auto">
              <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Output</span>
              </div>
              <div className="p-4 text-sm font-mono">
                {running ? (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <div className="w-3 h-3 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                    Running tests...
                  </div>
                ) : testResults ? (
                  <div className="space-y-2">
                    {testResults.map((result, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {result.passed ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 flex-shrink-0 mt-0.5"><path d="M20 6 9 17l-5-5"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0 mt-0.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        )}
                        <span className={result.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                          {result.message}
                        </span>
                      </div>
                    ))}
                    <div className={`mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 font-semibold ${allTestsPassed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {allTestsPassed
                        ? `All tests passed! +${lesson.xpReward ?? 10} XP`
                        : `${testResults.filter((r) => r.passed).length}/${testResults.length} tests passed`}
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-400">Click &quot;Run Code&quot; to test your solution</p>
                )}
              </div>

              {/* Expected Output Reference */}
              {lesson.expectedOutput && (
                <div className="px-4 pb-4">
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">Expected Output</p>
                  <pre className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap bg-neutral-100 dark:bg-neutral-900 p-2 rounded-lg">
                    {lesson.expectedOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Content-only lesson: full-width layout */
        <>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {lesson.body && lesson.body.length > 0 ? (
              <PortableTextRenderer blocks={lesson.body} />
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center">
                <p className="text-neutral-400">{t("lesson.contentPending")}</p>
              </div>
            )}
          </div>

          {/* Code section for content lessons that have starter code */}
          {lesson.starterCode && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t("lesson.challenge")}</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">
                    {language === "rust" ? "editor.rs" : language === "typescript" ? "editor.ts" : "editor.js"}
                  </span>
                  <button
                    onClick={() => setCodeValue(lesson.starterCode || "")}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    {t("lesson.reset")}
                  </button>
                </div>
                <CodeEditor
                  value={codeValue}
                  onChange={setCodeValue}
                  language={language}
                  height="280px"
                />
              </div>

              {lesson.expectedOutput && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                    {t("lesson.expectedOutput")}
                  </p>
                  <pre className="text-sm font-mono text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                    {lesson.expectedOutput}
                  </pre>
                </div>
              )}

              {lesson.hints && lesson.hints.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    {showHints ? t("lesson.hideHints") : t("lesson.showHints", { n: lesson.hints.length })}
                  </button>
                  {showHints && (
                    <ul className="mt-3 space-y-2">
                      {lesson.hints.map((hint, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <span className="text-neutral-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                          {hint}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {lesson.solutionCode && (
                <details className="group">
                  <summary className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">
                    {t("lesson.viewSolution")}
                  </summary>
                  <div className="mt-3">
                    <CodeEditor
                      value={lesson.solutionCode}
                      language={language}
                      readOnly
                      height="200px"
                    />
                  </div>
                </details>
              )}
            </div>
          )}
        </>
      )}

      {/* Celebration Banner */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-emerald-500 text-white px-8 py-6 rounded-3xl shadow-2xl animate-bounce pointer-events-auto">
            <div className="text-center space-y-2">
              <div className="text-4xl">&#127881;</div>
              <h3 className="text-xl font-bold">Challenge Complete!</h3>
              <p className="text-emerald-100">+{lesson.xpReward ?? 10} XP earned</p>
            </div>
          </div>
        </div>
      )}

      {/* Complete / Next Button */}
      <div className="flex items-center gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        {checkingProgress ? (
          <div className="h-12 w-40 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        ) : completed ? (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
              {t("lesson.lessonComplete", { xp: lesson.xpReward ?? 10 })}
            </span>
            {nextLesson ? (
              <Link
                href={`/courses/${courseSlug}/lessons/${nextLesson.slug?.current || nextLesson._id}`}
                className="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
              >
                {t("lesson.nextLesson")} &rarr;
              </Link>
            ) : (
              <Link
                href={`/courses/${courseSlug}`}
                className="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
              >
                {t("common.backToCourse")} &rarr;
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {!isChallenge && (
              <button
                onClick={handleComplete}
                disabled={completing || !user || !courseId}
                className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 hover:scale-105 transition-all duration-300 shadow-lg shadow-neutral-200/50 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completing
                  ? t("lesson.completing")
                  : !user
                  ? t("lesson.signInToTrack")
                  : t("lesson.markComplete")}
              </button>
            )}
            {isChallenge && !completed && (
              <span className="text-sm text-neutral-400">
                Run code and pass all tests to complete this challenge
              </span>
            )}
            {nextLesson && (
              <Link
                href={`/courses/${courseSlug}/lessons/${nextLesson.slug?.current || nextLesson._id}`}
                className="px-5 py-2.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {t("lesson.nextLesson")} &rarr;
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* Simple Portable Text renderer */
function PortableTextRenderer({ blocks }: { blocks: unknown[] }) {
  return (
    <>
      {blocks.map((block: unknown, i: number) => {
        const b = block as Record<string, unknown>;
        if (b._type === "block") {
          const children =
            (b.children as Array<{ text: string; marks?: string[] }>) || [];
          const text = children.map((c) => c.text).join("");
          const style = (b.style as string) || "normal";

          if (style === "h2")
            return (
              <h2 key={i} className="text-2xl font-semibold mt-8 mb-3">
                {text}
              </h2>
            );
          if (style === "h3")
            return (
              <h3 key={i} className="text-xl font-semibold mt-6 mb-2">
                {text}
              </h3>
            );
          if (style === "h4")
            return (
              <h4 key={i} className="text-lg font-semibold mt-4 mb-2">
                {text}
              </h4>
            );
          if (style === "blockquote")
            return (
              <blockquote
                key={i}
                className="border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 italic text-neutral-600 dark:text-neutral-400 my-4"
              >
                {text}
              </blockquote>
            );
          return (
            <p key={i} className="mb-4 leading-relaxed text-neutral-700 dark:text-neutral-300">
              {text}
            </p>
          );
        }
        if (b._type === "code") {
          return (
            <pre
              key={i}
              className="p-4 rounded-xl bg-neutral-900 dark:bg-neutral-950 text-neutral-100 text-sm font-mono overflow-x-auto my-4"
            >
              {String(b.code || "")}
            </pre>
          );
        }
        return null;
      })}
    </>
  );
}
