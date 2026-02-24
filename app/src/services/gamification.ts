import type { GamificationService } from "./interfaces";
import type {
  StreakData,
  Achievement,
  XPTransaction,
} from "@/types/gamification";
import { calculateLevel } from "@/types/gamification";
import { getAdminClient } from "@/lib/supabase/admin";
import { rowToUserStats } from "@/lib/supabase/mappers";
import { getCoursePDA } from "@/lib/solana/on-chain";

const DAILY_XP_CAP = 2000;

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlocked" | "unlockedAt">[] =
  [
    { id: 0, name: "First Steps", description: "Complete your first lesson", icon: "footprints", category: "progress", xpReward: 50 },
    { id: 1, name: "Course Completer", description: "Complete your first course", icon: "graduation-cap", category: "progress", xpReward: 200 },
    { id: 2, name: "Speed Runner", description: "Complete a course in one day", icon: "zap", category: "progress", xpReward: 500 },
    { id: 3, name: "Week Warrior", description: "Maintain a 7-day streak", icon: "flame", category: "streak", xpReward: 100 },
    { id: 4, name: "Monthly Master", description: "Maintain a 30-day streak", icon: "calendar", category: "streak", xpReward: 300 },
    { id: 5, name: "Consistency King", description: "Maintain a 100-day streak", icon: "crown", category: "streak", xpReward: 1000 },
    { id: 6, name: "Rust Rookie", description: "Complete a Rust course", icon: "code", category: "skill", xpReward: 150 },
    { id: 7, name: "Anchor Expert", description: "Complete all Anchor courses", icon: "anchor", category: "skill", xpReward: 500 },
    { id: 8, name: "Early Adopter", description: "Among the first 100 users", icon: "star", category: "special", xpReward: 250 },
    { id: 9, name: "Bug Hunter", description: "Report a verified bug", icon: "bug", category: "special", xpReward: 200 },
    { id: 10, name: "Social Butterfly", description: "Connect all social accounts", icon: "users", category: "special", xpReward: 100 },
    { id: 11, name: "Challenge Champion", description: "Complete 50 code challenges", icon: "trophy", category: "progress", xpReward: 400 },
  ];

// --- Mock Implementation ---

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

class MockGamificationService implements GamificationService {
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

