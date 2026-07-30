"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Robot,
  MagnifyingGlass,
  CaretDown,
  Lightbulb,
  Play,
} from "@phosphor-icons/react";
import { useAiPartner } from "@/lib/ai/use-ai-partner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AssistMeter } from "./assist-meter";
import { MessageList } from "./message-list";
import { QuickActions } from "./quick-actions";

interface AiPartnerPaneProps {
  lessonSlug: string;
  courseSlug: string;
  hints: string[];
  getCode: () => string;
  getTestSummary: () => string;
  onApply: (proposedCode: string) => void;
  /** When true (the lesson is already complete), every AI action is disabled —
   * the challenge is done, so no more hints / proposals / questions. */
  disabled?: boolean;
  /** True once the most recent run PASSED every test (LX-C9). Gates the opt-in
   * post-pass idiomatic-review button: it is offered only after a passing run,
   * never automatically and never pre-pass. Independent of `disabled` — a
   * post-pass review is valid (and most natural) once the challenge is solved. */
  solutionPassed?: boolean;
  /** True once the learner has run the tests at least once on this challenge.
   * Before that, the first AI action surfaces the attempt-gate nudge (#865) —
   * a soft "run the tests first" suggestion with a free one-tap override,
   * never a lock. After the first run the nudge never appears. */
  hasRunTests?: boolean;
  /** Shift focus to the Run-tests button — the nudge's primary action. */
  onFocusRun?: () => void;
  /** The attempt-gate nudge surfaced (analytics; deduped upstream). */
  onNudgeShown?: () => void;
  /** The learner took the free override (analytics; deduped upstream). */
  onNudgeOverride?: () => void;
  className?: string;
}

