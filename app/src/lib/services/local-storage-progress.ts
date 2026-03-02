import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  Achievement,
  TransactionResult,
  LessonCompletionResult,
  CourseFinalizationResult,
} from "@/types";
import type { LearningProgressService } from "./learning-progress";

// ── Helpers ─────────────────────────────────────────────────────────────────

function isClient(): boolean {
  return typeof window !== "undefined";
}

function getItem<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: unknown): void {
  if (!isClient()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function toDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function levelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

// ── Default achievements (20 total, across all 5 categories) ────────────────

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // progress (4)
  {
    id: "first-steps",
    name: "First Steps",
    description: "Complete your first lesson",
    icon: "footprints",
    category: "progress",
    xpReward: 50,
    claimed: false,
  },
  {
    id: "course-conqueror",
    name: "Course Conqueror",
    description: "Complete an entire course",
    icon: "trophy",
    category: "progress",
    xpReward: 200,
    claimed: false,
  },
  {
    id: "halfway-there",
    name: "Halfway There",
    description: "Complete 50% of any course",
    icon: "flag",
    category: "progress",
    xpReward: 100,
    claimed: false,
  },
  {
    id: "knowledge-collector",
    name: "Knowledge Collector",
    description: "Complete 5 courses",
    icon: "library",
    category: "progress",
    xpReward: 500,
    claimed: false,
  },

  // streaks (4)
  {
    id: "on-fire",
    name: "On Fire",
    description: "Reach a 3-day streak",
    icon: "flame",
    category: "streaks",
    xpReward: 75,
    claimed: false,
  },
  {
    id: "week-warrior",
    name: "Week Warrior",
    description: "Reach a 7-day streak",
    icon: "calendar-check",
    category: "streaks",
    xpReward: 150,
    claimed: false,
  },
  {
    id: "consistency-king",
    name: "Consistency King",
    description: "Reach a 30-day streak",
    icon: "crown",
    category: "streaks",
    xpReward: 500,
    claimed: false,
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Reach a 100-day streak",
    icon: "zap",
    category: "streaks",
    xpReward: 1000,
    claimed: false,
  },

  // skills (4)
  {
    id: "anchor-apprentice",
    name: "Anchor Apprentice",
    description: "Complete an Anchor Framework course",
    icon: "anchor",
    category: "skills",
    xpReward: 150,
    claimed: false,
  },
  {
    id: "rust-wrangler",
    name: "Rust Wrangler",
    description: "Complete a Rust for Solana course",
    icon: "code",
    category: "skills",
    xpReward: 150,
    claimed: false,
  },
  {
    id: "defi-degen",
    name: "DeFi Degen",
    description: "Complete a DeFi Development course",
    icon: "coins",
    category: "skills",
    xpReward: 150,
    claimed: false,
  },
  {
    id: "security-sentinel",
    name: "Security Sentinel",
    description: "Complete a Program Security course",
    icon: "shield",
    category: "skills",
    xpReward: 200,
    claimed: false,
  },

  // community (4)
  {
    id: "welcome-aboard",
    name: "Welcome Aboard",
    description: "Create your learner profile",
    icon: "user-plus",
    category: "community",
    xpReward: 25,
    claimed: false,
  },
  {
    id: "referral-rookie",
    name: "Referral Rookie",
    description: "Refer your first friend",
    icon: "users",
    category: "community",
    xpReward: 100,
    claimed: false,
  },
  {
    id: "social-butterfly",
    name: "Social Butterfly",
    description: "Connect all social accounts",
    icon: "share-2",
    category: "community",
    xpReward: 50,
    claimed: false,
  },
  {
    id: "top-10",
    name: "Top 10",
    description: "Reach the top 10 on the leaderboard",
    icon: "bar-chart",
    category: "community",
    xpReward: 300,
    claimed: false,
  },

  // special (4)
  {
    id: "early-adopter",
    name: "Early Adopter",
    description: "Join during Season 1",
    icon: "sparkles",
    category: "special",
    xpReward: 250,
    claimed: false,
  },
  {
    id: "challenge-accepted",
    name: "Challenge Accepted",
    description: "Pass 10 coding challenges",
    icon: "swords",
    category: "special",
    xpReward: 200,
    claimed: false,
  },
  {
    id: "streak-saver",
    name: "Streak Saver",
    description: "Use a streak freeze",
    icon: "snowflake",
    category: "special",
    xpReward: 50,
    claimed: false,
  },
  {
    id: "credential-holder",
    name: "Credential Holder",
    description: "Earn your first on-chain credential",
    icon: "badge-check",
    category: "special",
    xpReward: 300,
    claimed: false,
  },
];

// ── Mock leaderboard ────────────────────────────────────────────────────────

function generateMockLeaderboard(): LeaderboardEntry[] {
  const names = [
    "SolDev42",
    "AnchorMaxi",
    "RustaceanRick",
    "DeFiDana",
    "ValidatorVince",
    "CryptoCarla",
    "PDAPete",
    "TokenTina",
    "ByteBill",
    "HashHank",
    "MintMary",
    "StakeSteve",
    "BlobBob",
    "LamportLisa",
    "TurbineTom",
    "SerumSara",
    "JitoJen",
    "HeliumHarry",
    "WormholeWendy",
    "JupiterJack",
    "MarinadeMax",
    "RaydiumRita",
    "OrcaOscar",
    "MagicEdenMia",
    "TensorTed",
  ];

  const wallets = names.map((_, i) => {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let w = "";
    let seed = (i + 1) * 7919;
    for (let j = 0; j < 44; j++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      w += chars[seed % chars.length];
    }
    return w;
  });

  const entries: LeaderboardEntry[] = names.map((name, i) => {
    const baseXP = 12000 - i * 400 + ((i * 137) % 200);
    const xp = Math.max(baseXP, 500);
    return {
      rank: i + 1,
      wallet: wallets[i],
      displayName: name,
      xp,
      level: levelFromXP(xp),
      streak: Math.max(1, 30 - i + ((i * 3) % 7)),
    };
  });

  return entries;
}

// ── LocalStorageProgressService ─────────────────────────────────────────────

const KEY_PREFIX = "sta_";

/**
 * localStorage-backed implementation of {@link LearningProgressService}.
 *
 * Stores all progress, XP, streaks, and achievements in the browser's
 * localStorage as JSON. Suitable for development, demos, and offline use.
 */
export class LocalStorageProgressService implements LearningProgressService {
  private key(scope: string, id?: string): string {
    return id ? `${KEY_PREFIX}${scope}:${id}` : `${KEY_PREFIX}${scope}`;
  }

  // ---- Progress -----------------------------------------------------------

  async getProgress(
    userId: string,
    courseId: string,
  ): Promise<Progress | null> {
    return getItem<Progress | null>(
      this.key("progress", `${userId}:${courseId}`),
      null,
    );
  }

  async getAllProgress(userId: string): Promise<Progress[]> {
    if (!isClient()) return [];
    const progressList: Progress[] = [];
    const prefix = this.key("progress", `${userId}:`);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            progressList.push(JSON.parse(raw) as Progress);
          } catch {
            // skip corrupt entries
          }
        }
      }
    }
    return progressList;
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<LessonCompletionResult> {
    const k = this.key("progress", `${userId}:${courseId}`);
    const progress = getItem<Progress | null>(k, null);
    if (!progress) return { xpEarned: 0, courseCompleted: false };

    const alreadyCompleted = progress.completedLessons.includes(lessonIndex);
    if (!alreadyCompleted) {
      progress.completedLessons.push(lessonIndex);
      progress.completedLessons.sort((a, b) => a - b);
    }
    progress.percentage = Math.round(
      (progress.completedLessons.length / progress.totalLessons) * 100,
    );
    progress.lastAccessedAt = new Date().toISOString();

    const courseCompleted =
      progress.percentage === 100 && !progress.completedAt;
    if (courseCompleted) {
      progress.completedAt = new Date().toISOString();
    }

    setItem(k, progress);

    // Award XP for this lesson (default 10 XP for localStorage)
    const xpEarned = alreadyCompleted ? 0 : 10;
    if (xpEarned > 0) {
      await this.addXP(userId, xpEarned);
    }

    return { xpEarned, courseCompleted };
  }

  async enrollInCourse(
    userId: string,
    courseId: string,
  ): Promise<TransactionResult> {
    const k = this.key("progress", `${userId}:${courseId}`);
    const existing = getItem<Progress | null>(k, null);
    if (existing) return {};

    const progress: Progress = {
      courseId,
      completedLessons: [],
      totalLessons: 10,
      percentage: 0,
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };
    setItem(k, progress);

    const enrolled = getItem<string[]>(this.key("enrolled", userId), []);
    if (!enrolled.includes(courseId)) {
      enrolled.push(courseId);
      setItem(this.key("enrolled", userId), enrolled);
    }

    return {};
  }

  async finalizeCourse(
    userId: string,
    courseId: string,
  ): Promise<CourseFinalizationResult> {
    const progress = await this.getProgress(userId, courseId);
    if (!progress || progress.percentage < 100) {
      return { totalXp: 0, bonusXp: 0, creatorXp: 0 };
    }

    // 50% completion bonus (based on total lessons * 10 XP per lesson)
    const baseXp = progress.totalLessons * 10;
    const bonusXp = Math.round(baseXp * 0.5);
    const creatorXp = Math.round(baseXp * 0.1);

    await this.addXP(userId, bonusXp);

    // Mark as finalized
    const k = this.key("progress", `${userId}:${courseId}`);
    const stored = getItem<Progress | null>(k, null);
    if (stored) {
      stored.isFinalized = true;
      setItem(k, stored);
    }

    return {
      totalXp: baseXp + bonusXp,
      bonusXp,
      creatorXp,
    };
  }

  async closeEnrollment(
    userId: string,
    courseId: string,
  ): Promise<TransactionResult> {
    if (!isClient()) return {};

    // Remove progress
    localStorage.removeItem(this.key("progress", `${userId}:${courseId}`));

    // Remove from enrolled list
    const enrolled = getItem<string[]>(this.key("enrolled", userId), []);
    const filtered = enrolled.filter((id) => id !== courseId);
    setItem(this.key("enrolled", userId), filtered);

    return {};
  }

  // ---- XP -----------------------------------------------------------------

  async getXP(userId: string): Promise<number> {
    return getItem<number>(this.key("xp", userId), 0);
  }

  async addXP(
    userId: string,
    amount: number,
  ): Promise<{ balance: number } & TransactionResult> {
    const current = getItem<number>(this.key("xp", userId), 0);
    const next = current + amount;
    setItem(this.key("xp", userId), next);
    return { balance: next };
  }

  // ---- Streaks ------------------------------------------------------------

  async getStreak(userId: string): Promise<StreakData> {
    return getItem<StreakData>(this.key("streak", userId), {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: "",
      streakFreezes: 0,
      activityCalendar: {},
    });
  }

  async recordActivity(userId: string): Promise<StreakData> {
    const streak = await this.getStreak(userId);
    const today = toDateKey();

    if (streak.lastActivityDate === today) return streak;

    streak.activityCalendar[today] = true;

    const yesterday = toDateKey(new Date(Date.now() - 86_400_000));

    if (streak.lastActivityDate === yesterday) {
      streak.currentStreak += 1;
    } else if (streak.lastActivityDate && streak.lastActivityDate !== today) {
      const daysSinceLast = Math.floor(
        (Date.now() - new Date(streak.lastActivityDate).getTime()) / 86_400_000,
      );
      if (daysSinceLast === 2 && streak.streakFreezes > 0) {
        streak.streakFreezes -= 1;
        streak.currentStreak += 1;
        streak.activityCalendar[yesterday] = true;
      } else {
        streak.currentStreak = 1;
      }
    } else {
      streak.currentStreak = 1;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastActivityDate = today;
    setItem(this.key("streak", userId), streak);
    return streak;
  }

  // ---- Leaderboard --------------------------------------------------------

  async getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime",
    courseId?: string,
  ): Promise<LeaderboardEntry[]> {
    const board = generateMockLeaderboard();

    if (isClient()) {
      const prefix = `${KEY_PREFIX}xp:`;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          const uid = k.slice(prefix.length);
          const xp = getItem<number>(k, 0);
          if (xp > 0) {
            const existing = board.find((e) => e.wallet === uid);
            if (!existing) {
              board.push({
                rank: 0,
                wallet: uid,
                displayName: uid.slice(0, 8) + "...",
                xp,
                level: levelFromXP(xp),
                streak: getItem<StreakData>(`${KEY_PREFIX}streak:${uid}`, {
                  currentStreak: 0,
                  longestStreak: 0,
                  lastActivityDate: "",
                  streakFreezes: 0,
                  activityCalendar: {},
                }).currentStreak,
              });
            }
          }
        }
      }
    }

    const multiplier =
      timeframe === "weekly" ? 0.15 : timeframe === "monthly" ? 0.45 : 1;
    let adjusted = board.map((e) => ({
      ...e,
      xp: Math.round(e.xp * multiplier),
      level: levelFromXP(Math.round(e.xp * multiplier)),
    }));

    // Filter by course: use deterministic mock enrollment to subset leaderboard
    if (courseId) {
      adjusted = adjusted.filter((e) => {
        // Real user: check localStorage enrollment
        if (isClient()) {
          const progress = getItem<Progress | null>(
            `${KEY_PREFIX}progress:${e.wallet}:${courseId}`,
            null,
          );
          if (progress) return true;
        }
        // Mock users: deterministic enrollment based on hash of wallet + courseId
        let hash = 0;
        const key = e.wallet + courseId;
        for (let i = 0; i < key.length; i++) {
          hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
        }
        // ~60% of mock users are "enrolled" in any given course
        return Math.abs(hash) % 100 < 60;
      });
    }

    adjusted.sort((a, b) => b.xp - a.xp);
    adjusted.forEach((e, i) => {
      e.rank = i + 1;
    });

    return adjusted;
  }

  // ---- Credentials --------------------------------------------------------

  async getCredentials(wallet: string): Promise<Credential[]> {
    return getItem<Credential[]>(this.key("credentials", wallet), []);
  }

  // ---- Achievements -------------------------------------------------------

  async getAchievements(userId: string | null): Promise<Achievement[]> {
    const claimed = getItem<Record<string, string>>(
      this.key("achievements_claimed", userId ?? "guest"),
      {},
    );

    return DEFAULT_ACHIEVEMENTS.map((a) => ({
      ...a,
      claimed: a.id in claimed,
      claimedAt: claimed[a.id] ?? undefined,
    }));
  }

  async claimAchievement(
    userId: string,
    achievementId: string,
  ): Promise<TransactionResult> {
    const achievement = DEFAULT_ACHIEVEMENTS.find(
      (a) => a.id === achievementId,
    );
    if (!achievement) return {};

    const k = this.key("achievements_claimed", userId);
    const claimed = getItem<Record<string, string>>(k, {});
    if (achievementId in claimed) return {};

    claimed[achievementId] = new Date().toISOString();
    setItem(k, claimed);

    await this.addXP(userId, achievement.xpReward);
    return {};
  }
}
