import type { XPService } from "../xp-service";
import type { XPBalance } from "@/types";
import { xpProgress } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export const mockXPService: XPService = {
  async getBalance(walletAddress) {
    // TODO: Replace with Token-2022 ATA read via Helius
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    if (!data) {
      return { amount: 0, level: 0, progress: 0, nextLevelXp: 100 };
    }

    return this.getBalanceByUserId(data.id);
  },

  async getBalanceByUserId(userId) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("course_progress")
      .select("xp_earned")
      .eq("user_id", userId);

    const amount = (data ?? []).reduce(
      (sum, row) => sum + ((row.xp_earned as number) ?? 0),
      0,
    );

    const info = xpProgress(amount);
    return {
      amount,
      level: info.level,
      progress: info.progress,
      nextLevelXp: info.nextLevelXp,
    } satisfies XPBalance;
  },
};
