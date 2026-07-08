"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import confetti from "canvas-confetti";
import { useTranslations } from "next-intl";
import {
  ArrowCounterClockwise,
  Trophy,
  Lightning,
  X,
} from "@phosphor-icons/react";
import { CodeEditor, resetEditorStorage } from "./code-editor";
import { OutputPanel } from "./output-panel";
import { ChallengeRunner } from "./challenge-runner";
import { AiPartnerPane } from "./ai-partner/ai-partner-pane";
import type {
  ChallengeInterfaceProps,
  ChallengeState,
  CodeEditorHandle,
  ExecutionResult,
} from "./types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LESSON_COMPLETE_EVENT = "superteam:lesson-complete";

/**
 * Turns a run's test results into the compact summary string the AI Partner
 * route feeds the model as context (e.g. "2/3 passing; failing: rejects
 * negative input"). Returns a neutral placeholder before the learner has run
 * anything, since the route always expects a string.
 */
function summarize(executionResult: ExecutionResult | null): string {
  const results = executionResult?.testResults;
  if (!results || results.length === 0) return "No tests run yet";

  const passing = results.filter((r) => r.passed).length;
  const failing = results.filter((r) => !r.passed);
  if (failing.length === 0) {
    return `${passing}/${results.length} passing`;
  }

  const failingNames = failing.map((r) => r.testCase.description).join(", ");
  return `${passing}/${results.length} passing; failing: ${failingNames}`;
}

