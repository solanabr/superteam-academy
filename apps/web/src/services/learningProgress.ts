import { deriveLevel } from "@/solana/program";
import { getCredentialsByOwner } from "@/solana/credentials";
import { getXpBalance, getXpLeaderboard } from "@/solana/xp";
import type {
  CourseId,
  WalletAddress,
  CourseProgress,
  LeaderboardEntry,
  LeaderboardTimeframe,
  StreakData,
  XpSummary,
  CredentialSummary,
} from "./models";

export interface LearningProgressService {
  getProgress(params: {
    wallet: WalletAddress;
    courseId: CourseId;
  }): Promise<CourseProgress | null>;

  completeLesson(params: {
    wallet: WalletAddress;
    courseId: CourseId;
    lessonIndex: number;
  }): Promise<CourseProgress>;

  getXpSummary(wallet: WalletAddress): Promise<XpSummary>;

  getStreakData(wallet: WalletAddress): Promise<StreakData>;

  getLeaderboard(
    timeframe: LeaderboardTimeframe
  ): Promise<LeaderboardEntry[]>;

  getCredentials(wallet: WalletAddress): Promise<CredentialSummary[]>;
  
  completeArcadeGame(params: {
    wallet: WalletAddress;
    gameId: string;
    xp: number;
    score?: number;
  }): Promise<void>;
}

/* ─────────────────────────────────────────────
 * XP Mint address — resolved from Config PDA at runtime.
 * For the stub/MVP, we can override via env var.
 * ──────────────────────────────────────────── */
const XP_MINT =
  process.env.NEXT_PUBLIC_XP_MINT_ADDRESS ?? "";

/* ─────────────────────────────────────────────
 * Streak data stored in localStorage
 * ──────────────────────────────────────────── */
function loadStreak(): StreakData {
  if (typeof window === "undefined")
    return { currentStreak: 0, longestStreak: 0, streakCalendar: [] };

  try {
    const raw = localStorage.getItem("sa_streak");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }

  return { currentStreak: 0, longestStreak: 0, streakCalendar: [] };
}

function saveStreak(data: StreakData) {
  if (typeof window === "undefined") return;
  localStorage.setItem("sa_streak", JSON.stringify(data));
}

function recordActivity(): StreakData {
  const streak = loadStreak();
  const today = new Date().toISOString().split("T")[0]!;

  if (streak.streakCalendar.includes(today)) return streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0]!;

  streak.streakCalendar.push(today);

  if (streak.streakCalendar.includes(yesterdayStr)) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }

  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }

  saveStreak(streak);
  return streak;
}

/* ─────────────────────────────────────────────
 * Local progress store (stubbed for backend-signed ops)
 * ──────────────────────────────────────────── */
