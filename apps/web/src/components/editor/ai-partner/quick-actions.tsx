"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Lightbulb, Sparkle, PaperPlaneTilt } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MAX_PAID_ASSISTS } from "@/lib/ai/partner-types";

interface QuickActionsProps {
  onHint: () => void;
  onPropose: () => void;
  onAsk: (message: string) => void;
  disabled: boolean;
  budgetExhausted: boolean;
  className?: string;
}

export function QuickActions({
  onHint,
  onPropose,
  onAsk,
  disabled,
  budgetExhausted,
  className,
}: QuickActionsProps) {
  const t = useTranslations("aiPartner");
  const [askValue, setAskValue] = useState("");

  // Hint can still be free (the hook drains 2 authored hints locally before
  // it ever spends budget), so a spent paid budget alone must not disable it.
  // Propose/Ask always cost a paid assist once the free-hint ladder is
  // empty, so those two hard-disable on budgetExhausted to avoid a pointless
  // round trip that the server would just reject anyway.
  const hintDisabled = disabled;
  const paidActionDisabled = disabled || budgetExhausted;

  const handleAskSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = askValue.trim();
    if (!trimmed || paidActionDisabled) return;
    onAsk(trimmed);
    setAskValue("");
  };

  return (
    <div className={cn("space-y-2.5 border-t border-border p-3", className)}>
      {budgetExhausted && (
        <p className="text-xs text-danger">
          {t("actions.budgetExhausted", { max: MAX_PAID_ASSISTS })}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onHint}
          disabled={hintDisabled}
          className="flex-1 gap-1.5"
        >
          <Lightbulb size={14} weight="duotone" aria-hidden="true" />
          {t("actions.hint")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onPropose}
          disabled={paidActionDisabled}
          className="flex-1 gap-1.5"
        >
          <Sparkle size={14} weight="duotone" aria-hidden="true" />
          {t("actions.propose")}
        </Button>
      </div>

      <form onSubmit={handleAskSubmit} className="flex gap-2">
        <input
          type="text"
          value={askValue}
          onChange={(event) => setAskValue(event.target.value)}
          disabled={paidActionDisabled}
          placeholder={t("actions.askPlaceholder")}
          aria-label={t("actions.askPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={paidActionDisabled || askValue.trim().length === 0}
          aria-label={t("actions.askSend")}
        >
          <PaperPlaneTilt size={14} weight="fill" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
