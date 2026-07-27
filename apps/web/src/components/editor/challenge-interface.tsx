"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowCounterClockwise,
  CheckCircle,
  Eye,
  Lightbulb,
  Trophy,
  X,
} from "@phosphor-icons/react";
import {
  challengeKindFor,
  trackChallengeFailed,
  trackChallengeRun,
  trackChallengeSolved,
  trackChallengeStarted,
  trackSolutionRevealed,
  trackStuckNudgeAccepted,
  trackStuckNudgeShown,
} from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shouldShowEncouragement } from "@/lib/gamification/celebration";
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

const LESSON_COMPLETE_EVENT = "superteam:lesson-complete";

// Think-first lock (#770): how long the AI Partner stays locked after a
// challenge is first opened, so learners attempt it before asking for help.
const AI_LOCK_MS = 3 * 60 * 1000;
// Carries the passing code to lesson-client WITHOUT driving a completion, so an
// anonymous learner's submission can be banked before they enroll (LX-A4c).
const CHALLENGE_PROOF_EVENT = "superteam:challenge-proof";

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
  courseId,
  courseSlug,
  lessonSlug,
  taskSlot,
  initialCode,
  language,
  buildType,
  isDeployable,
  tests,
  hints,
  solution,
  xpReward,
  earnedXp,
  isAlreadyCompleted,
  isEnrolled: isEnrolledProp,
  onEnroll,
  onComplete,
  aiSuppressed = false,
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

  // Struggling-encouragement state (LX-B11 / F11, R10): count consecutive
  // failed runs; a passing run resets the counter and the dismissal.
  const [consecutiveFails, setConsecutiveFails] = useState(0);
  const [encouragementDismissed, setEncouragementDismissed] = useState(false);

  // Stuck-nudge v1 (LX-C4): once the encouragement threshold is crossed AND the
  // challenge ships authored hints, the same banner offers to reveal one hint at
  // a time in-editor (the free authored-hint channel, never the AI chat). A
  // passing run resets the reveal. `nudgeShownRef` records whether the nudge was
  // ever surfaced this attempt so the eventual solve can be tagged postNudge.
  const [revealedHintCount, setRevealedHintCount] = useState(0);
  const nudgeShownRef = useRef(false);

  // Solution-reveal soft-gate (LX-C6). The reference solution already ships in
  // the client payload; this gates it behind a deliberate, confirmed click
  // (never auto-shown, never refused — one-tap override, AIE-27). Confirming
  // logs the reveal and best-effort reschedules the lesson into the review
  // queue; the XP path is untouched (xpPerLesson is fixed on-chain — the only
  // consequence is review-scheduling + framing).
  const [solutionGate, setSolutionGate] = useState<
    "closed" | "confirming" | "revealed"
  >("closed");
  // Honest copy (AIE-27): the "marked for review" note is claimed ONLY after the
  // server confirms the reschedule (2xx + scheduled=true). The reschedule is
  // best-effort — it no-ops for an anonymous learner (401) and can fail
  // transiently — so until it is confirmed the revealed panel makes no queue
  // claim, only self-study guidance.
  const [reviewScheduled, setReviewScheduled] = useState(false);

  // Analytics (LX-F1): challenge lifecycle events compose alongside the
  // existing state. The fail streak is mirrored in a ref because the state
  // above updates functionally (no synchronous read at event time), and side
  // effects inside state updaters would double-fire under StrictMode.
  const challengeKind = challengeKindFor(language, buildType);
  const failStreakRef = useRef(0);

  const editorHandle = useRef<CodeEditorHandle>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);

  // challenge_started = first genuine interaction, never a page view. A
  // keystroke in the editor area is that signal for edit-first learners
  // (CodeEditor's onChange also fires for the localStorage restore on mount,
  // so it can't be used); run-first learners are covered in handleResult.
  // trackChallengeStarted dedupes per lesson per session.
  useEffect(() => {
    const el = editorAreaRef.current;
    if (!el) return;
    const fireStarted = () =>
      trackChallengeStarted({ lessonId, courseId, challengeKind });
    el.addEventListener("keydown", fireStarted, { capture: true });
    return () =>
      el.removeEventListener("keydown", fireStarted, { capture: true });
  }, [lessonId, courseId, challengeKind]);

  // Sync when the async DB check resolves after mount.
  // Also fires when lesson-client sets isCompleted=true after API returns —
  // this is when we show the calm completion acknowledgment. No confetti here:
  // celebration is reserved for deploy + credential-mint milestones (LX-B11).
  const prevIsAlreadyCompleted = useRef(isAlreadyCompleted ?? false);
  useEffect(() => {
    if (isAlreadyCompleted && !prevIsAlreadyCompleted.current) {
      setIsComplete(true);
      setIsSaving(false);
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

  // The AI Partner sits at the bottom of the left reading column and is ALWAYS
  // mounted (#770). It used to reveal only once a scroll sentinel hit the
  // viewport, but in the compact full-height layout the left column scrolls
  // internally and that sentinel could never intersect — the tutor was simply
  // unreachable. Discoverability is not the gate: the think-first timer below
  // is. `aiSuppressed` (an unanswered quiz block, LX-C1/F18) still hides it.
  const aiVisible = !aiSuppressed;

  // AI Partner think-first lock (#770): the tutor stays locked for AI_LOCK_MS
  // after a challenge is first opened. The open timestamp is persisted per
  // lesson so a reload can't reset the timer; already-complete lessons are
  // exempt (aiUnlockAt = null).
  const [aiUnlockAt, setAiUnlockAt] = useState<number | null>(null);
  useEffect(() => {
    if (isComplete || typeof window === "undefined") {
      setAiUnlockAt(null);
      return;
    }
    const key = `challenge:ai-open:${lessonId}`;
    const stored = Number(window.localStorage.getItem(key));
    const openedAt =
      Number.isFinite(stored) && stored > 0 ? stored : Date.now();
    if (openedAt !== stored) {
      try {
        window.localStorage.setItem(key, String(openedAt));
      } catch {
        // Private-mode / quota — fall back to a session-only timer.
      }
    }
    setAiUnlockAt(openedAt + AI_LOCK_MS);
  }, [lessonId, isComplete]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setServerError(null);
  }, []);

  const handleResult = useCallback(
    (result: ExecutionResult) => {
      setChallengeState((prev) => ({
        ...prev,
        status: result.success ? "success" : "error",
        executionResult: result,
      }));
      // Lifecycle events (LX-F1): a run reaching a result IS an interaction,
      // so run-first learners get their challenge_started here (deduped).
      const ctx = { lessonId, courseId, challengeKind };
      trackChallengeStarted(ctx);
      trackChallengeRun(ctx);
      if (result.success) {
        failStreakRef.current = 0;
        trackChallengeSolved(ctx, { postNudge: nudgeShownRef.current });
        nudgeShownRef.current = false;
        setConsecutiveFails(0);
        setEncouragementDismissed(false);
        setRevealedHintCount(0);
      } else {
        failStreakRef.current += 1;
        trackChallengeFailed(ctx, failStreakRef.current);
        setConsecutiveFails((prev) => prev + 1);
      }
    },
    [lessonId, courseId, challengeKind]
  );

  // Stuck-nudge visibility (LX-C4) — the same threshold + dismissal that drive
  // the encouragement copy, further gated on there being an authored hint to
  // surface. Authored hints are a static content channel, so revealing one is
  // safe even while the AI pane is suppressed (LX-C1/F18): the nudge points at
  // hints, never at the tutor.
  const hasHints = hints.length > 0;
  const nudgeVisible =
    shouldShowEncouragement(consecutiveFails) &&
    !encouragementDismissed &&
    !isComplete;
  const hintNudgeVisible = nudgeVisible && hasHints;

  // One `stuck_nudge_shown` per lesson exposure (the event helper dedupes), and
  // record the exposure so the eventual solve is tagged postNudge.
  useEffect(() => {
    if (!hintNudgeVisible) return;
    nudgeShownRef.current = true;
    trackStuckNudgeShown(
      { lessonId, courseId, challengeKind },
      consecutiveFails
    );
  }, [hintNudgeVisible, consecutiveFails, lessonId, courseId, challengeKind]);

  const handleRevealHint = useCallback(() => {
    setRevealedHintCount((count) => {
      if (count >= hints.length) return count;
      trackStuckNudgeAccepted({ lessonId, courseId, challengeKind }, count);
      return count + 1;
    });
  }, [hints.length, lessonId, courseId, challengeKind]);

  const hasSolution =
    typeof solution === "string" && solution.trim().length > 0;

  const handleConfirmRevealSolution = useCallback(() => {
    setSolutionGate("revealed");
    setReviewScheduled(false);
    trackSolutionRevealed({ lessonId, courseId, challengeKind });
    // Best-effort reschedule into the review queue. The reveal itself never
    // blocks on this: an anonymous learner (401) or a transient failure still
    // gets the solution — only the review row is skipped. The revealed panel
    // claims "marked for review" ONLY if this confirms (2xx + scheduled=true),
    // so the copy never asserts a reschedule that did not happen.
    void fetch("/api/lessons/reveal-solution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseSlug, lessonSlug }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { scheduled?: unknown } | null) => {
        if (body && body.scheduled === true) setReviewScheduled(true);
      })
      .catch(() => {});
  }, [lessonId, courseId, challengeKind, courseSlug, lessonSlug]);

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
    // isAlreadyCompleted=true when done, which triggers the completion overlay.
    // The submitted code travels with the event so the server can re-validate
    // it authoritatively (the browser test pass is UX-only).
    const event = new CustomEvent(LESSON_COMPLETE_EVENT, {
      detail: { lessonId, submittedCode: code },
    });
    window.dispatchEvent(event);
  }, [lessonId, onComplete, code]);

  const handleSubmit = useCallback(() => {
    if (!isEnrolled) {
      // Tests passed but not enrolled — prompt enrollment. Stash the passing
      // code first so it is banked if the learner is anonymous and chooses
      // "Later" at the sign-in prompt (LX-A4c).
      window.dispatchEvent(
        new CustomEvent(CHALLENGE_PROOF_EVENT, {
          detail: { lessonId, submittedCode: code },
        })
      );
      setPendingSubmit(true);
      return;
    }
    completeLesson();
  }, [isEnrolled, completeLesson, lessonId, code]);

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

        {/* AI Partner — collapsed until the sentinel is reached, then slides in.
            The pane is NOT mounted while collapsed: a CSS-only hide (max-h-0 /
            overflow-hidden) would keep its inputs and buttons in the tab order,
            letting a keyboard user land on invisible controls (WCAG 4.1.2). The
            transition still runs because it lives on this always-mounted
            wrapper — the pane simply mounts as the envelope grows. */}
        <div
          className={cn(
            "order-4 px-3 transition-all duration-500 ease-out motion-reduce:transition-none lg:order-none lg:shrink-0",
            aiVisible
              ? "max-h-[760px] translate-y-0 pb-4 pt-2 opacity-100"
              : "max-h-0 translate-y-3 overflow-hidden opacity-0"
          )}
        >
          {aiVisible && (
            <div className="h-[600px]">
              <AiPartnerPane
                lessonSlug={lessonSlug}
                courseSlug={courseSlug}
                hints={hints}
                getCode={() => code}
                getTestSummary={() => summarize(challengeState.executionResult)}
                onApply={(proposed) => setCode(proposed)}
                disabled={isComplete}
                solutionPassed={challengeState.status === "success"}
                unlockAt={aiUnlockAt}
                className="h-full rounded-none border-0"
              />
            </div>
          )}
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
                {/* Reference solution is a post-completion reward, not a crutch:
                    the button only appears once the challenge is verified
                    complete, and reveals directly. The LX-C6 confirm step +
                    /api/lessons/reveal-solution review-reschedule are retained
                    below but unreachable via this path (follow-up: #770). */}
                {hasSolution && isComplete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSolutionGate((s) =>
                        s === "revealed" ? "closed" : "revealed"
                      )
                    }
                    className="gap-1 text-xs"
                    aria-expanded={solutionGate !== "closed"}
                    aria-controls="reference-solution-panel"
                  >
                    <Eye size={16} weight="duotone" aria-hidden="true" />
                    <span className="hidden sm:inline">
                      {t("viewSolution")}
                    </span>
                  </Button>
                )}
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

          {/* Solution-reveal soft-gate panel (LX-C6). Confirming step is a
              non-blocking nudge, not a refusal: the learner can back out or
              reveal in one tap. The reveal itself is a deliberate, logged click
              that reschedules the lesson into review — the XP path is untouched.
              role="region" so the disclosure is announced; the code is read-only
              reference, never editable. */}
          {hasSolution && solutionGate !== "closed" && (
            <div
              id="reference-solution-panel"
              role="region"
              aria-label={t("solutionRevealedLabel")}
              className="shrink-0 border-b border-border bg-card px-3 py-3"
            >
              {solutionGate === "confirming" ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-text-3">
                    <span className="font-bold text-text">
                      {t("solutionGateTitle")}
                    </span>{" "}
                    {t("solutionGateBody")}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="push"
                      size="sm"
                      onClick={handleConfirmRevealSolution}
                      className="text-xs"
                    >
                      {t("solutionGateConfirm")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSolutionGate("closed")}
                      className="text-xs"
                    >
                      {t("solutionGateCancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold uppercase text-text-3">
                      {t("solutionRevealedLabel")}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSolutionGate("closed")}
                      className="shrink-0 text-text-3 transition-colors hover:text-text"
                      aria-label={tCommon("close")}
                    >
                      <X size={14} weight="bold" aria-hidden="true" />
                    </button>
                  </div>
                  <pre className="max-h-64 overflow-auto rounded-md border border-border p-2.5 text-xs [background:var(--input)]">
                    <code>{solution}</code>
                  </pre>
                  <p className="text-xs text-text-3">
                    {reviewScheduled
                      ? t("solutionReviewScheduledNote")
                      : t("solutionRevealedNote")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Editor */}
          <div ref={editorAreaRef} className="relative min-h-0 flex-1">
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

            {/* Success overlay — calm checkmark acknowledgment (LX-B11) */}
            {isComplete && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center backdrop-blur-sm [background:color-mix(in_srgb,var(--bg)_60%,transparent)]">
                <div className="flex flex-col items-center gap-2 rounded-xl border-[2.5px] border-border bg-card p-6 shadow-card">
                  <CheckCircle
                    size={32}
                    weight="duotone"
                    className="text-success"
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

        {/* Struggling encouragement + stuck-nudge — supportive, non-blocking
            banner after ≥3 consecutive failed runs (LX-B11 / F11, R10). When the
            challenge ships authored hints (LX-C4) the banner also reveals them
            one at a time in-editor; while the AI pane is suppressed (LX-C1/F18)
            the copy points at hints only, never the tutor. role="status" is a
            polite live region, so a newly revealed hint is announced without
            stealing focus. */}
        {nudgeVisible && (
          <div
            role="status"
            className="order-3 flex shrink-0 flex-col gap-2 border-t border-border bg-card px-3 py-2 lg:order-none"
          >
            <div className="flex items-center gap-2">
              <Lightbulb
                size={18}
                weight="duotone"
                className="shrink-0 text-accent"
                aria-hidden="true"
              />
              <p className="flex-1 text-xs text-text-3">
                <span className="font-bold text-text">
                  {t("encouragementTitle")}
                </span>{" "}
                {aiSuppressed
                  ? hasHints
                    ? t("encouragementBodyHintsOnly")
                    : t("encouragementBodyNeutral")
                  : t("encouragementBody")}
              </p>
              <button
                onClick={() => setEncouragementDismissed(true)}
                className="shrink-0 text-text-3 transition-colors hover:text-text"
                aria-label={tA11y("dismiss")}
              >
                <X size={14} weight="bold" aria-hidden="true" />
              </button>
            </div>

            {hasHints && (
              <div className="flex flex-col gap-1.5 pl-6">
                {hints.slice(0, revealedHintCount).map((hint, i) => (
                  <p key={i} className="text-xs text-text-2">
                    <span className="font-semibold text-text">
                      {t("stuckNudgeHintLabel", { number: i + 1 })}
                    </span>{" "}
                    {hint}
                  </p>
                ))}
                {revealedHintCount < hints.length && (
                  <button
                    type="button"
                    onClick={handleRevealHint}
                    className="self-start rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text transition-colors hover:border-primary hover:[background:var(--accent-bg)]"
                  >
                    {revealedHintCount === 0
                      ? t("stuckNudgeAction")
                      : t("stuckNudgeNextAction")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Output panel */}
        <div
          className="order-3 shrink-0 lg:order-none"
          style={{ height: panelHeight, minHeight: 88 }}
        >
          <OutputPanel
            executionResult={challengeState.executionResult}
            tests={tests}
            isRunning={challengeState.status === "running"}
            onClear={handleClearOutput}
            className="h-full rounded-none border-0"
          />
        </div>
      </div>
    </div>
  );
}
