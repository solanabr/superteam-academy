"use client";

import { Snowflake } from "lucide-react";
import { useTranslations } from "next-intl";

export function StreakFreezeCard({ freezes }: { freezes: number }) {
  const t = useTranslations("gamification");

  if (freezes <= 0) return null;

  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-brazil-blue/20 bg-brazil-blue/5 px-3 py-2">
      <Snowflake className="h-4 w-4 shrink-0 text-brazil-blue" />
      <span className="text-xs text-muted-foreground">
        {freezes !== 1
          ? t("streakFreeze.plural", { count: freezes })
          : t("streakFreeze.singular", { count: freezes })}
      </span>
    </div>
  );
}
