import type { XPService } from "../xp-service";
import type { XPBalance } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { xpProgress } from "@/lib/constants";

export const supabaseXPService: XPService = {
  async getBalance(_walletAddress) {
    // For wallet-based lookup, use on-chain Token-2022 balance instead
    return { amount: 0, level: 0, progress: 0, nextLevelXp: 100 };
  },

  async getBalanceByUserId(userId) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("course_progress")
      .select("xp_earned")
      .eq("user_id", userId);

    const totalXP = (data ?? []).reduce(
      (sum, row) => sum + ((row.xp_earned as number) ?? 0),
      0,
    );

    const info = xpProgress(totalXP);
    return {
      amount: totalXP,
      level: info.level,
      progress: info.progress,
      nextLevelXp: info.nextLevelXp,
    } satisfies XPBalance;
  },
};
