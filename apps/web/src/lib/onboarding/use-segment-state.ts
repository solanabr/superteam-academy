"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { GoalId, LearnerSegment } from "@/lib/courses/learner-segment";
import { isGoalId } from "@/lib/courses/learner-segment";
import { readSegmentState } from "@/lib/onboarding/segment-state";

export interface ResolvedSegmentState {
  segment?: LearnerSegment;
  goal?: GoalId;
}

function toSegment(
  value: number | null | undefined
): LearnerSegment | undefined {
  return value === 1 || value === 2 || value === 3 ? value : undefined;
}

/**
 * Resolves the learner's segment/goal for read surfaces (path-page framing).
 *
 * Signed out → the localStorage intake state. Signed in → the `profiles` row is
 * authoritative, read once and preferred over the local copy; the local copy is
 * the seed for the initial render (avoiding a flash) and the fallback if the DB
 * read fails or the columns are not yet present (unapplied migration). Never
 * throws — a resolution failure degrades to "no segment", and PathsView falls
 * back to the default presentation.
 */
export function useSegmentState(): ResolvedSegmentState {
  const { userId } = useAuth();
  const [resolved, setResolved] = useState<ResolvedSegmentState>(() => {
    const local = readSegmentState();
    return local ? { segment: local.segment, goal: local.goal } : {};
  });

  useEffect(() => {
    if (!userId) {
      // Signed out (or signed out mid-session): local state is the only source.
      const local = readSegmentState();
      setResolved(local ? { segment: local.segment, goal: local.goal } : {});
      return;
    }

    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("segment, goal")
        .eq("id", userId)
        .single();
      if (cancelled) return;

      if (!error && data && data.segment !== null) {
        setResolved({
          segment: toSegment(data.segment),
          goal: isGoalId(data.goal) ? data.goal : undefined,
        });
        return;
      }
      // No stored profile segment (or read failed) → fall back to local intake.
      const local = readSegmentState();
      if (local) setResolved({ segment: local.segment, goal: local.goal });
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return resolved;
}
