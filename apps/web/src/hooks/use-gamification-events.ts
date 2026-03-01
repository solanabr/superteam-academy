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
  // Deduplicate Realtime events — Supabase may deliver the same row multiple
  // times (e.g. React Strict Mode double-mount, reconnection replays).
  const seenIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // Seed the ref with the current level so the first UPDATE doesn't false-trigger.
    // Guard: only write the seed if no Realtime event has already set the ref —
    // a stale seed overwriting a newer Realtime value causes false level-ups.
    supabase
      .from("user_xp")
      .select("level")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data && lastKnownLevelRef.current === null) {
          lastKnownLevelRef.current = data.level ?? 0;
        }
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
          const row = payload.new as {
            id?: string;
            amount?: number;
            reason?: string;
            tx_signature?: string;
          };

          // Deduplicate by row id (primary defence) or tx_signature (fallback)
          const dedupeKey = row.id ?? row.tx_signature;
          if (dedupeKey) {
            if (seenIdsRef.current.has(dedupeKey)) return;
            seenIdsRef.current.add(dedupeKey);
            setTimeout(() => seenIdsRef.current.delete(dedupeKey), 15_000);
          }

          const amount = row.amount;
          if (!amount || amount <= 0) return;

          // Achievement XP → enrich the achievement popup instead of separate XP popup
          const achievementMatch = row.reason?.match(
            /^Achievement reward: (.+)$/
          );
          if (achievementMatch?.[1]) {
            dispatchAchievementXp(achievementMatch[1], amount);
            dispatchXpGain(amount);
            return;
          }

          // Daily quest XP → suppress popup (quests panel already shows the reward)
          if (row.reason?.startsWith("daily_quest:")) return;

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
          const row = payload.new as {
            id?: string;
            achievement_id?: string;
          };
          const key = row.id ?? row.achievement_id;
          if (key) {
            if (seenIdsRef.current.has(key)) return;
            seenIdsRef.current.add(key);
            setTimeout(() => seenIdsRef.current.delete(key), 15_000);
          }
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
          if (!row.id) return;
          if (seenIdsRef.current.has(row.id)) return;
          seenIdsRef.current.add(row.id);
          const certId = row.id;
          setTimeout(() => seenIdsRef.current.delete(certId), 15_000);
          dispatchCertificateMinted(certId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      seenIdsRef.current.clear();
    };
  }, [userId]);
}
