"use client";

import Link from "next/link";
import { AlertTriangle, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGamification } from "@/lib/hooks/use-gamification";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";

export function StreakDangerBanner() {
  const t = useTranslations("gamification");
  const { streakInDanger } = useGamification();
  const { streak } = useLearningProgress();

  if (!streakInDanger) return null;

  return (
    <div className="mb-6 animate-streak-danger rounded-xl border border-streak/30 bg-streak/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-streak/20">
          <AlertTriangle className="h-5 w-5 text-streak" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-streak">
            {t("streakDanger.title")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("streakDanger.description", { count: streak.currentStreak })}{" "}
            <Link href="/courses" className="text-st-green hover:underline">
              {t("streakDanger.action")}
            </Link>{" "}
            {t("streakDanger.suffix")}
          </p>
        </div>
        <Flame className="h-6 w-6 shrink-0 animate-flame text-streak" />
      </div>
    </div>
  );
}