    if (data.streak.lastActivityDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (data.streak.lastActivityDate === yesterdayStr) {
        data.streak.currentStreak += 1;
      } else if (data.streak.lastActivityDate && data.streak.streakFreezes > 0) {
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

  async recordActivity(userId: string): Promise<void> {
    const data = getOrCreate(userId);
    const today = new Date().toISOString().split("T")[0];
    if (data.streak.lastActivityDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    if (data.streak.lastActivityDate === yesterdayStr) {
      data.streak.currentStreak += 1;
    } else if (data.streak.lastActivityDate && data.streak.streakFreezes > 0) {
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

  async claimAchievement(userId: string, achievementIndex: number): Promise<void> {
    const data = getOrCreate(userId);
    const flagIndex = Math.floor(achievementIndex / 64);
    while (data.achievements.length <= flagIndex) {
      data.achievements.push(0);
    }
    data.achievements[flagIndex] |= 1 << (achievementIndex % 64);
    const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementIndex);
    if (def) {
      await this.awardXP(userId, def.xpReward, "achievement", String(achievementIndex));
    }
  }

  async getXPHistory(userId: string, limit = 20): Promise<XPTransaction[]> {
    const data = getOrCreate(userId);
    return data.xpHistory.slice(-limit).reverse();
  }
}

// --- Supabase Implementation ---

class SupabaseGamificationService implements GamificationService {
  private get db() {
    const client = getAdminClient();
    if (!client) throw new Error("Supabase admin client not configured");
    return client;
  }

  async getXP(userId: string): Promise<number> {
    const { data } = await this.db
      .from("user_stats")
      .select("total_xp")
      .eq("user_id", userId)
      .single();
    return data?.total_xp ?? 0;
  }

  async getLevel(userId: string): Promise<number> {
    const xp = await this.getXP(userId);
    return calculateLevel(xp).level;
  }

  async getStreak(userId: string): Promise<StreakData> {
    const { data } = await this.db
      .from("user_stats")
      .select("current_streak, longest_streak, last_activity_date, streak_freezes")
      .eq("user_id", userId)
      .single();

    if (!data) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakFreezes: 3,
        isActiveToday: false,
      };
    }

    const today = new Date().toISOString().split("T")[0];
    return {
      currentStreak: data.current_streak ?? 0,
      longestStreak: data.longest_streak ?? 0,
      lastActivityDate: data.last_activity_date ?? null,
      streakFreezes: data.streak_freezes ?? 0,
      isActiveToday: data.last_activity_date === today,
    };
  }

  async awardXP(
    userId: string,
    amount: number,
    source: string,
    sourceId?: string,
  ): Promise<void> {
    const today = new Date().toISOString().split("T")[0];

    // Check daily cap
    const { data: todayTxs } = await this.db
      .from("xp_transactions")
      .select("amount")
      .eq("user_id", userId)
      .gte("transaction_at", `${today}T00:00:00Z`);

    const todayXP = (todayTxs ?? []).reduce(
      (sum: number, t: { amount: number }) => sum + t.amount,
      0,
    );
    const cappedAmount = Math.min(amount, DAILY_XP_CAP - todayXP);
    if (cappedAmount <= 0) return;

    // Convert slug to PDA if provided for consistent indexing
    let coursePdaString: string | undefined = undefined;
    if (sourceId) {
      try {
        coursePdaString = getCoursePDA(sourceId)[0].toBase58();
      } catch (err) {
        // Achievement IDs or other non-slug sourceIds fall back to original
        coursePdaString = sourceId;
      }
    }

    // Insert XP transaction
    await this.db.from("xp_transactions").insert({
      user_id: userId,
      amount: cappedAmount,
      source,
      course_pda: coursePdaString,
    });

    // Get current stats
    const { data: stats } = await this.db
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!stats) return;

    const currentStats = rowToUserStats(stats);
    const newXP = currentStats.totalXP + cappedAmount;
    const newLevel = calculateLevel(newXP).level;

    // Update streak
    let newStreak = currentStats.currentStreak;
    let newLongest = currentStats.longestStreak;
    let newFreezes = currentStats.streakFreezes;

    if (currentStats.lastActivityDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (currentStats.lastActivityDate === yesterdayStr) {
        newStreak += 1;
      } else if (currentStats.lastActivityDate && newFreezes > 0) {
        newFreezes -= 1;
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      if (newStreak > newLongest) newLongest = newStreak;
    }

    await this.db
      .from("user_stats")
      .update({
        total_xp: newXP,
        level: newLevel,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
        streak_freezes: newFreezes,
      })
      .eq("user_id", userId);
  }

  async recordActivity(userId: string): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    const { data: stats } = await this.db
      .from("user_stats")
      .select("current_streak, longest_streak, last_activity_date, streak_freezes")
      .eq("user_id", userId)
      .single();
    if (!stats) {
      await this.db.from("user_stats").upsert(
        { user_id: userId, current_streak: 1, longest_streak: 1, last_activity_date: today, streak_freezes: 3 },
        { onConflict: "user_id" },
      );
      return;
    }
    if (stats.last_activity_date === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    let newStreak = stats.current_streak ?? 0;
    let newLongest = stats.longest_streak ?? 0;
    let newFreezes = stats.streak_freezes ?? 0;
    if (stats.last_activity_date === yesterdayStr) {
      newStreak += 1;
    } else if (stats.last_activity_date && newFreezes > 0) {
      newFreezes -= 1;
      newStreak += 1;
    } else {
      newStreak = 1;
    }
    if (newStreak > newLongest) newLongest = newStreak;
    await this.db
      .from("user_stats")
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
        streak_freezes: newFreezes,
      })
      .eq("user_id", userId);
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const { data } = await this.db
      .from("user_stats")
      .select("achievement_flags")
      .eq("user_id", userId)
      .single();

    const flags: number[] = data?.achievement_flags ?? [0, 0, 0, 0];

    return ACHIEVEMENT_DEFINITIONS.map((def) => {
      const flagIndex = Math.floor(def.id / 64);
      const bit = def.id % 64;
      const unlocked =
        flagIndex < flags.length && (flags[flagIndex] & (1 << bit)) !== 0;
      return {
        ...def,
        unlocked,
        unlockedAt: unlocked ? new Date().toISOString() : undefined,
      };
    });
  }

  async claimAchievement(userId: string, achievementIndex: number): Promise<void> {
    const { data } = await this.db
      .from("user_stats")
      .select("achievement_flags")
      .eq("user_id", userId)
      .single();

    const flags: number[] = [...(data?.achievement_flags ?? [0, 0, 0, 0])];
    const flagIndex = Math.floor(achievementIndex / 64);
    while (flags.length <= flagIndex) {
      flags.push(0);
    }
    flags[flagIndex] |= 1 << (achievementIndex % 64);

    await this.db
      .from("user_stats")
      .update({ achievement_flags: flags })
      .eq("user_id", userId);

    const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementIndex);
    if (def) {
      await this.awardXP(userId, def.xpReward, "achievement", String(achievementIndex));
    }
  }

  async getXPHistory(userId: string, limit = 20): Promise<XPTransaction[]> {
    const { data, error } = await this.db
      .from("xp_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("transaction_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map(
      (row: Record<string, unknown>): XPTransaction => ({
        id: row.id as string,
        userId: row.user_id as string,
        amount: row.amount as number,
        source: row.source as XPTransaction["source"],
        sourceId: (row.course_pda as string) || undefined,
        createdAt: row.transaction_at as string,
      }),
    );
  }
}

// --- Singleton with fallback ---

function createService(): GamificationService {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return new SupabaseGamificationService();
  }
  return new MockGamificationService();
}

export const gamificationService: GamificationService = createService();
