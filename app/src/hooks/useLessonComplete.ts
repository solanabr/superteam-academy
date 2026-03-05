"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { completeLessonWithProgress, finalizeCourseWithProgress } from "@/lib/services/LearningProgressService";
import { useProgressStore } from "@/stores/progress-store";
import { useAchievements } from "@/hooks/useAchievements";
import { useAchievementTrigger } from "@/hooks/useAchievementTrigger";

export interface UseLessonCompleteResult {
  completing: boolean;
  isCompleted: (courseId: string, lessonIndex: number) => boolean;
  markComplete: (params: {
    courseId: string;
    courseTitle?: string;
    lessonIndex: number;
    lessonTitle?: string;
    xpPerLesson?: number;
    /** Total number of lessons in the course — used to detect last-lesson and trigger finalizeCourse */
    totalLessons?: number;
    /** trackId for course-completion achievement checks */
    trackId?: string;
    /** enrollmentTimestamp (unix seconds) for speed_runner achievement */
    enrollmentTimestamp?: number;
  }) => Promise<string | null>;
}

export function useLessonComplete(): UseLessonCompleteResult {
  const { publicKey, signMessage } = useWallet();
  const { data: session } = useSession();
  const sessionWalletAddress = session?.user?.walletAddress;
  const effectivePublicKey = publicKey ?? (sessionWalletAddress ? new PublicKey(sessionWalletAddress) : null);
  const [completing, setCompleting] = useState(false);
  const isLessonComplete = useProgressStore((s) => s.isLessonComplete);
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const { unlockedBitmap } = useAchievements(effectivePublicKey);
  const { trigger: triggerAchievement } = useAchievementTrigger();

  const markComplete = useCallback(
    async ({
      courseId,
      courseTitle,
      lessonIndex,
      lessonTitle,
      xpPerLesson = 0,
      totalLessons,
      trackId,
      enrollmentTimestamp,
    }: {
      courseId: string;
      courseTitle?: string;
      lessonIndex: number;
      lessonTitle?: string;
      xpPerLesson?: number;
      totalLessons?: number;
      trackId?: string;
      enrollmentTimestamp?: number;
    }): Promise<string | null> => {
      if (!effectivePublicKey) throw new Error("Wallet not connected");

      setCompleting(true);
      try {
        // Capture lesson count before the optimistic update so isFirstLesson is accurate
        const totalLessonsCompleted = Object.values(completedLessons).reduce(
          (sum, s) => sum + s.size,
          0
        );
        const isFirstLesson = totalLessonsCompleted === 0;

        let result: { signature: string };

        if (signMessage) {
          // Full on-chain flow with wallet signature
          result = await completeLessonWithProgress({
            learner: effectivePublicKey.toBase58(),
            courseId,
            courseTitle,
            lessonIndex,
            lessonTitle,
            xpEarned: xpPerLesson,
            signMessage,
            achievementCtx: {
              unlockedBitmap,
              isFirstLesson,
              totalLessonsCompleted: totalLessonsCompleted + 1,
            },
          });
        } else {
          // Session-only: save progress locally (no wallet signature available)
          const { markLessonComplete } = useProgressStore.getState();
          markLessonComplete(courseId, lessonIndex, xpPerLesson);
          result = { signature: "local" };
        }

        // Fire lesson-level achievement checks through the hook so toasts and
        // notifications are shown correctly.
        void triggerAchievement("lesson_complete", {
          courseId,
          isFirstLesson,
          totalLessonsCompleted: totalLessonsCompleted + 1,
        });

        // After a successful lesson completion, check if this was the last lesson
        // in the course and trigger finalizeCourse if so.
        if (totalLessons !== undefined && totalLessons > 0) {
          const updatedSet =
            useProgressStore.getState().completedLessons[courseId] ?? new Set<number>();
          const isLastLesson = updatedSet.size >= totalLessons;

          if (isLastLesson && signMessage) {
            const allCompleted = useProgressStore.getState().completedLessons;
            const totalCoursesCompleted = Object.values(allCompleted).filter(
              (s) => s.size > 0
            ).length;
            const lastLessonTimestamp = Math.floor(Date.now() / 1000);

            void finalizeCourseWithProgress({
              learner: effectivePublicKey.toBase58(),
              courseId,
              courseTitle,
              xpPerLesson,
              totalLessons,
              signMessage,
              achievementCtx: {
                unlockedBitmap,
                trackId,
                enrollmentTimestamp,
                lastLessonTimestamp,
                totalCoursesCompleted,
              },
            })
              .then(() => {
                // Fire course-completion achievement checks through the hook
                void triggerAchievement("course_complete", {
                  courseId,
                  trackId,
                  enrollmentTimestamp,
                  lastLessonTimestamp,
                  totalCoursesCompleted,
                });
              })
              .catch(() => {
                // finalizeCourse failures are non-blocking — the lesson is already
                // marked complete and XP has been awarded.
              });
          }
        }

        return result.signature;
      } finally {
        setCompleting(false);
      }
    },
    [effectivePublicKey, signMessage, completedLessons, unlockedBitmap, triggerAchievement]
  );

  return {
    completing,
    isCompleted: isLessonComplete,
    markComplete,
  };
}
