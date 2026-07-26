import type {
  LearningProgressService,
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
} from "@superteam-lms/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";
import { logError } from "@/lib/logging";

/**
 * A Supabase/PostgREST read error, normalized for `logError`. Capturing and
 * logging these (instead of destructuring `data` alone and letting it fall to a
 * `?? 0` / `?? []` default) is the #731 fix: a failed read must be VISIBLE, and
 * — where the value would otherwise masquerade as a legitimate empty result —
 * distinguishable from a true zero.
 */
type ReadError = { message: string; code?: string; details?: string } | null;

function logReadError(errorId: string, error: ReadError, userId: string): void {
  if (!error) return;
  logError({
    errorId,
    error: new Error(error.message),
    context: { userId, code: error.code, details: error.details },
  });
}

// ---------------------------------------------------------------------------
// HybridProgressService
// ---------------------------------------------------------------------------

/**
 * Reads XP from Token-2022 on-chain first, falls back to Supabase.
 *
 * Write operations (e.g. awarding XP, completing lessons) are intentionally
 * NOT handled here -- they flow through the corresponding API routes that use
 * the Supabase admin client with SECURITY DEFINER functions.
 */
export class HybridProgressService implements LearningProgressService {
  private readonly connection: Connection;
  private readonly xpMint: PublicKey | null;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    // This service runs in the browser (dashboard/profile client pages), so it
    // uses the public, rate-limited RPC endpoint. XP balance reads are
    // non-privileged and do not need the server-only Helius-keyed endpoint.
    this.connection = new Connection(env.NEXT_PUBLIC_SOLANA_RPC_URL);

