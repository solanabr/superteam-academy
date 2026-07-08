"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MAX_PAID_ASSISTS } from "@/lib/ai/partner-types";

const FREE_HINT_LIMIT = 2;
const TOTAL_PIPS = FREE_HINT_LIMIT + MAX_PAID_ASSISTS;

interface AssistMeterProps {
  freeHintsUsed: number;
  paidUsed: number;
  className?: string;
}

export function AssistMeter({
  freeHintsUsed,
  paidUsed,
  className,
}: AssistMeterProps) {
  const t = useTranslations("aiPartner");

  const label = t("meter.label", {
    free: Math.min(freeHintsUsed, FREE_HINT_LIMIT),
    paid: Math.min(paidUsed, MAX_PAID_ASSISTS),
    max: MAX_PAID_ASSISTS,
  });

  return (
    <div
      className={cn("flex items-center gap-3", className)}
      role="img"
      aria-label={`${t("a11y.assistMeter")}: ${label}`}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: TOTAL_PIPS }, (_, index) => {
          const isFree = index < FREE_HINT_LIMIT;
          const usedCount = isFree ? freeHintsUsed : paidUsed;
          const positionInGroup = isFree ? index : index - FREE_HINT_LIMIT;
          const isFilled = positionInGroup < usedCount;

          return (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                isFilled ? (isFree ? "bg-success" : "bg-xp") : "bg-border"
              )}
            />
          );
        })}
      </div>
      <span className="text-xs text-text-3">{label}</span>
    </div>
  );
}
