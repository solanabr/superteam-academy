"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/auth-provider";
import { dispatchToast } from "@/components/ui/toast-container";
import {
  replayBankedCompletions,
  type ReplayStatus,
} from "@/lib/lessons/replay-banked";
import { hasBankedCompletions } from "@/lib/lessons/progress-bank";

// Fired after an on-chain enrollment succeeds (lesson-client) so a learner who
// signed in, then enrolled, immediately gets their banked work for that course
// finished — without waiting for the next sign-in.
export const REPLAY_BANKED_EVENT = "superteam:replay-banked";

/**
 * Replays anonymously-banked lesson completions once the learner is signed in
 * (LX-A4c). Mounted globally (GamificationOverlays) so it runs regardless of
 * which page the learner lands on after auth, and re-runs on enrollment.
 *
 * Every outcome is surfaced, never silently dropped:
 *   - completed   → one success toast for the batch.
 *   - needsEnroll → kept banked; a gentle nudge to enroll (retried post-enroll).
 *   - needsRedo   → surfaced per lesson (the proof can't replay — redo in-app).
 *   - retry       → kept banked silently; retried on the next sign-in/enroll.
 */
export function BankedProgressReplay() {
  const { userId } = useAuth();
  const t = useTranslations("lesson");
  const running = useRef(false);

  const run = useCallback(async () => {
    if (running.current || !hasBankedCompletions()) return;
    running.current = true;
    try {
      const outcomes = await replayBankedCompletions();

      const count = (status: ReplayStatus) =>
        outcomes.filter((o) => o.status === status).length;

      const completed = count("completed");
      if (completed > 0) {
        dispatchToast(t("progressRestored", { count: completed }), "success");
      }

      const needsEnroll = count("needsEnroll");
      if (needsEnroll > 0) {
        dispatchToast(t("progressNeedsEnroll", { count: needsEnroll }), "info");
      }

      for (const o of outcomes) {
        if (o.status === "needsRedo") {
          dispatchToast(
            t("progressNeedsRedo", { lesson: o.entry.lessonTitle }),
            "warning"
          );
        }
      }
    } finally {
      running.current = false;
    }
  }, [t]);

  // Run when a user becomes available (initial load already signed in, or a
  // fresh sign-in) and whenever an enrollment invites a retry.
  useEffect(() => {
    if (!userId) return;
    void run();
    const handler = () => void run();
    window.addEventListener(REPLAY_BANKED_EVENT, handler);
    return () => window.removeEventListener(REPLAY_BANKED_EVENT, handler);
  }, [userId, run]);

  return null;
}
