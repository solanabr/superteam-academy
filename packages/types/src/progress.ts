export interface Progress {
  userId: string;
  courseId: string;
  completedLessons: string[];
  totalLessons: number;
  percentComplete: number;
  lastAccessedAt: Date;
}

export interface StreakData {
  /**
   * Whether the streak read actually succeeded. `false` is a DISTINCT degraded
   * state (the DB read errored — e.g. an unapplied migration), NOT a real zero:
   * the UI must render it as em-dash/hidden, never as "0 day streak". Guards
   * against the #731 incident where a swallowed PostgREST error made every
   * learner's streak silently render as 0.
   */
  available: boolean;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakHistory: Record<string, number>;
  /**
   * Days a streak freeze saved (LX-B8), as `YYYY-MM-DD` strings. Rendered as
   * retroactive snowflakes and merged into the calendar so a forgiven gap reads
   * as "streak preserved". Populated server-side from streak_freezes_used; the
   * client only displays them, it never mints them.
   */
  frozenDays: string[];
  /** Freeze tokens the learner currently holds (0–2). Display-only. */
  freezesRemaining: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string;
  totalXp: number;
  level: number;
  rank: number;
  walletAddress?: string;
}

/**
 * One row of a weekly cohort league (LX-B9b). `username`/`avatarUrl`/`userId`
 * are null when the member is a private or deleted profile — the row is kept
 * (never dropped) and rendered as an anonymous learner, with even the opaque id
 * withheld from peers (the viewer's own row keeps its id). `rank` is the
 * member's true position within the cohort. `isYou` flags the viewer's own row
 * so the UI can label it even when the viewer is anonymized.
 */
export interface CohortLeaderboardEntry {
  userId: string | null;
  username: string | null;
  avatarUrl: string | null;
  score: number;
  rank: number;
  isYou: boolean;
}

/** A viewer's weekly cohort: the league header plus its ranked members. */
export interface CohortLeague {
  /** Engagement tier (1 = floor). Named for display via i18n, never stored. */
  tier: number;
  /** ISO date (YYYY-MM-DD) of the Monday the cohort's week started. */
  weekStart: string;
  /** Current cohort size (may be below capacity while filling). */
  memberCount: number;
  entries: CohortLeaderboardEntry[];
}

export interface XpTransaction {
  userId: string;
  amount: number;
  reason: string;
  createdAt: Date;
}

export interface Credential {
  trackId: string;
  trackName: string;
  currentLevel: number;
  coursesCompleted: number;
  totalXpEarned: number;
  firstEarnedAt: Date;
  lastUpdatedAt: Date;
  mintAddress?: string;
  metadataUri?: string;
}

/**
 * Mirrors packages/content-schema QUEST_TYPES (the SQL get_daily_quest_state
 * IF/ELSIF chain). Kept as a literal union here so this leaf package stays
 * dependency-free; the content-schema constants test pins the canonical list.
 */
export type QuestType =
  | "lesson"
  | "lesson_batch"
  | "challenge"
  | "login_streak"
  | "module"
  | "review";

export interface DailyQuest {
  id: string;
  /** Quest kind — drives the per-type deep-link on the quest card. */
  type: QuestType;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  resetType: "daily" | "multi_day";
  /**
   * True on the SINGLE poll of /api/quests/daily where this quest's XP was just
   * granted (mirrors `v_just_awarded` in get_daily_quest_state — the server
   * flips it once, when xp_granted goes false→true). Drives the one-time XP
   * toast (#790); every later poll returns false. Absent on quests fetched
   * outside that endpoint.
   */
  justAwarded?: boolean;
}

export interface LearningProgressService {
  // Layer 1: Direct reads
  getProgress(userId: string, courseId: string): Promise<Progress>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;

  // Layer 2: Indexed queries (on-chain via Helius DAS API when available)
  getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime"
  ): Promise<LeaderboardEntry[]>;
  getCredentials(walletAddress: string): Promise<Credential[]>;
  getCredentialByTrack(
    walletAddress: string,
    trackId: string
  ): Promise<Credential | null>;

  // Layer 3: Transaction builders (write path stays in API routes;
  // on-chain: would build tx calling program's complete_lesson instruction
  // via backend_signer from Config PDA)
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<{ xpEarned: number; newAchievements: string[] }>;
}