    const mintAddress = process.env.NEXT_PUBLIC_XP_MINT_ADDRESS;
    this.xpMint = mintAddress ? new PublicKey(mintAddress) : null;
  }

  // -------------------------------------------------------------------------
  // getXP -- max(on-chain Token-2022, Supabase) to include DB-only XP
  // -------------------------------------------------------------------------

  async getXP(userId: string): Promise<number> {
    const walletAddress = await this.getWalletForUser(userId);

    // Read on-chain balance if wallet and XP mint are available
    let onChainXp = 0;
    if (walletAddress && this.xpMint) {
      try {
        const owner = new PublicKey(walletAddress);
        const ata = getAssociatedTokenAddressSync(
          this.xpMint,
          owner,
          false,
          TOKEN_2022_PROGRAM_ID
        );
        const account = await getAccount(
          this.connection,
          ata,
          "confirmed",
          TOKEN_2022_PROGRAM_ID
        );
        onChainXp = Number(account.amount);
      } catch {
        // ATA not found, RPC error, or any other issue
      }
    }

    // Always read Supabase total (includes community XP that is DB-only)
    const { data, error } = await this.supabase
      .from("user_xp")
      .select("total_xp")
      .eq("user_id", userId)
      .single();

    // A genuinely absent row (new user) surfaces as PGRST116 (no rows) — that
    // is a true zero, not an error to log. Any OTHER error (e.g. an unapplied
    // column, RLS misconfig) is logged so a schema break is never silent; the
    // on-chain value below still bounds the degraded answer.
    if (error && error.code !== "PGRST116") {
      logReadError("getXP.user_xp", error, userId);
    }

    const supabaseXp = data?.total_xp ?? 0;

    // Take the higher value: on-chain may lead if webhook is delayed,
    // Supabase may lead due to DB-only XP (community, etc.)
    return Math.max(onChainXp, supabaseXp);
  }

  // -------------------------------------------------------------------------
  // getLeaderboard -- Helius DAS API for alltime, Supabase for windowed
  // -------------------------------------------------------------------------

  async getLeaderboard(
    timeframe: "weekly" | "monthly" | "alltime"
  ): Promise<LeaderboardEntry[]> {
    // balances have no time-windowed snapshots)
    return this.getLeaderboardFromSupabase(timeframe);
  }

  // -------------------------------------------------------------------------
  // getCredentials -- certificates mapped to Credential type
  // -------------------------------------------------------------------------

  async getCredentials(walletAddress: string): Promise<Credential[]> {
    // Future: query Photon indexer for ZK compressed credentials
    const profile = await this.getProfileByWallet(walletAddress);
    if (!profile) return [];

    const { data: certs, error } = await this.supabase
      .from("certificates")
      .select("*")
      .eq("user_id", profile.id);

    if (error) logReadError("getCredentials.certificates", error, profile.id);
    if (!certs) return [];

    return certs.map((cert): Credential => {
      const mintedAt = new Date(cert.minted_at ?? Date.now());
      return {
        trackId: cert.course_id,
        trackName: cert.course_title,
        currentLevel: 1,
        coursesCompleted: 1,
        totalXpEarned: 0,
        firstEarnedAt: mintedAt,
        lastUpdatedAt: mintedAt,
        mintAddress: cert.mint_address ?? undefined,
        metadataUri: cert.metadata_uri ?? undefined,
      };
    });
  }

  // -------------------------------------------------------------------------
  // getCredentialByTrack
  // -------------------------------------------------------------------------

  async getCredentialByTrack(
    walletAddress: string,
    trackId: string
  ): Promise<Credential | null> {
    const credentials = await this.getCredentials(walletAddress);
    return credentials.find((c) => c.trackId === trackId) ?? null;
  }

  // -------------------------------------------------------------------------
  // getProgress -- completed lessons for a given course
  // -------------------------------------------------------------------------

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    const { data: rows, error } = await this.supabase
      .from("user_progress")
      .select("lesson_id, completed_at")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("completed", true);

    if (error) logReadError("getProgress.user_progress", error, userId);

    const completedLessons = (rows ?? []).map((r) => r.lesson_id);

    const lastAccessed =
      rows && rows.length > 0
        ? rows.reduce((latest, r) => {
            const date = r.completed_at ?? "";
            return date > latest ? date : latest;
          }, "")
        : new Date().toISOString();

    return {
      userId,
      courseId,
      completedLessons,
      totalLessons: 0, // Caller enriches from the content bundle
      percentComplete: 0,
      lastAccessedAt: new Date(lastAccessed || new Date().toISOString()),
    };
  }

  // -------------------------------------------------------------------------
  // completeLesson -- write path delegates to API route
  // -------------------------------------------------------------------------

  async completeLesson(
    _userId: string,
    _courseId: string,
    _lessonIndex: number
  ): Promise<{ xpEarned: number; newAchievements: string[] }> {
    // Write path delegates to /api/lessons/complete which uses the Supabase
    // admin client with SECURITY DEFINER functions. In a future on-chain
    // implementation, this would build a transaction calling the program's
    // complete_lesson instruction via backend_signer from Config PDA.
    throw new Error(
      "completeLesson must be called via API route (/api/lessons/complete)"
    );
  }

  // -------------------------------------------------------------------------
  // getStreak
  // -------------------------------------------------------------------------

  async getStreak(userId: string): Promise<StreakData> {
    const [xpRes, frozenRes] = await Promise.all([
      this.supabase
        .from("user_xp")
        .select(
          "current_streak, longest_streak, last_activity_date, streak_freezes"
        )
        .eq("user_id", userId)
        .single(),
      // Own-row read (RLS) of the days a freeze saved — drives the calendar
      // snowflakes. Writes are server-only; this is display state.
      this.supabase
        .from("streak_freezes_used")
        .select("frozen_date")
        .eq("user_id", userId),
    ]);

    const { data, error: xpError } = xpRes;
    const { data: frozen, error: frozenError } = frozenRes;

    // #731: an errored read is NOT a zero streak. A brand-new user legitimately
    // has no user_xp row (PGRST116 = no rows) — that is a true, available zero.
    // Any real read failure (unapplied column/table, RLS misconfig, transport)
    // returns `available: false` so the UI renders em-dash/hidden instead of a
    // misleading "0 day streak", and is logged so the break is never silent.
    const realXpError = xpError && xpError.code !== "PGRST116" ? xpError : null;
    if (realXpError || frozenError) {
      logReadError("getStreak.user_xp", realXpError, userId);
      logReadError("getStreak.streak_freezes_used", frozenError, userId);
      return {
        available: false,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: "",
        streakHistory: {},
        frozenDays: [],
        freezesRemaining: 0,
      };
    }

    return {
      available: true,
      currentStreak: data?.current_streak ?? 0,
      longestStreak: data?.longest_streak ?? 0,
      lastActivityDate: data?.last_activity_date ?? "",
      streakHistory: {},
      frozenDays: (frozen ?? []).map((r) => r.frozen_date),
      freezesRemaining: data?.streak_freezes ?? 0,
    };
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  /**
   * Resolve a Supabase user ID to their connected wallet address.
   */
  private async getWalletForUser(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", userId)
      .single();

    // PGRST116 (no row) is an expected "no wallet" answer, not a fault to log.
    if (error && error.code !== "PGRST116") {
      logReadError("getWalletForUser.profiles", error, userId);
    }

    return data?.wallet_address ?? null;
  }

  /**
   * Resolve a wallet address to a profile row.
   */
  private async getProfileByWallet(
    walletAddress: string
  ): Promise<{ id: string } | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    // PGRST116 (no row) is an expected "unknown wallet" answer, not a fault.
    if (error && error.code !== "PGRST116") {
      logReadError("getProfileByWallet.profiles", error, walletAddress);
    }

    return data ?? null;
  }

  /**
   * Fetch the leaderboard from Supabase's `get_leaderboard` RPC function.
   */
  private async getLeaderboardFromSupabase(
    timeframe: "weekly" | "monthly" | "alltime"
  ): Promise<LeaderboardEntry[]> {
    const { data, error } = await this.supabase.rpc("get_leaderboard", {
      p_timeframe: timeframe,
      p_limit: 20,
    });

    if (error) logReadError("getLeaderboard.get_leaderboard", error, timeframe);
    if (!data) return [];

    return data.map(
      (row): LeaderboardEntry => ({
        userId: row.user_id,
        username: row.username,
        avatarUrl: row.avatar_url ?? "",
        totalXp: row.total_xp,
        level: row.level,
        rank: row.rank,
      })
    );
  }
}
