"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useXpBalance } from "@/hooks/use-xp-balance";
import { XpDisplay } from "@/components/xp/xp-display";
import { LevelProgress } from "@/components/xp/level-progress";
import { CredentialGallery } from "@/components/credentials/credential-gallery";
import { AchievementGallery } from "@/components/achievements/achievement-gallery";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const SkillRadar = dynamic(
  () => import("@/components/profile/skill-radar").then((m) => m.SkillRadar),
  { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse rounded-xl bg-card" /> },
);
import { getStreak, isActiveToday } from "@/lib/streak";
import { truncateWallet } from "@/lib/format";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { publicKey } = useWallet();
  const { data: xp, isLoading } = useXpBalance();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-edge-soft">
          <svg className="h-8 w-8 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-sm text-content-muted">{tc("noWallet")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-content">{t("title")}</h1>
        <p className="mt-1 font-mono text-sm text-content-muted">
          {truncateWallet(publicKey.toBase58(), 8)}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 rounded-2xl border border-edge-soft bg-card p-6"
      >
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-14 w-48" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <XpDisplay xp={xp ?? 0} />
            <LevelProgress xp={xp ?? 0} />
          </div>
        )}
      </motion.div>

      {streak > 0 && isActiveToday() && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6 flex items-center gap-4 rounded-2xl border border-orange-400/10 bg-orange-400/[0.03] p-5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-400/10">
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-orange-400/60">
              {t("streakTitle")}
            </p>
            <p className="font-mono text-2xl font-black text-content">
              {streak} <span className="text-sm font-normal text-content-muted">{tc("streak")}</span>
            </p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mb-6 rounded-2xl border border-edge-soft bg-card p-6"
      >
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
          {t("skills")}
        </h2>
        <SkillRadar xp={xp ?? 0} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
          {t("credentials")}
        </h2>
        <CredentialGallery />
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-8"
      >
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
          Achievements
        </h2>
        <AchievementGallery />
      </motion.div>
    </div>
  );
}
