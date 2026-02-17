import type { GamificationService } from "./interfaces";
import type {
  StreakData,
  Achievement,
  XPTransaction,
} from "@/types/gamification";
import { calculateLevel } from "@/types/gamification";

const DAILY_XP_CAP = 2000;

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlocked" | "unlockedAt">[] =
  [
    {
      id: 0,
      name: "First Steps",
      description: "Complete your first lesson",
      icon: "footprints",
      category: "progress",
      xpReward: 50,
    },
    {
      id: 1,
      name: "Course Completer",
      description: "Complete your first course",
      icon: "graduation-cap",
      category: "progress",
      xpReward: 200,
    },
    {
      id: 2,
      name: "Speed Runner",
      description: "Complete a course in one day",
      icon: "zap",
      category: "progress",
      xpReward: 500,
    },
    {
      id: 3,
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "flame",
      category: "streak",
      xpReward: 100,
    },
    {
      id: 4,
      name: "Monthly Master",
      description: "Maintain a 30-day streak",
      icon: "calendar",
      category: "streak",
      xpReward: 300,
    },
    {
      id: 5,
      name: "Consistency King",
      description: "Maintain a 100-day streak",
      icon: "crown",
      category: "streak",
      xpReward: 1000,
    },
    {
      id: 6,
      name: "Rust Rookie",
      description: "Complete a Rust course",
      icon: "code",
      category: "skill",
      xpReward: 150,
    },
    {
      id: 7,
      name: "Anchor Expert",
      description: "Complete all Anchor courses",
      icon: "anchor",
      category: "skill",
      xpReward: 500,
    },
    {
      id: 8,
      name: "Early Adopter",
      description: "Among the first 100 users",
      icon: "star",
      category: "special",
      xpReward: 250,
    },
    {
      id: 9,
      name: "Bug Hunter",
      description: "Report a verified bug",
      icon: "bug",
      category: "special",
      xpReward: 200,
    },
    {
      id: 10,
      name: "Social Butterfly",
      description: "Connect all social accounts",
      icon: "users",
      category: "special",
      xpReward: 100,
    },
    {
      id: 11,
      name: "Challenge Champion",
      description: "Complete 50 code challenges",
      icon: "trophy",
      category: "progress",
      xpReward: 400,
    },
  ];

interface MockUserData {
  xp: number;
  streak: StreakData;
  achievements: number[];
  xpHistory: XPTransaction[];
}

const mockUsers = new Map<string, MockUserData>();

function getOrCreate(userId: string): MockUserData {
  if (!mockUsers.has(userId)) {
    mockUsers.set(userId, {
      xp: 0,
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakFreezes: 3,
        isActiveToday: false,
      },
      achievements: [0, 0, 0, 0],
      xpHistory: [],
    });
  }
  return mockUsers.get(userId)!;
}

export class SupabaseGamificationService implements GamificationService {
  async getXP(userId: string): Promise<number> {
    return getOrCreate(userId).xp;
  }

  async getLevel(userId: string): Promise<number> {
    return calculateLevel(getOrCreate(userId).xp).level;
  }

  async getStreak(userId: string): Promise<StreakData> {
    return { ...getOrCreate(userId).streak };
  }

  async awardXP(
    userId: string,
    amount: number,
    source: string,
    sourceId?: string,
  ): Promise<void> {
    const data = getOrCreate(userId);
    const today = new Date().toISOString().split("T")[0];
    const todayXP = data.xpHistory
      .filter((t) => t.createdAt.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);

    const cappedAmount = Math.min(amount, DAILY_XP_CAP - todayXP);
    if (cappedAmount <= 0) return;

    data.xp += cappedAmount;
    data.xpHistory.push({
      id: crypto.randomUUID(),
      userId,
      amount: cappedAmount,
      source: source as XPTransaction["source"],
      sourceId,
      createdAt: new Date().toISOString(),
    });

    // Update streak
    if (data.streak.lastActivityDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (data.streak.lastActivityDate === yesterdayStr) {
        data.streak.currentStreak += 1;
      } else if (
        data.streak.lastActivityDate &&
        data.streak.streakFreezes > 0
      ) {
        data.streak.streakFreezes -= 1;
        data.streak.currentStreak += 1;
      } else {
        data.streak.currentStreak = 1;
      }
      data.streak.lastActivityDate = today;
      data.streak.isActiveToday = true;
      if (data.streak.currentStreak > data.streak.longestStreak) {
        data.streak.longestStreak = data.streak.currentStreak;
      }
    }
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const data = getOrCreate(userId);
    return ACHIEVEMENT_DEFINITIONS.map((def) => {
      const flagIndex = Math.floor(def.id / 64);
      const bit = def.id % 64;
      const unlocked =
        flagIndex < data.achievements.length &&
        (data.achievements[flagIndex] & (1 << bit)) !== 0;
      return {
        ...def,
        unlocked,
        unlockedAt: unlocked ? new Date().toISOString() : undefined,
      };
    });
  }

  async claimAchievement(
    userId: string,
    achievementIndex: number,
  ): Promise<void> {
    const data = getOrCreate(userId);
    const flagIndex = Math.floor(achievementIndex / 64);
    while (data.achievements.length <= flagIndex) {
      data.achievements.push(0);
    }
    data.achievements[flagIndex] |= 1 << (achievementIndex % 64);

    const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementIndex);
    if (def) {
      await this.awardXP(
        userId,
        def.xpReward,
        "achievement",
        String(achievementIndex),
      );
    }
  }

  async getXPHistory(userId: string, limit = 20): Promise<XPTransaction[]> {
    const data = getOrCreate(userId);
    return data.xpHistory.slice(-limit).reverse();
  }
}

export const gamificationService = new SupabaseGamificationService();