export function AiPartnerPane({
  lessonSlug,
  courseSlug,
  hints,
  getCode,
  getTestSummary,
  onApply,
  disabled = false,
  solutionPassed = false,
  hasRunTests = false,
  onFocusRun,
  onNudgeShown,
  onNudgeOverride,
  className,
}: AiPartnerPaneProps) {
  const t = useTranslations("aiPartner");
  const tLesson = useTranslations("lesson");
  const [open, setOpen] = useState(true);

  // Attempt-gate nudge (#865, replaces the #770 hard think-first lock): AI
  // actions are always ENABLED, but the first use before any test run surfaces
  // a soft nudge instead of executing. "shown" holds the requested action until
  // the learner either goes to run the tests or takes the free override;
  // "overridden" is sticky for the rest of the mount, so the nudge appears at
  // most once and the override is never re-asked (and never penalized).
  const [nudgeState, setNudgeState] = useState<"idle" | "shown" | "overridden">(
    "idle"
  );
  const pendingActionRef = useRef<(() => void) | null>(null);
  const nudgeEligible =
    !disabled && !hasRunTests && nudgeState !== "overridden";
  const nudgeVisible = nudgeEligible && nudgeState === "shown";

  /** Route an AI action through the attempt gate: pre-first-run it is held and
   *  the nudge shown; otherwise it executes immediately. */
  const guardAction = useCallback(
    (action: () => void) => {
      if (nudgeEligible) {
        pendingActionRef.current = action;
        if (nudgeState !== "shown") {
          setNudgeState("shown");
          onNudgeShown?.();
        }
        return;
      }
      action();
    },
    [nudgeEligible, nudgeState, onNudgeShown]
  );

  const handleNudgeRunTests = useCallback(() => {
    pendingActionRef.current = null;
    setNudgeState("idle");
    onFocusRun?.();
  }, [onFocusRun]);

  const handleNudgeOverride = useCallback(() => {
    setNudgeState("overridden");
    onNudgeOverride?.();
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }, [onNudgeOverride]);

  const {
    messages,
    freeHintsUsed,
    paidUsed,
    budgetExhausted,
    spendCapped,
    loading,
    error,
    requestHint,
    review,
    verifyCheck,
  } = useAiPartner({ lessonSlug, courseSlug, hints, getCode, getTestSummary });

  const requestHintGuarded = useCallback(
    () => guardAction(requestHint),
    [guardAction, requestHint]
  );

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-md border bg-card",
        className
      )}
    >
      {/* Collapsible (#770): the whole pane folds to its header so the reading
          column can be reclaimed. Starts open. */}
      <div className="flex shrink-0 items-start border-b border-border">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="ai-partner-body"
          className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex w-full items-center gap-2">
            <Robot
              size={18}
              weight="duotone"
              className="text-primary"
              aria-hidden="true"
            />
            <h2 className="font-display text-sm font-extrabold text-text">
              {t("title")}
            </h2>
            <CaretDown
              size={14}
              weight="bold"
              aria-hidden="true"
              className={cn(
                "ml-auto text-text-3 transition-transform",
                !open && "-rotate-90"
              )}
            />
            <span className="sr-only">{tLesson("toggleSection")}</span>
          </div>
          <p className="text-xs text-text-3">
            {disabled ? t("completed") : t("subtitle")}
          </p>
          <AssistMeter freeHintsUsed={freeHintsUsed} paidUsed={paidUsed} />
        </button>
      </div>

      {/* Attempt-gate nudge (#865): shown only when an AI action was invoked
          before the first test run. Soft by design — no lock, no countdown, no
          padlock. [Run the tests] dismisses and shifts focus to the Run button;
          the override is a single free tap that proceeds with the original
          request immediately. role="status" announces it politely without
          stealing focus. */}
      {open && nudgeVisible && (
        <div
          role="status"
          className="flex shrink-0 flex-col gap-2.5 border-b border-border px-4 py-3 [background:var(--accent-bg)]"
        >
          <p className="text-xs text-text-3">
            <span className="font-bold text-text">
              {t("attemptNudge.title")}
            </span>{" "}
            {t("attemptNudge.body")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="push"
              size="sm"
              onClick={handleNudgeRunTests}
              className="gap-1.5 text-xs"
            >
              <Play size={14} weight="duotone" aria-hidden="true" />
              {t("attemptNudge.run")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNudgeOverride}
              className="text-xs"
            >
              {t("attemptNudge.override")}
            </Button>
          </div>
        </div>
      )}

      {/* Empty state stays COMPACT (#770): the prompt and the Hint button sit
          together in a short block — no reserved conversation area. The pane
          only grows (and the button drops to the bottom) once there are
          messages to show. */}
      {!open ? null : messages.length === 0 ? (
        <div className="flex flex-col gap-3 px-4 py-4">
          <p className="text-sm text-text-3">{t("messages.empty")}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={requestHintGuarded}
            disabled={loading || disabled}
            className="w-full gap-1.5"
          >
            <Lightbulb size={14} weight="duotone" aria-hidden="true" />
            {t("actions.hint")}
          </Button>
        </div>
      ) : (
        <MessageList
          messages={messages}
          onApply={onApply}
          getCode={getCode}
          onVerify={verifyCheck}
          className="min-h-0 flex-1"
        />
      )}

      {open && spendCapped && (
        <div className="shrink-0 border-t border-border px-4 py-2">
          <p className="text-xs text-text-3">{t("messages.spendCapped")}</p>
        </div>
      )}

      {open && error && !spendCapped && (
        <div className="shrink-0 border-t border-border px-4 py-2">
          <p className="text-xs text-danger">{t("messages.error")}</p>
        </div>
      )}

      {open && loading && (
        <div className="shrink-0 px-4 py-2">
          <p className="flex items-center gap-2 text-xs text-text-3">
            <span
              className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden="true"
            />
            {t("messages.loading")}
          </p>
        </div>
      )}

      {/* Post-pass idiomatic review (LX-C9): an opt-in CTA shown ONLY after a
          passing run. It spends a paid assist like any other billed action, so
          it hard-disables on budgetExhausted. It is intentionally NOT gated by
          `disabled` (lesson complete) — reviewing the solution you just passed
          is the whole point. Suppression is handled upstream: this pane is not
          mounted at all while a quiz block is unanswered (LX-C1/F18). It needs
          no attempt-gate guard either: a passing run implies the tests ran. */}
      {open && solutionPassed && (
        <div className="shrink-0 border-t border-border px-3 pt-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => review()}
            disabled={loading || budgetExhausted}
            className="w-full gap-1.5"
          >
            <MagnifyingGlass size={14} weight="duotone" aria-hidden="true" />
            {t("actions.review")}
          </Button>
          <p className="mt-1.5 text-[11px] text-text-3">
            {t("actions.reviewHint")}
          </p>
        </div>
      )}

      {open && messages.length > 0 && (
        <QuickActions
          onHint={requestHintGuarded}
          disabled={loading || disabled}
          budgetExhausted={budgetExhausted}
        />
      )}
    </div>
  );
}
