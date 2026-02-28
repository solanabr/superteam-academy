"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useWalletCompat as useWallet } from "@/lib/hooks/use-wallet-compat";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import { useOnChainXp } from "@/lib/hooks/use-onchain-xp";
import { XPBadge } from "./xp-badge";
import { LevelBadge } from "./level-badge";
import { StreakCounter } from "./streak-counter";
import { DailyGoalMiniRing } from "./daily-goal";
import { HeaderStatsSkeleton } from "./skeletons";

export function HeaderStats() {
  const t = useTranslations("gamification");
  const { connected } = useWallet();
  const { xp: dbXp, streak, isLoaded } = useLearningProgress();
  const { xp: chainXp, isOnChain } = useOnChainXp();
  const xp = connected && chainXp > 0 ? chainXp : dbXp;

  if (!isLoaded) {
    return <HeaderStatsSkeleton />;
  }

  // Don't show stats if user hasn't started learning yet
  if (xp === 0 && streak.currentStreak === 0) {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      className="hidden items-center gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 transition-colors hover:bg-muted/60 xl:flex"
    >
      <LevelBadge xp={xp} size="sm" />
      <div className="h-4 w-px bg-border" />
      <XPBadge xp={xp} size="sm" />
      {isOnChain && (
        <span className="rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400" title={t("onChain.verified")}>
          {t("onChain.badge")}
        </span>
      )}
      <div className="h-4 w-px bg-border" />
      <StreakCounter currentStreak={streak.currentStreak} size="sm" />
      <div className="h-4 w-px bg-border" />
      <DailyGoalMiniRing />
    </Link>
  );
}