export function ChallengeInterface({
  lessonId,
  courseSlug,
  lessonSlug,
  taskSlot,
  description,
  initialCode,
  language,
  buildType,
  isDeployable,
  tests,
  hints,
  xpReward,
  earnedXp,
  isAlreadyCompleted,
  isEnrolled: isEnrolledProp,
  onEnroll,
  onComplete,
  hideDescription,
  className,
}: ChallengeInterfaceProps) {
  const t = useTranslations("lesson");
  const tCommon = useTranslations("common");
  const tCourses = useTranslations("courses");
  const tA11y = useTranslations("a11y");

  // Default to true for backwards compatibility
  const isEnrolled = isEnrolledProp ?? true;

  const [code, setCode] = useState(initialCode);
  const [challengeState, setChallengeState] = useState<ChallengeState>({
    status: "idle",
    executionResult: null,
  });
  const [isComplete, setIsComplete] = useState(isAlreadyCompleted ?? false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const editorHandle = useRef<CodeEditorHandle>(null);

  // Sync when the async DB check resolves after mount.
  // Also fires when lesson-client sets isCompleted=true after API returns —
  // this is when we show the overlay and trigger confetti.
  const prevIsAlreadyCompleted = useRef(isAlreadyCompleted ?? false);
  useEffect(() => {
    if (isAlreadyCompleted && !prevIsAlreadyCompleted.current) {
      setIsComplete(true);
      setIsSaving(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    prevIsAlreadyCompleted.current = isAlreadyCompleted ?? false;
  }, [isAlreadyCompleted]);
  const [showDescription, setShowDescription] = useState(true);
  const [descHeight, setDescHeight] = useState(180);
  const [panelHeight, setPanelHeight] = useState(200);
  const [taskHeight, setTaskHeight] = useState(320);
  const [railWidth, setRailWidth] = useState(460);
  const resizeRef = useRef<{
    startY: number;
    startHeight: number;
    target: "description" | "output" | "task";
  } | null>(null);
  const railResizeRef = useRef<{ startX: number; startWidth: number } | null>(
    null
  );

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setServerError(null);
  }, []);

  const handleResult = useCallback((result: ExecutionResult) => {
    setChallengeState((prev) => ({
      ...prev,
      status: result.success ? "success" : "error",
      executionResult: result,
    }));
  }, []);

  const handleClearOutput = useCallback(() => {
    setChallengeState((prev) => ({
      ...prev,
      status: "idle",
      executionResult: null,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setCode(initialCode);
    resetEditorStorage(lessonId);
    setChallengeState({
      status: "idle",
      executionResult: null,
    });
  }, [initialCode, lessonId]);

  const completeLesson = useCallback(() => {
    setPendingSubmit(false);
    setServerError(null);
    setIsSaving(true);
    onComplete?.();

    // Emit custom event — lesson-client.tsx calls the API and sets
    // isAlreadyCompleted=true when done, which triggers the overlay + confetti.
    // The submitted code travels with the event so the server can re-validate
    // it authoritatively (the browser test pass is UX-only).
    const event = new CustomEvent(LESSON_COMPLETE_EVENT, {
      detail: { lessonId, submittedCode: code },
    });
    window.dispatchEvent(event);
  }, [lessonId, onComplete, code]);

  const handleSubmit = useCallback(() => {
    if (!isEnrolled) {
      // Tests passed but not enrolled — prompt enrollment
      setPendingSubmit(true);
      return;
    }
    completeLesson();
  }, [isEnrolled, completeLesson]);

  // Auto-complete when user enrolls after passing all tests
  useEffect(() => {
    if (pendingSubmit && isEnrolled && !isComplete) {
      completeLesson();
    }
  }, [pendingSubmit, isEnrolled, isComplete, completeLesson]);

  // Server-side completion failed (e.g. a hidden test the browser never ran, or
  // a missing on-chain enrollment). lesson-client.tsx runs the completion API
  // and fires this with a localized reason; clear the "saving" overlay and show
  // it so the submit no longer fails silently.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ lessonId: string; message: string }>)
        .detail;
      if (detail.lessonId !== lessonId) return;
      setIsSaving(false);
      setPendingSubmit(false);
      setServerError(detail.message);
    };
    window.addEventListener("superteam:lesson-complete-error", handler);
    return () =>
      window.removeEventListener("superteam:lesson-complete-error", handler);
  }, [lessonId]);

  const handleResizeStart = useCallback(
    (target: "description" | "output" | "task") => (e: React.MouseEvent) => {
      e.preventDefault();
      const startHeight =
        target === "description"
          ? descHeight
          : target === "task"
            ? taskHeight
            : panelHeight;
      resizeRef.current = { startY: e.clientY, startHeight, target };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeRef.current) return;
        // Description/task: drag down = taller (resizer sits below the panel).
        // Output: drag up = taller (resizer sits above the panel).
        const delta =
          resizeRef.current.target === "output"
            ? resizeRef.current.startY - moveEvent.clientY
            : moveEvent.clientY - resizeRef.current.startY;
        const [min, max] =
          resizeRef.current.target === "task" ? [140, 600] : [80, 500];
        const newHeight = Math.max(
          min,
          Math.min(max, resizeRef.current.startHeight + delta)
        );
        if (resizeRef.current.target === "description") {
          setDescHeight(newHeight);
        } else if (resizeRef.current.target === "task") {
          setTaskHeight(newHeight);
        } else {
          setPanelHeight(newHeight);
        }
      };

      const handleMouseUp = () => {
        resizeRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [descHeight, panelHeight, taskHeight]
  );

  // Horizontal (X-axis) drag for the workspace/rail split — the rail is on the
  // right, so dragging the handle left widens it. Mirrors the vertical
  // resizers' pattern, just on clientX/width instead of clientY/height.
  const handleRailResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      railResizeRef.current = { startX: e.clientX, startWidth: railWidth };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!railResizeRef.current) return;
        const delta = railResizeRef.current.startX - moveEvent.clientX;
        const next = Math.max(
          320,
          Math.min(720, railResizeRef.current.startWidth + delta)
        );
        setRailWidth(next);
      };

      const handleMouseUp = () => {
        railResizeRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [railWidth]
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden border-b border-border lg:flex-row",
        className
      )}
    >
      {/* LEFT workspace: description/toolbar + editor + output. ~62% width at
          lg+ (rail takes lg:w-2/5); below lg, `contents` flattens this into
          the root flex-col so its children order alongside the rail's. */}
      <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:overflow-hidden">
        <div className="order-2 flex min-h-0 flex-col overflow-hidden lg:order-none lg:flex-1">
          {/* Description toggle + test cases (hidden when rendered externally) */}
          {!hideDescription && (
            <>
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="flex w-full shrink-0 items-center gap-2 border-b border-border px-4 py-2 text-left text-sm font-medium hover:[background:var(--card-hover)]"
                type="button"
              >
                <span
                  className="inline-block text-sm transition-transform duration-200"
                  style={{
                    transform: showDescription ? "rotate(180deg)" : "rotate(0)",
                  }}
                  aria-hidden="true"
                >
                  ▾
                </span>
                {t("challenge")}
                <span className="ml-auto flex items-center gap-1 font-display text-xs font-black text-xp">
                  <Lightning size={14} weight="duotone" className="text-xp" />
                  {xpReward} XP
                </span>
              </button>
            </>
          )}

          {/* Challenge description */}
          {!hideDescription && showDescription && (
            <>
              <div
                className="shrink-0 overflow-auto px-4 py-3"
                style={{ height: descHeight, minHeight: 80 }}
              >
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(description),
                  }}
                />

                {/* Visible test cases — hidden tests are already stripped
                server-side (P0-C4), so every test here is safe to show. */}
                {tests.length > 0 && (
                  <div className="mt-3">
                    <h4 className="mb-2 text-xs font-semibold uppercase text-text-3">
                      {t("testCases")}
                    </h4>
                    <div className="space-y-1.5">
                      {tests.map((tc) => (
                        <div
                          key={tc.id}
                          className="rounded-md border border-border p-2 text-xs [background:var(--input)]"
                        >
                          <span className="font-medium">{tc.description}</span>
                          <div className="mt-1 flex gap-4 font-mono text-text-3">
                            <span>
                              {t("input")}: <code>{tc.input}</code>
                            </span>
                            <span>
                              {t("expected")}: <code>{tc.expectedOutput}</code>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description resizer */}
              <div
                className="group relative h-1.5 shrink-0 cursor-row-resize border-y border-border transition-colors [background:var(--resizer-bg)] hover:[background:var(--primary-dim)]"
                onMouseDown={handleResizeStart("description")}
                role="separator"
                aria-orientation="horizontal"
                tabIndex={0}
              >
                <div className="absolute left-1/2 top-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors [background:var(--resizer-handle)] group-hover:[background:var(--primary)]" />
              </div>
            </>
          )}

          {/* Toolbar */}
          <div className="shrink-0 border-b border-border bg-card px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChallengeRunner
                  code={code}
                  tests={tests}
                  language={language}
                  buildType={buildType}
                  isDeployable={isDeployable}
                  onResult={handleResult}
                  onSubmit={handleSubmit}
                  isComplete={isComplete}
                  xpReward={xpReward}
                />
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1 text-xs"
                  aria-label={t("resetCode")}
                >
                  <ArrowCounterClockwise
                    size={16}
                    weight="duotone"
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">{t("resetCode")}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="relative min-h-0 flex-1">
            <CodeEditor
              ref={editorHandle}
              lessonId={lessonId}
              initialCode={initialCode}
              language={language}
              value={code}
              onChange={handleCodeChange}
              className="h-full rounded-none border-0"
            />

            {/* Enroll overlay — tests passed but not enrolled */}
            {pendingSubmit && !isEnrolled && !isComplete && (
              <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm [background:color-mix(in_srgb,var(--bg)_60%,transparent)]">
                <div className="flex flex-col items-center gap-3 rounded-xl border-[2.5px] border-border bg-card p-6 shadow-card">
                  <Trophy
                    size={32}
                    weight="duotone"
                    className="text-accent"
                    aria-hidden="true"
                  />
                  <p className="font-display text-lg font-black">
                    {t("testsPassed")}
                  </p>
                  <p className="text-sm text-text-3">
                    {t("enrollToSaveProgress")}
                  </p>
                  <Button variant="push" size="lg" onClick={onEnroll}>
                    {tCourses("enrollNow")}
                  </Button>
                </div>
              </div>
            )}

            {/* Saving overlay — shown while API call is in flight */}
            {isSaving && !isComplete && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center backdrop-blur-sm [background:color-mix(in_srgb,var(--bg)_60%,transparent)]">
                <div className="flex flex-col items-center gap-2 rounded-xl border-[2.5px] border-border bg-card p-6 shadow-card">
                  <div className="sol-spinner" aria-hidden="true" />
                  <p className="text-sm text-text-3">{t("savingProgress")}</p>
                </div>
              </div>
            )}

            {/* Failure overlay — the server rejected this submission */}
            {serverError && !isSaving && !isComplete && (
              <div
                role="alert"
                className="absolute inset-0 flex items-center justify-center backdrop-blur-sm [background:color-mix(in_srgb,var(--bg)_60%,transparent)]"
              >
                <div className="mx-4 flex max-w-sm flex-col items-center gap-3 rounded-xl border-[2.5px] border-border bg-card p-6 text-center shadow-card">
                  <X
                    size={28}
                    weight="bold"
                    className="text-danger"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-text-3">{serverError}</p>
                  <Button
                    variant="pushOutline"
                    size="default"
                    onClick={() => setServerError(null)}
                  >
                    {tCommon("retry")}
                  </Button>
                </div>
              </div>
            )}

            {/* Success overlay */}
            {isComplete && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center backdrop-blur-sm [background:color-mix(in_srgb,var(--bg)_60%,transparent)]">
                <div className="flex flex-col items-center gap-2 rounded-xl border-[2.5px] border-border bg-card p-6 shadow-card">
                  <Trophy
                    size={32}
                    weight="duotone"
                    className="text-accent"
                    aria-hidden="true"
                  />
                  <p className="font-display text-lg font-black">
                    {t("lessonComplete")}
                  </p>
                  <p className="text-sm text-success">
                    {t("xpEarned", { amount: earnedXp ?? xpReward })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor/output resizer — unchanged mechanism, hidden below lg since
            the panels stack in natural flow there instead. */}
        <div
          className="lg:group hidden h-1.5 shrink-0 cursor-row-resize border-y border-border transition-colors [background:var(--resizer-bg)] hover:[background:var(--primary-dim)] lg:relative lg:block"
          onMouseDown={handleResizeStart("output")}
          role="separator"
          aria-orientation="horizontal"
          aria-label={tA11y("resizeOutputPanel")}
          tabIndex={0}
        >
          <div className="absolute left-1/2 top-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors [background:var(--resizer-handle)] group-hover:[background:var(--primary)]" />
        </div>

        {/* Output panel */}
        <div
          className="order-3 shrink-0 lg:order-none"
          style={{ height: panelHeight, minHeight: 100 }}
        >
          <OutputPanel
            executionResult={challengeState.executionResult}
            isRunning={challengeState.status === "running"}
            onClear={handleClearOutput}
            className="h-full rounded-none border-0"
          />
        </div>
      </div>

      {/* Workspace/rail horizontal resizer — lg+ only; drag to rebalance the
          editor against the task/AI rail. */}
      <div
        className="group hidden w-1.5 shrink-0 cursor-col-resize border-x border-border transition-colors [background:var(--resizer-bg)] hover:[background:var(--primary-dim)] lg:relative lg:block"
        onMouseDown={handleRailResizeStart}
        role="separator"
        aria-orientation="vertical"
        aria-label={tA11y("resizeRailPanel")}
        tabIndex={0}
      >
        <div className="absolute left-1/2 top-1/2 h-8 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors [background:var(--resizer-handle)] group-hover:[background:var(--primary)]" />
      </div>

      {/* RIGHT rail: task brief on top, AI Partner below, resizable split.
          Width is drag-adjustable (railWidth); below lg, `contents` flattens
          this into the root flex-col so task/AI take their `order` slots. */}
      <div
        className="contents lg:flex lg:shrink-0 lg:flex-col lg:overflow-hidden"
        style={{ width: railWidth }}
      >
        {/* Task brief */}
        <div
          className="order-1 overflow-auto max-lg:!h-auto lg:order-none lg:shrink-0"
          style={{ height: taskHeight }}
        >
          {taskSlot}
        </div>

        {/* Task/AI resizer — same drag mechanic as the editor/output one. */}
        <div
          className="lg:group hidden h-1.5 shrink-0 cursor-row-resize border-y border-border transition-colors [background:var(--resizer-bg)] hover:[background:var(--primary-dim)] lg:relative lg:block"
          onMouseDown={handleResizeStart("task")}
          role="separator"
          aria-orientation="horizontal"
          aria-label={tA11y("resizeTaskPanel")}
          tabIndex={0}
        >
          <div className="absolute left-1/2 top-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors [background:var(--resizer-handle)] group-hover:[background:var(--primary)]" />
        </div>

        {/* AI Partner */}
        <div className="order-4 lg:order-none lg:min-h-0 lg:flex-1">
          <AiPartnerPane
            lessonSlug={lessonSlug}
            courseSlug={courseSlug}
            hints={hints}
            getCode={() => code}
            getTestSummary={() => summarize(challengeState.executionResult)}
            onApply={(proposed) => setCode(proposed)}
            disabled={isComplete}
            className="h-full rounded-none border-0"
          />
        </div>
      </div>
    </div>
  );
}
