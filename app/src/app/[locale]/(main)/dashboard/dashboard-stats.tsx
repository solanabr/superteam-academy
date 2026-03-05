"use client";

import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { xpToLevel, xpProgressInLevel } from "@/lib/utils";
import {
  Award,
  Footprints,
  Zap,
  GraduationCap,
  Flame,
  Crown,
  Code,
  Anchor,
  Layers,
  Sparkles,
  Heart,
  Bug,
  Target,
} from "lucide-react";
import { StreakCalendar } from "@/components/streak-calendar";
import {
  getLocalXp,
  getStreak,
  getUnlockedAchievements,
  getActiveDates,
  ACHIEVEMENTS,
  type AchievementId,
  type StreakState,
} from "@/services/gamification";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints,
  Zap,
  GraduationCap,
  Flame,
  Crown,
  Code,
  Anchor,
  Layers,
  Sparkles,
  Heart,
  Bug,
  Target,
};

export function DashboardStats() {
  const { publicKey } = useAuth();
  const t = useTranslations("dashboard");
  const tAch = useTranslations("achievements");
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState<StreakState | null>(null);
  const [unlocked, setUnlocked] = useState<AchievementId[]>([]);
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const userId = publicKey?.toBase58() ?? "anonymous";
    setXp(getLocalXp(userId));
    setStreak(getStreak(userId));
    setUnlocked(getUnlockedAchievements(userId));
    setActiveDates(getActiveDates(userId));
  }, [publicKey]);

  const level = xpToLevel(xp);
  const progress = xpProgressInLevel(xp);
  const streakDays = streak?.current ?? 0;

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-center text-xl font-semibold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
        {t("summary")}
      </h2>

      {/* XP card — full width rectangular */}
      <Card className="mb-4 transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t("xpBalance")}
          </CardTitle>
          <Award className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <div>
            <div className="text-2xl font-bold text-sky-600">
              {xp.toLocaleString()} XP
            </div>
            <p className="text-xs text-muted-foreground">
              {t("level")} {level}
            </p>
          </div>
          <Progress
            value={progress.percent}
            className="h-2 flex-1 min-w-[120px]"
          />
        </CardContent>
      </Card>

      {/* Calendar + Achievements side by side */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("streakCalendar")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StreakCalendar
              streakDays={streakDays}
              activeDatesOverride={activeDates}
            />
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("achievements")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = unlocked.includes(ach.id);
                const Icon = ICON_MAP[ach.icon] ?? Sparkles;
                return (
                  <div
                    key={ach.id}
                    className={`flex flex-col items-center gap-1 ${isUnlocked ? "" : "opacity-40"}`}
                    title={`${tAch(ach.nameKey)} — ${tAch(ach.descKey)}`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full ${
                        isUnlocked
                          ? "achievement-icon-unlocked"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="max-w-[60px] text-center text-[10px] font-medium leading-tight text-muted-foreground">
                      {tAch(ach.nameKey)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
