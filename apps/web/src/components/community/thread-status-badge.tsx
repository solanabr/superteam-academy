"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ThreadStatusBadgeProps {
  type: "question" | "discussion";
  isSolved: boolean;
}

export function ThreadStatusBadge({ type, isSolved }: ThreadStatusBadgeProps) {
  const t = useTranslations("community");
  if (type === "discussion") return null;

  return (
    <span
      className={cn(
        // Guide pill spec: display 700 · caps · 11px · +0.4px. Unanswered is
        // NEUTRAL — amber is the reward currency, not a question state.
        "inline-flex items-center rounded-full px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-[0.4px]",
        isSolved
          ? "bg-[var(--primary-dim)] text-[var(--primary)]"
          : "bg-[var(--inset)] text-[var(--text-2)]"
      )}
    >
      {isSolved ? t("solved") : t("unanswered")}
    </span>
  );
}
