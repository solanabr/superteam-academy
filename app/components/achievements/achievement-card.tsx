"use client";

import { motion } from "motion/react";
import type { Achievement } from "@/lib/achievements";
import { useTranslations } from "next-intl";

export function AchievementCard({
  achievement,
  locale,
  index = 0,
}: {
  achievement: Achievement;
  locale: string;
  index?: number;
}) {
  const t = useTranslations("achievements");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={`rounded-2xl border p-4 transition-colors ${
        achievement.unlocked
          ? "border-solana-green/20 bg-solana-green/5"
          : "border-edge-soft bg-card opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
          achievement.unlocked ? "bg-solana-green/10" : "bg-card grayscale"
        }`}>
          {achievement.icon}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-bold ${
            achievement.unlocked ? "text-content" : "text-content-muted"
          }`}>
            {achievement.name[locale] || achievement.name.en}
          </p>
          <p className="text-xs text-content-muted">
            {achievement.description[locale] || achievement.description.en}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          achievement.unlocked
            ? "bg-solana-green/10 text-solana-green"
            : "bg-card text-content-muted"
        }`}>
          {achievement.unlocked ? t("unlocked") : t("locked")}
        </span>
      </div>
    </motion.div>
  );
}
