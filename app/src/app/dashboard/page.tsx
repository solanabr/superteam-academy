"use client";

import { AchievementCard } from "@/components/gamification/achievement-card";
import { LevelBadge } from "@/components/gamification/level-badge";
import { StreakCalendar } from "@/components/gamification/streak-calendar";
import { XpDisplay } from "@/components/gamification/xp-display";
import { Progress } from "@/components/ui/progress";
import { achievementService } from "@/lib/services/achievement-service";
import { useUserStore } from "@/lib/store/user-store";
import { useXp } from "@/hooks/use-xp";
import { useEffect, useState } from "react";
import type { Achievement } from "@/types";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const profile = useUserStore((state) => state.profile);
  const walletAddress = useUserStore((state) => state.walletAddress);
  const xp = useXp(walletAddress, profile.id);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    achievementService.listAchievements(profile.id).then(setAchievements);
  }, [profile.id]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-100">{t("title")}</h1>
        <p className="mt-2 text-zinc-400">{t("subtitle")}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <XpDisplay xp={xp.totalXp} onChainXp={xp.onChainXp} />
        <article className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{t("level")}</p>
          <div className="mt-2"><LevelBadge level={xp.level} /></div>
        </article>
        <article className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{t("weeklyGoal")}</p>
          <Progress value={65} className="mt-3 h-2 bg-zinc-800" />
          <p className="mt-2 text-sm text-zinc-300">65% complete</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <article className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Achievements</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </article>
        <StreakCalendar streak={xp.streak} />
      </section>
    </div>
  );
}
