"use client";

import { useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { useAchievements } from "@/hooks/useAchievements";
import { useNotificationStore } from "@/stores/notification-store";
import { useProgressStore } from "@/stores/progress-store";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/gamification/achievements";
import {
  checkAndTriggerAchievements,
  triggerHelperIfEligible,
  recordCourseShare,
  checkAndMarkFirstReview,
  type AchievementEvent,
  type AchievementContext,
} from "@/lib/services/AchievementTriggerService";
import logger from "@/lib/logger";

// ---------------------------------------------------------------------------
// Achievement unlock toast
// ---------------------------------------------------------------------------

function showAchievementToast(achievementId: string, xpReward: number) {
  const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === achievementId);
  if (!def) return;

  toast.custom(
    () => (
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex items-center gap-3 rounded-xl border border-yellow-500/40 bg-background/90 px-4 py-3 shadow-[0_0_20px_hsl(var(--secondary)/0.2)] backdrop-blur-md"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 text-lg">
          ★
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide text-yellow-500">
            Achievement Unlocked
          </span>
          <span className="text-sm font-bold">{def.name}</span>
          <span className="text-xs text-muted-foreground">+{xpReward} XP</span>
        </div>
      </div>
    ),
    {
      duration: 4000,
      position: "top-center",
    }
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseAchievementTriggerResult {
  /**
   * Trigger achievement checks for a given event. Pass as much context as available.
   * This function NEVER throws.
   */
  trigger: (
    event: AchievementEvent,
    context: Omit<AchievementContext, "wallet" | "unlockedBitmap" | "onUnlocked">
  ) => Promise<void>;
  /**
   * Record a course share click and check the helper achievement.
   * Call when the user clicks a share button on a course.
   */
  recordShareAndCheck: () => Promise<void>;
  /**
   * Call when the user submits their first review.
   * Returns true if this was their first review.
   */
  checkFirstReview: () => Promise<boolean>;
}

export function useAchievementTrigger(): UseAchievementTriggerResult {
  const { publicKey, signMessage } = useWallet();
  const { unlockedBitmap, refetch } = useAchievements(publicKey);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setOnStreakMilestone = useProgressStore((s) => s.setOnStreakMilestone);

  const onUnlocked = useCallback(
    (achievementId: string, xpReward: number) => {
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === achievementId);
      if (!def) return;

      showAchievementToast(achievementId, xpReward);

      addNotification({
        type: "achievement_unlocked",
        title: `Achievement Unlocked: ${def.name}!`,
        message: `+${xpReward} XP — ${def.description}`,
      });

      // Refetch on-chain bitmap so UI reflects the new unlock
      refetch();
    },
    [addNotification, refetch]
  );

  // Register streak milestone callback with progress store so it can fire
  // achievement checks when the store detects 7/30/100-day milestones.
  useEffect(() => {
    if (!publicKey) {
      setOnStreakMilestone(undefined);
      return;
    }
    const wallet = publicKey.toBase58();
    setOnStreakMilestone((streakDays: number) => {
      void checkAndTriggerAchievements("streak_update", {
        wallet,
        unlockedBitmap,
        signMessage: signMessage ?? undefined,
        streakDays,
        onUnlocked,
      });
    });
    return () => {
      setOnStreakMilestone(undefined);
    };
  }, [publicKey, signMessage, unlockedBitmap, onUnlocked, setOnStreakMilestone]);

  const trigger = useCallback(
    async (
      event: AchievementEvent,
      context: Omit<AchievementContext, "wallet" | "unlockedBitmap" | "onUnlocked" | "signMessage">
    ): Promise<void> => {
      if (!publicKey) {
        logger.warn("[useAchievementTrigger] Wallet not connected, skipping trigger");
        return;
      }

      await checkAndTriggerAchievements(event, {
        ...context,
        wallet: publicKey.toBase58(),
        unlockedBitmap,
        signMessage: signMessage ?? undefined,
        onUnlocked,
      });
    },
    [publicKey, signMessage, unlockedBitmap, onUnlocked]
  );

  const recordShareAndCheck = useCallback(async (): Promise<void> => {
    if (!publicKey) return;

    recordCourseShare();
    await triggerHelperIfEligible({
      wallet: publicKey.toBase58(),
      unlockedBitmap,
      signMessage: signMessage ?? undefined,
      onUnlocked,
    });
  }, [publicKey, signMessage, unlockedBitmap, onUnlocked]);

  const checkFirstReview = useCallback(async (): Promise<boolean> => {
    const isFirst = checkAndMarkFirstReview();
    if (isFirst && publicKey) {
      await checkAndTriggerAchievements("review_submit", {
        wallet: publicKey.toBase58(),
        unlockedBitmap,
        signMessage: signMessage ?? undefined,
        onUnlocked,
        isFirstReview: true,
      });
    }
    return isFirst;
  }, [publicKey, signMessage, unlockedBitmap, onUnlocked]);

  return { trigger, recordShareAndCheck, checkFirstReview };
}
