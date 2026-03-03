"use client";

/**
 * One-time sync: reads completed lesson IDs from localStorage and
 * pushes missing entries to Supabase lesson_completions + increments total_xp.
 * Only runs once per wallet (tracked in localStorage).
 */

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/lib/supabase";
import { getAllCourses } from "@/lib/sanity";

const SYNC_KEY_PREFIX = "xp_synced_";
const DEFAULT_XP_PER_LESSON = 50;

export function useSyncXp() {
  const { publicKey } = useWallet();

  useEffect(() => {
    if (!publicKey || !supabase || typeof window === "undefined") return;
    const wallet = publicKey.toBase58();
    const syncKey = SYNC_KEY_PREFIX + wallet;

    // Already synced this wallet on this device
    if (localStorage.getItem(syncKey)) return;

    async function sync() {
      // Collect all completed lesson IDs from localStorage
      const completedBySlug: Record<string, string[]> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith("completed_")) continue;
        const slug = key.replace("completed_", "");
        try {
          const ids: string[] = JSON.parse(localStorage.getItem(key) ?? "[]");
          if (ids.length > 0) completedBySlug[slug] = ids;
        } catch {
          /* skip */
        }
      }

      if (Object.keys(completedBySlug).length === 0) {
        localStorage.setItem(syncKey, "1");
        return;
      }

      // Fetch course data for XP values
      let courseMap: Record<
        string,
        {
          title: string;
          lessons: Record<string, { title: string; xp: number }>;
        }
      > = {};
      try {
        const courses = await getAllCourses();
        for (const c of courses) {
          const lessons: Record<string, { title: string; xp: number }> = {};
          for (const m of c.modules ?? []) {
            for (const l of m.lessons ?? []) {
              lessons[l._id] = {
                title: l.title,
                xp: l.xpReward ?? DEFAULT_XP_PER_LESSON,
              };
            }
          }
          courseMap[c.slug] = { title: c.title, lessons };
        }
      } catch {
        /* use default XP */
      }

      // Check which ones are already in Supabase
      if (!supabase) return;
      const allIds = Object.values(completedBySlug).flat();
      const { data: existing } = await supabase
        .from("lesson_completions")
        .select("lesson_id")
        .eq("wallet_address", wallet)
        .in("lesson_id", allIds);

      const existingSet = new Set(
        (existing ?? []).map((r: { lesson_id: string }) => r.lesson_id),
      );

      let totalNewXp = 0;
      const rows = [];

      for (const [slug, lessonIds] of Object.entries(completedBySlug)) {
        const courseInfo = courseMap[slug];
        for (const lessonId of lessonIds) {
          if (existingSet.has(lessonId)) continue;
          const lessonInfo = courseInfo?.lessons[lessonId];
          const xp = lessonInfo?.xp ?? DEFAULT_XP_PER_LESSON;
          totalNewXp += xp;
          rows.push({
            wallet_address: wallet,
            course_slug: slug,
            course_title: courseInfo?.title ?? slug,
            lesson_id: lessonId,
            lesson_title: lessonInfo?.title ?? "Lesson",
            xp_earned: xp,
          });
        }
      }

      if (rows.length > 0) {
        await supabase
          .from("lesson_completions")
          .upsert(rows, { onConflict: "wallet_address,lesson_id" });
        if (totalNewXp > 0) {
          await supabase.rpc("increment_xp", { wallet, amount: totalNewXp });
        }
      }

      localStorage.setItem(syncKey, "1");
    }

    sync().catch(() => {});
  }, [publicKey]);
}
