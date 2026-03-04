"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { useXpBalance } from "@/hooks/useXpBalance";
import { Achievement } from "@/types/achievement"
import DashboardContent from "./DashboardContent";

export default function DashboardClient() {
  const { connected, publicKey } = useWallet();

  const { data: xp, isLoading, error } = useXpBalance();

  const [mounted, setMounted] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Lazy load services */
  useEffect(() => {
    if (!mounted || !publicKey) return;

    const loadData = async () => {
      const [{ StreakService }, { AchievementService }] = await Promise.all([
        import("@/services/StreakService"),
        import("@/services/AchievementService")
        ]);

      const streakService = new StreakService();
      const achievementService = new AchievementService();

      setStreak(streakService.getCurrentStreak(publicKey));
      setAchievements(achievementService.getAchievements(publicKey));
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(loadData);
    } else {
      setTimeout(loadData, 150);
    }
  }, [mounted, publicKey]);

  if (!mounted) return null;

  return (
    <DashboardContent
      connected={connected}
      xp={xp ?? 0}
      isLoading={isLoading}
      error={error}
      streak={streak}
      achievements={achievements}
    />
  );
}