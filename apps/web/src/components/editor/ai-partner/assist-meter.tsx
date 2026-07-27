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

/**
 * Learner-facing hint usage. The free/paid split is an internal billing detail
 * (#770): the meter shows ONE combined count and uniform pips, so a learner
 * never has to reason about which channel a hint came from.
 */
export function AssistMeter({
  freeHintsUsed,
  paidUsed,
  className,
}: AssistMeterProps) {
  const t = useTranslations("aiPartner");

  const used = Math.min(
    Math.min(freeHintsUsed, FREE_HINT_LIMIT) +
      Math.min(paidUsed, MAX_PAID_ASSISTS),
    TOTAL_PIPS
  );
  const label = t("meter.label", { used });

  return (
    <div
      className={cn("flex items-center gap-3", className)}
      role="img"
      aria-label={`${t("a11y.assistMeter")}: ${label}`}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: TOTAL_PIPS }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              index < used ? "bg-success" : "bg-border"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-text-3">{label}</span>
    </div>
  );
}
