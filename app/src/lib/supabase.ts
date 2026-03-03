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
  walletAddress: string,
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
  username: string,
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
  profile: Partial<UserProfile> & { walletAddress?: string },
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
  userId: string,
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
  providerId: string,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("linked_accounts").upsert({
    user_id: userId,
    provider,
    provider_id: providerId,
  });
  return !error;
}

// ─── Lesson Completions ───────────────────────────────────────────────────────

export async function getCompletedCourseSlugs(
  walletAddress: string,
): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("lesson_completions")
    .select("course_slug")
    .eq("wallet_address", walletAddress)
    .not("course_slug", "is", null);
  if (error || !data) return [];
  const slugs = [
    ...new Set(
      data
        .map((r: Record<string, unknown>) => r.course_slug as string)
        .filter(Boolean),
    ),
  ];
  return slugs;
}

export interface CompletedCourseEntry {
  courseSlug: string;
  courseTitle: string;
  lessonsCompleted: number;
  totalXp: number;
  lastCompletedAt: string;
}

export async function getProfileStats(walletAddress: string): Promise<{
  totalXp: number;
  completedCourses: CompletedCourseEntry[];
}> {
  if (!supabase) return { totalXp: 0, completedCourses: [] };

  const { data, error } = await supabase
    .from("lesson_completions")
    .select("course_slug, course_title, xp_earned, completed_at")
    .eq("wallet_address", walletAddress);

  if (error || !data || data.length === 0)
    return { totalXp: 0, completedCourses: [] };

  type Row = {
    course_slug: string;
    course_title: string;
    xp_earned: number;
    completed_at: string;
  };
  const rows = data as Row[];

  const totalXp = rows.reduce((sum, r) => sum + (r.xp_earned ?? 0), 0);

  const courseMap: Record<string, CompletedCourseEntry> = {};
  for (const row of rows) {
    const slug = row.course_slug;
    if (!slug) continue;
    if (!courseMap[slug]) {
      courseMap[slug] = {
        courseSlug: slug,
        courseTitle: row.course_title ?? slug,
        lessonsCompleted: 0,
        totalXp: 0,
        lastCompletedAt: row.completed_at ?? "",
      };
    }
    courseMap[slug].lessonsCompleted += 1;
    courseMap[slug].totalXp += row.xp_earned ?? 0;
    if (row.completed_at > courseMap[slug].lastCompletedAt) {
      courseMap[slug].lastCompletedAt = row.completed_at;
    }
  }

  const completedCourses = Object.values(courseMap).sort(
    (a, b) =>
      new Date(b.lastCompletedAt).getTime() -
      new Date(a.lastCompletedAt).getTime(),
  );

  return { totalXp, completedCourses };
}

// ─── Streaks ─────────────────────────────────────────────────────────────────

export async function getStreakFromDB(
  userId: string,
): Promise<StreakData | null> {
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
    lastActivityDate: (data as Record<string, unknown>).last_activity_date as
      | string
      | null,
    streakHistory:
      ((data as Record<string, unknown>).streak_history as string[]) ?? [],
  };
}

export async function updateStreak(
  userId: string,
  streak: StreakData,
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
