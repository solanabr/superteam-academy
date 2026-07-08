"use client";

import { useTranslations } from "next-intl";
import { Robot } from "@phosphor-icons/react";
import { AssistMeter } from "./assist-meter";
import { MessageList } from "./message-list";
import { QuickActions } from "./quick-actions";
import { cn } from "@/lib/utils";
import { useAiPartner } from "@/lib/ai/use-ai-partner";

interface AiPartnerPaneProps {
  lessonSlug: string;
  courseSlug: string;
  hints: string[];
  getCode: () => string;
  getTestSummary: () => string;
  onApply: (proposedCode: string) => void;
  className?: string;
}

export function AiPartnerPane({
  lessonSlug,
  courseSlug,
  hints,
  getCode,
  getTestSummary,
  onApply,
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
        <p className="text-xs text-text-3">{t("subtitle")}</p>
        <AssistMeter freeHintsUsed={freeHintsUsed} paidUsed={paidUsed} />
      </div>

      <MessageList
        messages={messages}
        onApply={onApply}
        getCode={getCode}
        className="flex-1"
      />

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

      <QuickActions
        onHint={requestHint}
        onPropose={proposeFix}
        onAsk={ask}
        disabled={loading}
        budgetExhausted={budgetExhausted}
      />
    </div>
  );
}
