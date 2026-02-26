import type { StreakService } from "../streak-service";
import type { StreakData } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  streakHistory: {},
  hasFreezeAvailable: false,
};

export const supabaseStreakService: StreakService = {
  async getStreak(userId) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!data) return { ...DEFAULT_STREAK };

    return {
      currentStreak: data.current_streak ?? 0,
      longestStreak: data.longest_streak ?? 0,
      lastActivityDate: data.last_activity_date,
      streakHistory: (data.streak_history as Record<string, boolean>) ?? {},
      hasFreezeAvailable: data.has_freeze_available ?? false,
    } satisfies StreakData;
  },

  async recordActivity(userId) {
    const supabase = createSupabaseBrowserClient();
    const today = new Date().toISOString().split("T")[0];

    const current = await this.getStreak(userId);

    if (current.lastActivityDate === today) return current;

    const yesterday = new Date(Date.now() - 86_400_000)
      .toISOString()
      .split("T")[0];
    const isConsecutive = current.lastActivityDate === yesterday;
    const newStreak = isConsecutive ? current.currentStreak + 1 : 1;
    const longestStreak = Math.max(newStreak, current.longestStreak);

    const updated: StreakData = {
      currentStreak: newStreak,
      longestStreak,
      lastActivityDate: today,
      streakHistory: { ...current.streakHistory, [today]: true },
      hasFreezeAvailable: current.hasFreezeAvailable,
    };

    await supabase.from("streaks").upsert(
      {
        user_id: userId,
        current_streak: updated.currentStreak,
        longest_streak: updated.longestStreak,
        last_activity_date: today,
        streak_history: updated.streakHistory,
        has_freeze_available: updated.hasFreezeAvailable,
      },
      { onConflict: "user_id" },
    );

    return updated;
  },

  async useFreeze(userId) {
    const current = await this.getStreak(userId);
    if (!current.hasFreezeAvailable) return current;

    const supabase = createSupabaseBrowserClient();
    const today = new Date().toISOString().split("T")[0];

    const updated: StreakData = {
      ...current,
      lastActivityDate: today,
      hasFreezeAvailable: false,
      streakHistory: { ...current.streakHistory, [today]: true },
    };

    await supabase
      .from("streaks")
      .update({
        last_activity_date: today,
        has_freeze_available: false,
        streak_history: updated.streakHistory,
      })
      .eq("user_id", userId);

    return updated;
  },
};
