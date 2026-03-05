"use client";

import { useEffect, useState } from "react";
import { useProgram } from "@/hooks/useProgram";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { useTranslations } from "next-intl";

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      setCount(Math.floor(end * ease));
      if (progress < duration) animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

export function XpStatCard() {
  const { getXPBalance } = useProgram();
  const [xp, setXp] = useState(0);
  const { userDb } = useUser();
  const t = useTranslations("DashboardWidgets");

  useEffect(() => {
    getXPBalance().then(setXp);
  }, [getXPBalance]);

  const level = Math.floor(Math.sqrt(xp / 100));
  const nextLevelXp = Math.pow(level + 1, 2) * 100;
  const currentLevelBaseXp = Math.pow(level, 2) * 100;
  const xpInLevel = xp - currentLevelBaseXp;
  const xpNeeded = nextLevelXp - currentLevelBaseXp;
  const progress = Math.min((xpInLevel / xpNeeded) * 100, 100);
  const achievementsCount = userDb?.achievements?.length || 0;
  const animatedXp = useCountUp(xp);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("totalXp")}</CardTitle>
          <Zap className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{animatedXp}</div>
          <p className="text-xs text-muted-foreground">{t("soulboundTokens")}</p>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("currentLevel")}</CardTitle>
          <Trophy className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{t("levelLabel", { level })}</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("toNextLevel", { value: Math.round(progress) })}</p>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("achievements")}</CardTitle>
          <Star className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{achievementsCount}</div>
          <p className="text-xs text-muted-foreground">{t("nftBadges")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
