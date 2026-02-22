"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { dispatchXpGain } from "@/components/gamification/xp-popup";
import { dispatchLevelUp } from "@/components/gamification/level-up-overlay";
import { dispatchAchievementUnlock } from "@/components/gamification/achievement-popup";
import { dispatchCertificateMinted } from "@/components/gamification/certificate-popup";

/**
 * Subscribe to Supabase Realtime for gamification events.
 * Dispatches browser CustomEvents that the existing popup components listen to.
 */
export function useGamificationEvents(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`gamification:${userId}`)
      // XP changes → detect level-up
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_xp",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const oldLevel = (payload.old as { level?: number }).level ?? 0;
          const newLevel = (payload.new as { level?: number }).level ?? 0;
          if (newLevel > oldLevel) {
            dispatchLevelUp(newLevel);
          }
        }
      )
      // New XP transactions → XP popup
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "xp_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const amount = (payload.new as { amount?: number }).amount;
          if (amount && amount > 0) {
            dispatchXpGain(amount);
          }
        }
      )
      // New achievements → achievement popup
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { achievement_id?: string };
          if (row.achievement_id) {
            const displayName = row.achievement_id
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            dispatchAchievementUnlock(row.achievement_id, displayName);
          }
        }
      )
      // New certificates → certificate popup
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "certificates",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { id?: string };
          if (row.id) {
            dispatchCertificateMinted(row.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
