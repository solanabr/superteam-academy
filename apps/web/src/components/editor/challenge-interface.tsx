"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowCounterClockwise,
  CheckCircle,
  Eye,
  Lightbulb,
  MagicWand,
  Trophy,
  X,
} from "@phosphor-icons/react";
import {
  challengeKindFor,
  trackChallengeFailed,
  trackChallengeRun,
  trackChallengeSolved,
  trackChallengeStarted,
  trackAttemptGateNudgeShown,
  trackSolutionRevealed,
  trackStuckNudgeShown,
} from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shouldShowEncouragement } from "@/lib/gamification/celebration";
import { CodeEditor, resetEditorStorage } from "./code-editor";
import { canFormatLanguage } from "./formatting";
import { Stopwatch } from "./stopwatch";
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

// Submit verdict state machine (#942 PR A). `judging` renders while the
// server-side save is in flight; `accepted`/`rejected` are the server's
// verdict, driven by the existing event contract (isAlreadyCompleted flip /
// superteam:lesson-complete-error) — the grading path itself is untouched.
type Verdict = "idle" | "judging" | "accepted" | "rejected";

// Duration of the accepted-flash on the editor card (green flash settling to
// amber, brand-guide terminal-frame treatment). Mirrors the CSS animation.
const VERDICT_FLASH_MS = 600;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

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
  sectionsSlot,
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
  capstoneAiOff = false,
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
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Verdict state machine (#942 PR A). A lesson already completed on mount
  // starts settled at `accepted` — no flash for a prior visit's verdict.
  const [verdict, setVerdict] = useState<Verdict>(
    isAlreadyCompleted ? "accepted" : "idle"
  );
  // True during the ~600ms green-flash on the editor card; the Accepted card
  // appears once the flash settles to amber. Reduced motion skips the flash
  // entirely (instant settle).
  const [verdictFlash, setVerdictFlash] = useState(false);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const isComplete = verdict === "accepted";

  // Struggling-encouragement state (LX-B11 / F11, R10): count consecutive
  // failed runs; a passing run resets the counter and the dismissal.
  const [consecutiveFails, setConsecutiveFails] = useState(0);
  const [encouragementDismissed, setEncouragementDismissed] = useState(false);

  // Stuck-nudge v1 (LX-C4): once the encouragement threshold is crossed AND the
  // challenge ships authored hints, the same banner offers to reveal one hint at
  // a time in-editor (the free authored-hint channel, never the AI chat). A
  // passing run resets the reveal. `nudgeShownRef` records whether the nudge was
  // ever surfaced this attempt so the eventual solve can be tagged postNudge.
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
  // that flip IS the acceptance verdict. The editor card plays the brand-guide
  // green-flash-settling-to-amber treatment (skipped under reduced motion),
  // then the Accepted card shows the earned XP. No confetti here: celebration
  // is reserved for deploy + credential-mint milestones (LX-B11).
  const prevIsAlreadyCompleted = useRef(isAlreadyCompleted ?? false);
  useEffect(() => {
    if (isAlreadyCompleted && !prevIsAlreadyCompleted.current) {
      setVerdict("accepted");
      setRejectReason(null);
      if (!prefersReducedMotion()) setVerdictFlash(true);
    }
    prevIsAlreadyCompleted.current = isAlreadyCompleted ?? false;
  }, [isAlreadyCompleted]);

  // The flash is one-shot: settle to amber after the animation runs.
  useEffect(() => {
    if (!verdictFlash) return;
    const id = setTimeout(() => setVerdictFlash(false), VERDICT_FLASH_MS);
    return () => clearTimeout(id);
  }, [verdictFlash]);

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
  // unreachable. `aiSuppressed` (an unanswered quiz block, LX-C1/F18) still
  // hides it.
  // `capstoneAiOff` (#867) beats `aiSuppressed`: the capstone never gets a
  // tutor, so the pane is not mounted at all — and unlike quiz suppression the
  // slot is not left empty, it carries the explanation rendered below.
  const aiVisible = !aiSuppressed && !capstoneAiOff;

  // Attempt-gate signal (#865, replaces the #770 hard think-first lock): the
  // AI Partner is never locked, but until the learner has run the tests at
  // least once on this challenge, its first use surfaces a soft nudge with a
  // free one-tap override. Session-scoped by design — the nudge is a gentle
  // per-visit suggestion, not a persisted gate, so nothing is stored.
  const [hasRunTests, setHasRunTests] = useState(false);
  // Propose-visibility signal (#947): the AI Partner offers "Show me a change"
  // only once the learner has seen a run FAIL — a concrete diff is never the
  // opening move. Sticky for the visit (a later pass does not retract it) and,
  // like `hasRunTests`, session-scoped rather than persisted.
  const [hasFailedRun, setHasFailedRun] = useState(false);
  const runButtonRef = useRef<HTMLButtonElement>(null);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    // Editing after a rejection is the natural retry — clear the verdict.
    setVerdict((v) => (v === "rejected" ? "idle" : v));
  }, []);

  const handleResult = useCallback(
    (result: ExecutionResult) => {
      setChallengeState((prev) => ({
        ...prev,
        status: result.success ? "success" : "error",
        executionResult: result,
      }));
      // Any run result — pass or fail — counts as an attempt: seeing the
      // tests fail is exactly what the attempt-gate nudge asks for (#865).
      setHasRunTests(true);
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
      } else {
        failStreakRef.current += 1;
        trackChallengeFailed(ctx, failStreakRef.current);
        setConsecutiveFails((prev) => prev + 1);
        setHasFailedRun(true);
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

  // The button is only offered for languages we can actually format.
  const canFormat = canFormatLanguage(language);
  // A formatter that does nothing must SAY so. Success is silent — the
  // reformatted buffer is its own feedback — but every other outcome gets a
  // short localized note, which is what the original silent no-op lacked.
  const [formatNote, setFormatNote] = useState<string | null>(null);
  const handleFormat = useCallback(async () => {
    const status = await editorHandle.current?.format();
    setFormatNote(
      !status || status === "formatted"
        ? null
        : t(
            status === "syntax-error"
              ? "formatSyntaxError"
              : status === "unchanged"
                ? "formatUnchanged"
                : "formatUnsupported"
          )
    );
  }, [t]);

  // The note is transient — it explains one click, and must not linger over
  // the next edit.
  useEffect(() => {
    if (!formatNote) return;
    const id = setTimeout(() => setFormatNote(null), 5000);
    return () => clearTimeout(id);
  }, [formatNote]);

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
    setRejectReason(null);
    setVerdict("judging");
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
  // and fires this with a localized reason; that IS the rejection verdict.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ lessonId: string; message: string }>)
        .detail;
      if (detail.lessonId !== lessonId) return;
      setPendingSubmit(false);
      setVerdict("rejected");
      setRejectReason(detail.message);
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
          (order-1) and AI (order-4) bracket the editor/output (order-2/3).
          Hidden entirely when it would be EMPTY — the non-first editor of a
          multi-challenge lesson has no instructions, no sections, and often a
          suppressed AI pane, which rendered as a blank white card (#457). */}
      {(taskSlot || capstoneAiOff || aiVisible || sectionsSlot) && (
        <div
          ref={leftColRef}
          className={cn(
            // #942 item 4: a bordered card at lg (page background shows in the
            // gutter around and between the panes).
            "contents lg:flex lg:min-w-0 lg:flex-col lg:overflow-auto lg:rounded-[var(--r-lg)] lg:border lg:border-border lg:bg-card",
            leftWidth === null ? "lg:flex-1" : "lg:shrink-0"
          )}
          style={leftWidth !== null ? { width: leftWidth } : undefined}
        >
          {/* Instructions + test cases. A lesson with several code blocks
            threads instructions into the FIRST editor only — later editors
            must not render an empty white rail card (#457 arrived with C1
            lesson 7's two-challenge layout). */}
          {taskSlot ? (
            <div className="order-1 lg:order-none lg:shrink-0">{taskSlot}</div>
          ) : null}

          {/* AI Partner — sized to its CONTENT, never a fixed box (#770). It used
            to force h-[600px] inside a max-h-[760px] envelope, which reserved a
            huge empty region below the rail once the pane became always-mounted
            and collapsible. Now it grows with the conversation and caps out,
            scrolling internally past the cap. Hidden outright when suppressed so
            no invisible controls sit in the tab order (WCAG 4.1.2). */}
          {/* Capstone AI-free notice (#867) — replaces the pane, never sits
            alongside it. Static text, no controls, so nothing enters the tab
            order; role="note" announces it as context rather than a status
            change or an error. */}
          {capstoneAiOff && (
            <div
              role="note"
              className="order-4 px-3 pb-4 pt-2 lg:order-none lg:shrink-0"
            >
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-sm font-bold text-text">
                  {t("capstoneAiOffTitle")}
                </p>
                <p className="mt-1 text-xs text-text-3">
                  {t("capstoneAiOffBody")}
                </p>
              </div>
            </div>
          )}

          <div
            className={cn(
              "order-4 px-3 pb-4 pt-2 lg:order-none lg:shrink-0",
              !aiVisible && "hidden"
            )}
          >
            {aiVisible && (
              <AiPartnerPane
                lessonSlug={lessonSlug}
                courseSlug={courseSlug}
                getCode={() => code}
                getTestSummary={() => summarize(challengeState.executionResult)}
                onApply={(proposed) => setCode(proposed)}
                disabled={isComplete}
                solutionPassed={challengeState.status === "success"}
                hasRunTests={hasRunTests || isComplete}
                hasFailedRun={hasFailedRun}
                onNudgeShown={() =>
                  trackAttemptGateNudgeShown({
                    lessonId,
                    courseId,
                    challengeKind,
                  })
                }
                eventCtx={{ lessonId, courseId, challengeKind }}
                className="max-h-[560px]"
              />
            )}
          </div>

          {/* Disclosure sections (Topics / Hints / Discussion) — under the AI
            pane per the owner's reading-flow ordering (#942). */}
          {sectionsSlot && (
            <div className="order-5 px-3 pb-4 lg:order-none lg:shrink-0">
              {sectionsSlot}
            </div>
          )}
        </div>
      )}

      {/* Text/editor split resizer — lg+ only; drag right to widen the text.
          Pointless without a left column to resize. */}
      {(taskSlot || capstoneAiOff || aiVisible || sectionsSlot) && (
        <div
          className="group hidden w-2 shrink-0 cursor-col-resize bg-transparent lg:relative lg:block"
          onMouseDown={handleSplitResizeStart}
          role="separator"
          aria-orientation="vertical"
          aria-label={tA11y("resizeRailPanel")}
          tabIndex={0}
        >
          <div className="absolute left-1/2 top-1/2 h-8 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors [background:var(--resizer-handle)] group-hover:[background:var(--primary)]" />
        </div>
      )}

      {/* RIGHT: code editor + output — full height. Below lg, `contents`
          flattens this so the editor (order-2) and output (order-3) slot
          between the text (order-1) and the AI Partner (order-4). */}
      <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:overflow-hidden lg:rounded-[var(--r-lg)] lg:border lg:border-border lg:bg-card">
        {/* Verdict treatment target (#942 PR A): on acceptance the card
            plays the brand-guide green flash and settles to an amber glow
            (CSS: .verdict-card in globals.css; reduced motion collapses the
            flash to an instant settle). */}
        <div
          className="verdict-card order-2 flex min-h-0 flex-col overflow-hidden lg:order-none lg:flex-1"
          data-verdict={verdict}
          data-verdict-flash={verdictFlash ? "" : undefined}
        >
          {/* Toolbar */}
          <div className="shrink-0 border-b border-border bg-card px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChallengeRunner
                  runButtonRef={runButtonRef}
                  code={code}
                  tests={tests}
                  language={language}
                  buildType={buildType}
                  isDeployable={isDeployable}
                  onResult={handleResult}
                  onSubmit={handleSubmit}
                  // `judging` counts as complete for the runner: it hides
                  // Submit while a submission is in flight (double-dispatch
                  // guard — the server dedups, but the button shouldn't ask).
                  isComplete={isComplete || verdict === "judging"}
                  xpReward={xpReward}
                />
              </div>

              <div className="flex items-center gap-1">
                {/* Personal stopwatch (#942 follow-up) — client-only, per
                    lesson, never wired to XP or grading. */}
                <Stopwatch lessonId={lessonId} />
                {canFormat && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleFormat()}
                    className="gap-1 text-xs"
                    aria-label={t("formatCode")}
                  >
                    <MagicWand size={16} weight="duotone" aria-hidden="true" />
                    <span className="hidden sm:inline">{t("formatCode")}</span>
                  </Button>
                )}
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

            {/* Why Format did nothing. Its own line rather than a squeeze into
                the button row, so the reason is readable at any width.
                role="status" announces it politely without stealing focus. */}
            {formatNote && (
              <p role="status" className="mt-1.5 text-xs text-text-3">
                {formatNote}
              </p>
            )}
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

            {/* Judging overlay — the server-side save/re-validation is in
                flight. role="status" announces it politely. */}
            {verdict === "judging" && (
              <div
                role="status"
                className="pointer-events-none absolute inset-0 flex items-center justify-center backdrop-blur-sm [background:color-mix(in_srgb,var(--bg)_60%,transparent)]"
              >
                <div className="flex flex-col items-center gap-2 rounded-xl border-[2.5px] border-border bg-card p-6 shadow-card">
                  <div className="sol-spinner" aria-hidden="true" />
                  <p className="font-display text-base font-black">
                    {t("verdictJudging")}
                  </p>
                  <p className="text-sm text-text-3">{t("savingProgress")}</p>
                </div>
              </div>
            )}

            {/* Rejected verdict — the server denied this submission. Shows the
                localized deny reason with an explicit Retry. */}
            {verdict === "rejected" && (
              <div
                role="alert"
                className="absolute inset-0 flex items-center justify-center backdrop-blur-sm [background:color-mix(in_srgb,var(--bg)_60%,transparent)]"
              >
                <div className="mx-4 flex max-w-sm flex-col items-center gap-3 rounded-xl border-[2.5px] bg-card p-6 text-center shadow-card [border-color:var(--danger-border)]">
                  <X
                    size={28}
                    weight="bold"
                    className="text-danger"
                    aria-hidden="true"
                  />
                  <p className="font-display text-lg font-black">
                    {t("verdictRejected")}
                  </p>
                  <p className="text-sm text-text-3">
                    {rejectReason ?? t("completionFailedGeneric")}
                  </p>
                  <Button
                    variant="pushOutline"
                    size="default"
                    onClick={() => {
                      setVerdict("idle");
                      setRejectReason(null);
                    }}
                  >
                    {tCommon("retry")}
                  </Button>
                </div>
              </div>
            )}

            {/* Accepted verdict — appears once the card's green flash settles
                to amber (immediately under reduced motion). Calm, no confetti:
                celebration is reserved for deploy + credential-mint milestones
                (LX-B11). */}
            {verdict === "accepted" && !verdictFlash && (
              <div
                role="status"
                className="pointer-events-none absolute inset-0 flex items-center justify-center backdrop-blur-sm [background:color-mix(in_srgb,var(--bg)_60%,transparent)]"
              >
                <div className="verdict-accepted-card flex flex-col items-center gap-2 rounded-xl border-[2.5px] p-6 shadow-card">
                  <CheckCircle
                    size={32}
                    weight="duotone"
                    className="text-success"
                    aria-hidden="true"
                  />
                  <p className="font-display text-lg font-black">
                    {t("verdictAccepted")}
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
