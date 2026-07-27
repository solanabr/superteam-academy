"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Robot,
  MagnifyingGlass,
  Lock,
  CaretDown,
  Lightbulb,
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
  /** Epoch-ms moment the tutor unlocks, or null when there is no lock (already
   * complete, or the think-first window has passed). While `Date.now()` is
   * before this, every AI action is locked and a countdown is shown (#770). */
  unlockAt?: number | null;
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
  unlockAt = null,
  className,
}: AiPartnerPaneProps) {
  const t = useTranslations("aiPartner");
  const tLesson = useTranslations("lesson");
  const [open, setOpen] = useState(true);

  // Think-first lock (#770): the tutor is held for the first few minutes after
  // a challenge is opened so learners attempt it before asking for help. Tick
  // once a second while the window is open; stop as soon as it elapses.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (unlockAt == null || Date.now() >= unlockAt) return;
    const id = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= unlockAt) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [unlockAt]);

  const locked = unlockAt != null && now < unlockAt;
  const remainingMs = locked ? unlockAt - now : 0;
  const countdown = `${Math.floor(remainingMs / 60000)}:${String(
    Math.floor((remainingMs % 60000) / 1000)
  ).padStart(2, "0")}`;
  // Locked OR complete both hard-disable the billed/free actions below.
  const actionsBlocked = disabled || locked;

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

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-md border bg-card",
        className
      )}
    >
      {/* Collapsible (#770): the whole pane folds to its header so the reading
          column can be reclaimed. Starts open. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="ai-partner-body"
        className="flex shrink-0 flex-col gap-2 border-b border-border px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2">
          <Robot
            size={18}
            weight="duotone"
            className="text-primary"
            aria-hidden="true"
          />
          <h2 className="font-display text-sm font-extrabold text-text">
            {t("title")}
          </h2>

          {/* Think-first countdown (#770): prominent, in the header's right
              rail, so the wait is the first thing read — not a footnote. */}
          {locked && (
            <span
              role="status"
              className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums text-text [background:var(--input)]"
            >
              <Lock
                size={16}
                weight="duotone"
                className="shrink-0 text-text-3"
                aria-hidden="true"
              />
              {countdown}
            </span>
          )}
          <CaretDown
            size={14}
            weight="bold"
            aria-hidden="true"
            className={cn(
              "text-text-3 transition-transform",
              !locked && "ml-auto",
              !open && "-rotate-90"
            )}
          />
          <span className="sr-only">{tLesson("toggleSection")}</span>
        </div>
        <p className="text-xs text-text-3">
          {disabled ? t("completed") : locked ? t("lock.title") : t("subtitle")}
        </p>
        <AssistMeter freeHintsUsed={freeHintsUsed} paidUsed={paidUsed} />
      </button>

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
            onClick={requestHint}
            disabled={loading || actionsBlocked}
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
          mounted at all while a quiz block is unanswered (LX-C1/F18). */}
      {open && solutionPassed && (
        <div className="shrink-0 border-t border-border px-3 pt-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => review()}
            disabled={loading || budgetExhausted || locked}
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
          onHint={requestHint}
          disabled={loading || actionsBlocked}
          budgetExhausted={budgetExhausted}
        />
      )}
    </div>
  );
}
