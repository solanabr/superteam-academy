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
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        isSolved
          ? "bg-[var(--primary-dim)] text-[var(--primary)]"
          : "bg-[var(--xp-dim)] text-[var(--xp)]"
      )}
    >
      {isSolved ? t("solved") : t("unanswered")}
    </span>
  );
}
