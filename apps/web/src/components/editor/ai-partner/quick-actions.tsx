"use client";

import { useTranslations } from "next-intl";
import { Lightbulb } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
 * At full ladder exhaustion (#864) the hint button simply disables — the pane's
 * community-handoff block carries the copy, so no wall-shaped message here.
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
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onHint}
        disabled={disabled || budgetExhausted}
        className="w-full gap-1.5"
      >
        <Lightbulb size={14} weight="duotone" aria-hidden="true" />
        {t("actions.hint")}
      </Button>
    </div>
  );
}
