import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side streak updater — call from any API route after a user action.
 * Upserts the streaks row and updates streak_history for today.
 */
export async function updateStreak(supabase: SupabaseClient, userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  const { data: current } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!current) {
    // First ever activity — create streak row
    await supabase.from("streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      streak_history: { [today]: true },
      has_freeze_available: false,
    });
    return;
  }

  // Already recorded today
  if (current.last_activity_date === today) return;

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  const isConsecutive = current.last_activity_date === yesterday;
  const newStreak = isConsecutive ? (current.current_streak ?? 0) + 1 : 1;
  const longestStreak = Math.max(newStreak, current.longest_streak ?? 0);

  const streakHistory = {
    ...((current.streak_history as Record<string, boolean>) ?? {}),
    [today]: true,
  };

  await supabase
    .from("streaks")
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      streak_history: streakHistory,
    })
    .eq("user_id", userId);
}
