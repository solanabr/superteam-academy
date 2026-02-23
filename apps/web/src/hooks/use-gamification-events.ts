"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { dispatchXpGain } from "@/components/gamification/xp-popup";
import { dispatchLevelUp } from "@/components/gamification/level-up-overlay";
import {
  dispatchAchievementUnlock,
  dispatchAchievementXp,
} from "@/components/gamification/achievement-popup";
import { dispatchCertificateMinted } from "@/components/gamification/certificate-popup";

/**
 * Subscribe to Supabase Realtime for gamification events.
 * Dispatches browser CustomEvents that the existing popup components listen to.
 *
 * Level-up detection uses a local ref instead of payload.old because Supabase
 * Realtime UPDATE events only include old PK columns without REPLICA IDENTITY FULL.
 */
export function useGamificationEvents(userId: string | undefined) {
  const lastKnownLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // Seed the ref with the current level so the first UPDATE doesn't false-trigger
    supabase
      .from("user_xp")
      .select("level")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) lastKnownLevelRef.current = data.level ?? 0;
      });

    const channel = supabase
      .channel(`gamification:${userId}`)
      // XP changes → detect level-up via local ref comparison
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_xp",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newLevel = (payload.new as { level?: number }).level ?? 0;
          const prev = lastKnownLevelRef.current;
          if (prev !== null && newLevel > prev) {
            dispatchLevelUp(newLevel);
          }
          lastKnownLevelRef.current = newLevel;
        }
      )
      // New XP transactions → XP popup (or enrich achievement popup)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "xp_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { amount?: number; reason?: string };
          const amount = row.amount;
          if (!amount || amount <= 0) return;

          // Achievement XP → enrich the achievement popup instead of separate XP popup
          const achievementMatch = row.reason?.match(
            /^Achievement reward: (.+)$/
          );
          if (achievementMatch?.[1]) {
            dispatchAchievementXp(achievementMatch[1], amount);
            return;
          }

          dispatchXpGain(amount);
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
