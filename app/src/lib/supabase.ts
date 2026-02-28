import { createClient } from "@supabase/supabase-js";
import type { UserProfile, LinkedAccount, StreakData } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL and Anon Key must be defined in .env.local");
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfileByWallet(
  walletAddress: string
): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet_address", walletAddress)
    .single();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function getProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function upsertProfile(
  profile: Partial<UserProfile> & { walletAddress?: string }
): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      wallet_address: profile.walletAddress,
      google_id: profile.googleId,
      github_id: profile.githubId,
      username: profile.username,
      display_name: profile.displayName,
      bio: profile.bio,
      avatar_url: profile.avatarUrl,
      twitter_handle: profile.twitterHandle,
      github_handle: profile.githubHandle,
      is_public: profile.isPublic ?? true,
    })
    .select()
    .single();
  if (error || !data) return null;
  return mapProfile(data);
}

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    walletAddress: row.wallet_address as string | undefined,
    googleId: row.google_id as string | undefined,
    githubId: row.github_id as string | undefined,
    username: row.username as string | undefined,
    displayName: row.display_name as string | undefined,
    bio: row.bio as string | undefined,
    avatarUrl: row.avatar_url as string | undefined,
    twitterHandle: row.twitter_handle as string | undefined,
    githubHandle: row.github_handle as string | undefined,
    isPublic: (row.is_public as boolean) ?? true,
    createdAt: row.created_at as string,
  };
}

// ─── Linked Accounts ──────────────────────────────────────────────────────────

export async function getLinkedAccounts(
  userId: string
): Promise<LinkedAccount[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("linked_accounts")
    .select("*")
    .eq("user_id", userId);
  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    userId: row.user_id as string,
    provider: row.provider as "wallet" | "google" | "github",
    providerId: row.provider_id as string,
  }));
}

export async function linkAccount(
  userId: string,
  provider: "wallet" | "google" | "github",
  providerId: string
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("linked_accounts").upsert({
    user_id: userId,
    provider,
    provider_id: providerId,
  });
  return !error;
}

// ─── Streaks ─────────────────────────────────────────────────────────────────

export async function getStreakFromDB(userId: string): Promise<StreakData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  return {
    currentStreak: (data as Record<string, unknown>).current_streak as number,
    longestStreak: (data as Record<string, unknown>).longest_streak as number,
    lastActivityDate: (data as Record<string, unknown>).last_activity_date as string | null,
    streakHistory: ((data as Record<string, unknown>).streak_history as string[]) ?? [],
  };
}

export async function updateStreak(
  userId: string,
  streak: StreakData
): Promise<void> {
  if (!supabase) return;
  await supabase.from("streaks").upsert({
    user_id: userId,
    current_streak: streak.currentStreak,
    longest_streak: streak.longestStreak,
    last_activity_date: streak.lastActivityDate,
    streak_history: streak.streakHistory,
  });
}
