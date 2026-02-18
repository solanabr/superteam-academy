import type {
  LearningProgressService,
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
} from "@superteam-lms/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import type { Database } from "@/lib/supabase/types";

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
    const rpcUrl =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet");
    this.connection = new Connection(rpcUrl);

    const mintAddress = process.env.NEXT_PUBLIC_XP_MINT_ADDRESS;
    this.xpMint = mintAddress ? new PublicKey(mintAddress) : null;
  }

  // -------------------------------------------------------------------------
  // getXP -- on-chain Token-2022 balance with Supabase fallback
  // -------------------------------------------------------------------------

  async getXP(userId: string): Promise<number> {
    const walletAddress = await this.getWalletForUser(userId);

    // Attempt on-chain read if wallet and XP mint are available
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
        return Number(account.amount);
      } catch {
        // ATA not found, RPC error, or any other issue -- fall through
      }
    }

    // Supabase fallback
    const { data } = await this.supabase
      .from("user_xp")
      .select("total_xp")
      .eq("user_id", userId)
      .single();

    return data?.total_xp ?? 0;
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

    const { data: certs } = await this.supabase
      .from("certificates")
      .select("*")
      .eq("user_id", profile.id);

    if (!certs) return [];

    return certs.map((cert): Credential => {
      const mintedAt = new Date(cert.minted_at);
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
    const { data: rows } = await this.supabase
      .from("user_progress")
      .select("lesson_id, completed_at")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("completed", true);

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
      totalLessons: 0, // Caller enriches from Sanity CMS
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
    const { data } = await this.supabase
      .from("user_xp")
      .select("current_streak, longest_streak, last_activity_date")
      .eq("user_id", userId)
      .single();

    return {
      currentStreak: data?.current_streak ?? 0,
      longestStreak: data?.longest_streak ?? 0,
      lastActivityDate: data?.last_activity_date ?? "",
      streakHistory: {},
    };
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  /**
   * Resolve a Supabase user ID to their connected wallet address.
   */
  private async getWalletForUser(userId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", userId)
      .single();

    return data?.wallet_address ?? null;
  }

  /**
   * Resolve a wallet address to a profile row.
   */
  private async getProfileByWallet(
    walletAddress: string
  ): Promise<{ id: string } | null> {
    const { data } = await this.supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    return data ?? null;
  }

  /**
   * Fetch the leaderboard from Supabase's `get_leaderboard` RPC function.
   */
  private async getLeaderboardFromSupabase(
    timeframe: "weekly" | "monthly" | "alltime"
  ): Promise<LeaderboardEntry[]> {
    const { data } = await this.supabase.rpc("get_leaderboard", {
      p_timeframe: timeframe,
      p_limit: 20,
    });

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
