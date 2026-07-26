"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
  clearSegmentState,
  readSegmentState,
} from "@/lib/onboarding/segment-state";

/**
 * Copy-on-signin for the anonymous /start intake (LX-A3).
 *
 * Pre-auth, the intake lives in localStorage (segment-state). Once the learner
 * signs in, their `profiles` row becomes authoritative — so on the first
 * sign-in we copy the locally-stored segment/goal/daily-goal into it, but ONLY
 * when the row has no segment yet: a returning learner's stored choice must win
 * over a stale anonymous pick left in this browser.
 *
 * Mounted globally (GamificationOverlays), mirroring BankedProgressReplay so it
 * runs regardless of which page the learner lands on after auth. Best-effort by
 * design: any write failure (including the columns not yet existing in an
 * environment where the migration has not applied) is swallowed — the
 * localStorage copy remains the read fallback, exactly like the progress bank.
 *
 * Shared-browser hygiene (F4): once the signed-in user's DB row is the
 * authoritative source — whether we just copied into it OR it already carried a
 * segment — the local copy is cleared. Otherwise user A's anonymous answers,
 * left in this browser, would bleed into the next fresh user B who signs in
 * here. The copy is retained ONLY on a transient failure, so a retry can finish.
 */
export function SegmentSync() {
  const { userId } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (!userId || done.current) return;
    const local = readSegmentState();
    if (!local) return;
    done.current = true;

    void (async () => {
      const supabase = createClient();

      // Only seed when the row carries no segment — never clobber a stored choice.
      const { data, error: readError } = await supabase
        .from("profiles")
        .select("segment")
        .eq("id", userId)
        .single();
      if (readError) {
        // Transient — keep the local copy and allow a later retry.
        done.current = false;
        return;
      }
      if (data && data.segment !== null) {
        // The row is already authoritative for THIS user; the lingering local
        // copy is a stale anonymous pick and a bleed risk — drop it.
        clearSegmentState();
        return;
      }

      const { error: writeError } = await supabase
        .from("profiles")
        .update({
          segment: local.segment,
          goal: local.goal ?? null,
          daily_goal: local.dailyGoal ?? null,
        })
        .eq("id", userId);

      if (writeError) {
        // Keep the local copy so reads still resolve and a retry can finish.
        done.current = false;
        return;
      }
      // Copy landed — the DB is authoritative; clear the local copy.
      clearSegmentState();
    })();
  }, [userId]);

  return null;
}