function loadLocalProgress(
  wallet: string,
  courseId: string
): CourseProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`sa_progress_${wallet}_${courseId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalProgress(
  wallet: string,
  courseId: string,
  progress: CourseProgress
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `sa_progress_${wallet}_${courseId}`,
    JSON.stringify(progress)
  );
}

/* ─────────────────────────────────────────────
 * Devnet-aware implementation
 * Uses on-chain data where available, localStorage for stubs
 * ──────────────────────────────────────────── */
class DevnetLearningProgressService implements LearningProgressService {
  async getProgress(params: {
    wallet: WalletAddress;
    courseId: CourseId;
  }): Promise<CourseProgress | null> {
    // Stub: read from localStorage
    // Production: read from Enrollment PDA bitmap
    return loadLocalProgress(params.wallet, params.courseId);
  }

  async completeLesson(params: {
    wallet: WalletAddress;
    courseId: CourseId;
    lessonIndex: number;
  }): Promise<CourseProgress> {
    // Stub: record locally (production: backend signs complete_lesson)
    const existing = loadLocalProgress(params.wallet, params.courseId) ?? {
      courseId: params.courseId,
      completedLessons: [],
      totalLessons: 10,
      xpEarned: 0,
      lastActivityAt: null,
      isCompleted: false,
    };

    if (!existing.completedLessons.includes(params.lessonIndex)) {
      existing.completedLessons.push(params.lessonIndex);
      existing.xpEarned += 25; // Default XP per lesson
    }

    existing.lastActivityAt = new Date().toISOString();
    existing.isCompleted =
      existing.completedLessons.length >= existing.totalLessons;

    saveLocalProgress(params.wallet, params.courseId, existing);
    recordActivity();

    return existing;
  }

  async getXpSummary(wallet: WalletAddress): Promise<XpSummary> {
    // Real Devnet: read Token-2022 ATA balance
    if (XP_MINT) {
      const result = await getXpBalance(wallet, XP_MINT);
      if (result.xp > 0) return { totalXp: result.xp, level: result.level };
    }

    // Fallback: aggregate local progress
    if (typeof window === "undefined") return { totalXp: 0, level: 0 };

    let totalXp = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`sa_progress_${wallet}_`)) {
        try {
          const p: CourseProgress = JSON.parse(
            localStorage.getItem(key) ?? "{}"
          );
          totalXp += p.xpEarned ?? 0;
        } catch { /* ignore */ }
      }
    }

    return { totalXp, level: deriveLevel(totalXp) };
  }

  async getStreakData(_wallet: WalletAddress): Promise<StreakData> {
    return loadStreak();
  }

  async getLeaderboard(
    _timeframe: LeaderboardTimeframe
  ): Promise<LeaderboardEntry[]> {
    // Real Devnet: index XP token holders
    if (XP_MINT) {
      const holders = await getXpLeaderboard(XP_MINT, 50);
      return holders.map((h, i) => ({
        wallet: h.wallet,
        displayName: `${h.wallet.slice(0, 4)}...${h.wallet.slice(-4)}`,
        xp: h.xp,
        level: h.level,
        rank: i + 1,
        currentStreak: 0,
      }));
    }

    // Fallback: mock leaderboard
    return MOCK_LEADERBOARD;
  }

  async getCredentials(wallet: WalletAddress): Promise<CredentialSummary[]> {
    // Real Devnet: query Helius DAS
    const nfts = await getCredentialsByOwner(wallet);
    if (nfts.length > 0) {
      return nfts.map((nft) => ({
        assetId: nft.assetId,
        trackId: nft.attributes.trackId ?? 0,
        level: nft.attributes.level ?? 0,
        coursesCompleted: nft.attributes.coursesCompleted ?? 0,
        totalXp: nft.attributes.totalXp ?? 0,
        mint: nft.assetId,
        explorerUrl: nft.explorerUrl,
      }));
    }

    return [];
  }

  async completeArcadeGame(params: {
    wallet: WalletAddress;
    gameId: string;
    xp: number;
  }): Promise<void> {
    const today = new Date().toISOString().split("T")[0]!;
    const key = `sa_arcade_${params.wallet}_${params.gameId}_${today}`;
    
    // Check if already won today to prevent farming
    if (typeof window !== "undefined" && !localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({
        completedAt: new Date().toISOString(),
        xpEarned: params.xp
      }));
      
      // Also record as a "course" for the XP summary aggregation
      // We use a prefix to identify arcade progress
      const progressKey = `sa_progress_${params.wallet}_arcade_${params.gameId}`;
      const existingRaw = localStorage.getItem(progressKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : {
        courseId: `arcade_${params.gameId}`,
        completedLessons: [],
        totalLessons: 1,
        xpEarned: 0,
        lastActivityAt: null,
        isCompleted: true
      };
      
      existing.xpEarned += params.xp;
      existing.lastActivityAt = new Date().toISOString();
      
      localStorage.setItem(progressKey, JSON.stringify(existing));
      recordActivity();
    }
  }
}

/* ─────────────────────────────────────────────
 * Mock leaderboard for fallback
 * ──────────────────────────────────────────── */
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { wallet: "7xKX...f2Gp", displayName: "SolanaMaxi.sol", xp: 12450, level: 11, rank: 1, currentStreak: 42 },
  { wallet: "3nBq...yR8m", displayName: "AnchorDev", xp: 9800, level: 9, rank: 2, currentStreak: 28 },
  { wallet: "9pLw...k4Dn", displayName: "RustBuilder", xp: 8200, level: 9, rank: 3, currentStreak: 15 },
  { wallet: "2hVx...m7Jq", displayName: "DeFiWizard", xp: 7100, level: 8, rank: 4, currentStreak: 21 },
  { wallet: "5tRz...p3Ws", displayName: "TokenMaster", xp: 6500, level: 8, rank: 5, currentStreak: 7 },
  { wallet: "8kNm...v9Xt", displayName: "SPLExpert", xp: 5200, level: 7, rank: 6, currentStreak: 12 },
  { wallet: "4jFy...b2Ku", displayName: "Web3Learner", xp: 4800, level: 6, rank: 7, currentStreak: 5 },
  { wallet: "6wQc...h8Pv", displayName: "ChainCoder", xp: 3900, level: 6, rank: 8, currentStreak: 9 },
  { wallet: "1gMs...n5Ry", displayName: "BorshBoss", xp: 3200, level: 5, rank: 9, currentStreak: 3 },
  { wallet: "0dAe...s6Tz", displayName: "PDAPro", xp: 2700, level: 5, rank: 10, currentStreak: 14 },
];

export const learningProgressService: LearningProgressService =
  new DevnetLearningProgressService();
