"use client";

import { useTranslations } from "next-intl";
import { Robot, MagnifyingGlass } from "@phosphor-icons/react";
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
  className,
}: AiPartnerPaneProps) {
  const t = useTranslations("aiPartner");

  const {
    messages,
    freeHintsUsed,
    paidUsed,
    budgetExhausted,
    loading,
    error,
    requestHint,
    proposeFix,
    ask,
    review,
    verifyCheck,
  } = useAiPartner({ lessonSlug, courseSlug, hints, getCode, getTestSummary });

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-md border bg-card",
        className
      )}
    >
      <div className="flex shrink-0 flex-col gap-2 border-b border-border px-4 py-3">
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
        </div>
        <p className="text-xs text-text-3">
          {disabled ? t("completed") : t("subtitle")}
        </p>
        <AssistMeter freeHintsUsed={freeHintsUsed} paidUsed={paidUsed} />
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col gap-2 overflow-auto px-4 py-4">
          <p className="text-sm font-medium text-text">{t("start.greeting")}</p>
          <button
            type="button"
            onClick={() => ask(t("start.explainPrompt"))}
            disabled={loading || budgetExhausted || disabled}
            className="rounded-md border border-border px-3 py-2.5 text-left text-xs text-text transition-colors hover:border-primary hover:[background:var(--accent-bg)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("start.explain")}
          </button>
          <button
            type="button"
            onClick={() => ask(t("start.approachPrompt"))}
            disabled={loading || budgetExhausted || disabled}
            className="rounded-md border border-border px-3 py-2.5 text-left text-xs text-text transition-colors hover:border-primary hover:[background:var(--accent-bg)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("start.approach")}
          </button>
        </div>
      ) : (
        <MessageList
          messages={messages}
          onApply={onApply}
          getCode={getCode}
          onVerify={verifyCheck}
          className="flex-1"
        />
      )}

      {error && (
        <div className="shrink-0 border-t border-border px-4 py-2">
          <p className="text-xs text-danger">{t("messages.error")}</p>
        </div>
      )}

      {loading && (
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
      {solutionPassed && (
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

      <QuickActions
        onHint={requestHint}
        onPropose={proposeFix}
        onAsk={ask}
        disabled={loading || disabled}
        budgetExhausted={budgetExhausted}
      />
    </div>
  );
}
