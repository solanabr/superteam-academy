"use client";

import { useTranslations } from "next-intl";
import { Lightbulb } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MAX_PAID_ASSISTS } from "@/lib/ai/partner-types";

interface QuickActionsProps {
  onHint: () => void;
  disabled: boolean;
  budgetExhausted: boolean;
  className?: string;
}

/**
 * Hints only (#770). The free-text "ask" field and the propose-a-fix action are
 * intentionally not offered: the tutor's role here is to nudge, not to answer.
 * The underlying ask/propose plumbing still exists in the hook and route.
 */
export function QuickActions({
  onHint,
  disabled,
  budgetExhausted,
  className,
}: QuickActionsProps) {
  const t = useTranslations("aiPartner");

  return (
    <div className={cn("space-y-2.5 border-t border-border p-3", className)}>
      {budgetExhausted && (
        <p className="text-xs text-danger">
          {t("actions.budgetExhausted", { max: MAX_PAID_ASSISTS })}
        </p>
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onHint}
        disabled={disabled}
        className="w-full gap-1.5"
      >
        <Lightbulb size={14} weight="duotone" aria-hidden="true" />
        {t("actions.hint")}
      </Button>
    </div>
  );
}
