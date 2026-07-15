"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise, Trophy, X } from "@phosphor-icons/react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const [panelHeight, setPanelHeight] = useState(120);
  // null = default 50/50 (both columns flex-1); a number = the user dragged the
  // text column to that pixel width. Starting null keeps the split even.
  const [leftWidth, setLeftWidth] = useState<number | null>(null);
  const resizeRef = useRef<{ startY: number; startHeight: number } | null>(
    null
  );
  const splitResizeRef = useRef<{ startX: number; startWidth: number } | null>(
    null
  );
  const leftColRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // The AI Partner sits at the bottom of the left reading column and stays
  // hidden until the learner scrolls to the end of the description — then it
  // slides in. `root: null` watches the viewport, so this works whether the
  // column scrolls internally (lg+) or the page scrolls (below lg). Once
  // revealed it stays revealed.
  const [aiRevealed, setAiRevealed] = useState(false);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || aiRevealed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setAiRevealed(true);
      },
      { root: null, rootMargin: "0px 0px -32px 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [aiRevealed]);

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

  // Vertical drag for the editor/output split — the resizer sits above the
  // output panel, so dragging up makes the output taller.
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeRef.current = { startY: e.clientY, startHeight: panelHeight };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeRef.current) return;
        const delta = resizeRef.current.startY - moveEvent.clientY;
        const newHeight = Math.max(
          88,
          Math.min(500, resizeRef.current.startHeight + delta)
        );
        setPanelHeight(newHeight);
      };

      const handleMouseUp = () => {
        resizeRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [panelHeight]
  );

  // Horizontal (X-axis) drag for the text/editor split. The text column is on
  // the left and the handle sits on its right edge, so dragging right widens
  // the text. Clamp the max against the container so the editor keeps ≥360px.
  const handleSplitResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startWidth = leftWidth ?? leftColRef.current?.clientWidth ?? 460;
      const container = leftColRef.current?.parentElement;
      const maxW = container ? Math.max(360, container.clientWidth - 360) : 900;
      splitResizeRef.current = { startX: e.clientX, startWidth };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!splitResizeRef.current) return;
        const delta = moveEvent.clientX - splitResizeRef.current.startX;
        const next = Math.max(
          320,
          Math.min(maxW, splitResizeRef.current.startWidth + delta)
        );
        setLeftWidth(next);
      };

      const handleMouseUp = () => {
        splitResizeRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [leftWidth]
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden lg:flex-row",
        className
      )}
    >
      {/* LEFT: lesson text — full height, scrollable as one column. The AI
          Partner lives at the very bottom and stays hidden until the learner
          scrolls to the end of the description, then slides in (LeetCode-style
          reading pane). Below lg, `contents` flattens this so the text
          (order-1) and AI (order-4) bracket the editor/output (order-2/3). */}
      <div
        ref={leftColRef}
        className={cn(
          "contents lg:flex lg:min-w-0 lg:flex-col lg:overflow-auto",
          leftWidth === null ? "lg:flex-1" : "lg:shrink-0"
        )}
        style={leftWidth !== null ? { width: leftWidth } : undefined}
      >
        {/* Instructions + test cases */}
        <div className="order-1 lg:order-none lg:shrink-0">{taskSlot}</div>

        {/* Reveal sentinel — entering the viewport unhides the AI Partner. */}
        <div
          ref={sentinelRef}
          aria-hidden="true"
          className="order-1 h-px w-full shrink-0 lg:order-none"
        />

        {/* AI Partner — collapsed until the sentinel is reached, then slides in. */}
        <div
          aria-hidden={!aiRevealed}
          className={cn(
            "order-4 px-3 transition-all duration-500 ease-out motion-reduce:transition-none lg:order-none lg:shrink-0",
            aiRevealed
              ? "max-h-[760px] translate-y-0 pb-4 pt-2 opacity-100"
              : "pointer-events-none max-h-0 translate-y-3 overflow-hidden opacity-0"
          )}
        >
          <div className="h-[600px]">
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

      {/* Text/editor split resizer — lg+ only; drag right to widen the text. */}
      <div
        className="group hidden w-1.5 shrink-0 cursor-col-resize border-x border-border transition-colors [background:var(--resizer-bg)] hover:[background:var(--primary-dim)] lg:relative lg:block"
        onMouseDown={handleSplitResizeStart}
        role="separator"
        aria-orientation="vertical"
        aria-label={tA11y("resizeRailPanel")}
        tabIndex={0}
      >
        <div className="absolute left-1/2 top-1/2 h-8 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors [background:var(--resizer-handle)] group-hover:[background:var(--primary)]" />
      </div>

      {/* RIGHT: code editor + output — full height. Below lg, `contents`
          flattens this so the editor (order-2) and output (order-3) slot
          between the text (order-1) and the AI Partner (order-4). */}
      <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:overflow-hidden">
        <div className="order-2 flex min-h-0 flex-col overflow-hidden lg:order-none lg:flex-1">
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

        {/* Editor/output resizer — lg+ only; below lg the panels stack in
            natural flow instead. */}
        <div
          className="lg:group hidden h-1.5 shrink-0 cursor-row-resize border-y border-border transition-colors [background:var(--resizer-bg)] hover:[background:var(--primary-dim)] lg:relative lg:block"
          onMouseDown={handleResizeStart}
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
          style={{ height: panelHeight, minHeight: 88 }}
        >
          <OutputPanel
            executionResult={challengeState.executionResult}
            isRunning={challengeState.status === "running"}
            onClear={handleClearOutput}
            className="h-full rounded-none border-0"
          />
        </div>
      </div>
    </div>
  );
}
