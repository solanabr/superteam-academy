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
 * The one-tap hint, sitting above the free-text composer (#944).
 *
 * #770 made this surface hints-only ("the tutor's role is to nudge, not to
 * answer") by deleting the ask field. That stance is superseded: the assist
 * ladder (#864 — free → metered → Socratic → community handoff, tier-exact
 * billing) and the attempt-gate nudge (#865) constrain *how* the tutor answers
 * and *how much*, which is what hints-only was really protecting. So the ask is
 * back next to the hint, spending the same ladder. Propose-a-fix remains
 * unexposed (the AI offers a diff on its own terms).
 *
 * At full ladder exhaustion (#864) the hint button simply disables — the pane's
 * community-handoff block carries the copy, so no wall-shaped message here.
 *
 * The footer border/padding belong to the pane's composer block, which frames
 * this button and the textarea as one unit.
 */
export function QuickActions({
  onHint,
  disabled,
  budgetExhausted,
  className,
}: QuickActionsProps) {
  const t = useTranslations("aiPartner");

  return (
    <div className={cn("space-y-2.5", className)}>
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
