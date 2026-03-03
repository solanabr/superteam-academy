export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first-lesson",
    name: "First Steps",
    description: "Completed your first lesson",
    icon: "🎯",
  },
  { id: "xp-100", name: "XP Rookie", description: "Earned 100 XP", icon: "⚡" },
  {
    id: "xp-500",
    name: "XP Warrior",
    description: "Earned 500 XP",
    icon: "🔥",
  },
  {
    id: "xp-1000",
    name: "XP Master",
    description: "Earned 1,000 XP",
    icon: "💎",
  },
  {
    id: "xp-2500",
    name: "XP Legend",
    description: "Earned 2,500 XP",
    icon: "🏆",
  },
  {
    id: "streak-3",
    name: "3-Day Streak",
    description: "Learned 3 days in a row",
    icon: "🔥",
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Learned 7 days in a row",
    icon: "⚔️",
  },
  {
    id: "streak-14",
    name: "Fortnight Focus",
    description: "Learned 14 days in a row",
    icon: "🌟",
  },
  {
    id: "first-course",
    name: "Graduate",
    description: "Completed your first course",
    icon: "🎓",
  },
];

export interface AchievementStats {
  totalXp: number;
  lessonsCompleted: number;
  coursesCompleted: number;
  streakDays: number;
}

export function checkNewAchievements(
  stats: AchievementStats,
  alreadyEarned: string[],
): AchievementDef[] {
  return ACHIEVEMENT_DEFS.filter((def) => {
    if (alreadyEarned.includes(def.id)) return false;
    switch (def.id) {
      case "first-lesson":
        return stats.lessonsCompleted >= 1;
      case "xp-100":
        return stats.totalXp >= 100;
      case "xp-500":
        return stats.totalXp >= 500;
      case "xp-1000":
        return stats.totalXp >= 1000;
      case "xp-2500":
        return stats.totalXp >= 2500;
      case "streak-3":
        return stats.streakDays >= 3;
      case "streak-7":
        return stats.streakDays >= 7;
      case "streak-14":
        return stats.streakDays >= 14;
      case "first-course":
        return stats.coursesCompleted >= 1;
      default:
        return false;
    }
  });
}

export function getEarnedIds(walletAddress: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem(`achieved_${walletAddress}`) ?? "[]",
    ) as string[];
  } catch {
    return [];
  }
}

export function saveEarnedIds(walletAddress: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`achieved_${walletAddress}`, JSON.stringify(ids));
}

/**
 * Award newly earned achievements on-chain via the backend signing service.
 * Fires-and-forgets — failure does not block the UI.
 */
export async function awardAchievementsOnChain(
  walletAddress: string,
  newAchievements: AchievementDef[],
): Promise<void> {
  for (const achievement of newAchievements) {
    try {
      await fetch("/api/achievements/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          achievementId: achievement.id,
        }),
      });
    } catch {
      // Non-blocking — localStorage record still saved
    }
  }
}
