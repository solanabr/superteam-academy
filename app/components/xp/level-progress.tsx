"use client";

import { motion } from "motion/react";
import { getLevel, getXpForLevel, getXpForNextLevel } from "@/lib/level";
import { formatXp } from "@/lib/format";
import { useTranslations } from "next-intl";

export function LevelProgress({ xp }: { xp: number }) {
  const t = useTranslations("profile");
  const level = getLevel(xp);
  const nextLevelXp = getXpForNextLevel(xp);
  const currentLevelXp = getXpForLevel(level);
  const progress = nextLevelXp > currentLevelXp
    ? ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 0;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-content-secondary">
            {t("level")} {level}
          </span>
          <svg className="h-3 w-3 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-mono text-xs text-content-muted">
            {t("level")} {level + 1}
          </span>
        </div>
        <span className="font-mono text-[11px] text-content-muted">
          {formatXp(xp - currentLevelXp)} / {formatXp(nextLevelXp - currentLevelXp)}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-edge-soft">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-solana-gradient"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.3 }}
        />
      </div>
    </div>
  );
}
