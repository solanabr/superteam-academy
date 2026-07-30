"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  METERED_ASSIST_TURNS,
  SOCRATIC_ASSIST_TURNS,
} from "@/lib/ai/partner-types";
import type { AssistTier, AssistTurnCounts } from "@/lib/ai/partner-types";

interface AssistMeterProps {
  tier: AssistTier;
  counts: AssistTurnCounts;
  className?: string;
}

/**
 * Ladder-aware assist meter (#864, owner D-4/D-5):
 * - FREE tier: renders NOTHING — the free-turn counter is deliberately hidden,
 *   so the first turns feel like the product, not a budget.
 * - METERED tier: visible count + pips out of the 8 metered turns.
 * - SOCRATIC tier: the lighter-tutor label + count out of 20 — metered and
 *   said so plainly, never framed as unlimited.
 * - EXHAUSTED: renders nothing; the pane shows the community handoff instead.
 * No padlocks anywhere — exhaustion degrades, it never gates.
 */
export function AssistMeter({ tier, counts, className }: AssistMeterProps) {
  const t = useTranslations("aiPartner");

  if (tier === "free" || tier === "exhausted") return null;

  if (tier === "socratic") {
    const used = Math.min(counts.socratic, SOCRATIC_ASSIST_TURNS);
    const label = t("meter.socratic", { used, max: SOCRATIC_ASSIST_TURNS });
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        role="img"
        aria-label={`${t("a11y.assistMeter")}: ${label}`}
      >
        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-text [background:var(--input)]">
          {t("socratic.chip")}
        </span>
        <span className="text-xs text-text-3">{label}</span>
      </div>
    );
  }

  const used = Math.min(counts.metered, METERED_ASSIST_TURNS);
  const label = t("meter.metered", { used, max: METERED_ASSIST_TURNS });
  return (
    <div
      className={cn("flex items-center gap-3", className)}
      role="img"
      aria-label={`${t("a11y.assistMeter")}: ${label}`}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: METERED_ASSIST_TURNS }, (_, index) => (
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
