"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { readSegmentState } from "@/lib/onboarding/segment-state";

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
      if (readError || (data && data.segment !== null)) return;

      const { error: writeError } = await supabase
        .from("profiles")
        .update({
          segment: local.segment,
          goal: local.goal ?? null,
          daily_goal: local.dailyGoal ?? null,
        })
        .eq("id", userId);

      // Leave localStorage in place on failure so reads still resolve; a
      // successful copy makes the DB authoritative and the local copy moot.
      if (writeError) done.current = false;
    })();
  }, [userId]);

  return null;
}
