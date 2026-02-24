"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect, useCallback } from "react";
import { getReadonlyProgram, getAccounts } from "@/lib/solana/program";
import { findEnrollmentPDA } from "@/lib/solana/pda";
import { courses } from "@/lib/services/courses";
import { learningService } from "@/lib/services/learning-progress";
import { countCompletedLessons } from "./use-enrollment";

export interface CourseProgress {
  courseId: string;
  enrolled: boolean;
  completed: number; // lesson count
  total: number;
  percent: number;
  isComplete: boolean; // completedAt is set
}

export function useAllEnrollments() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [progressMap, setProgressMap] = useState<
    Record<string, CourseProgress>
  >({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const walletAddress = publicKey?.toBase58() ?? null;
    if (!walletAddress) {
      setProgressMap({});
      return;
    }

    setLoading(true);
    const map: Record<string, CourseProgress> = {};

    // 1. Try on-chain enrollment PDAs
    try {
      const program = getReadonlyProgram(connection);
      const accounts = getAccounts(program);
      const results = await Promise.allSettled(
        courses.map(async (course) => {
          const [pda] = findEnrollmentPDA(course.id, publicKey!);
          const enrollment = await accounts.enrollment.fetch(pda);
          const completed = countCompletedLessons(enrollment.lessonFlags);
          return {
            courseId: course.id,
            enrolled: true,
            completed,
            total: course.lessonCount,
            percent:
              course.lessonCount > 0
                ? Math.round((completed / course.lessonCount) * 100)
                : 0,
            isComplete: enrollment.completedAt !== null,
          };
        }),
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          map[result.value.courseId] = result.value;
        }
      }
    } catch (error) {
      console.error("[useAllEnrollments] On-chain fetch failed:", error);
    }

    // 2. Merge localStorage progress (fills gaps when on-chain is unavailable)
    try {
      const localProgress = await learningService.getAllProgress(walletAddress);
      for (const lp of localProgress) {
        const existing = map[lp.courseId];
        // Use localStorage if no on-chain data, or if localStorage has more progress
        if (
          !existing ||
          (!existing.enrolled && lp.completedLessons.length > 0)
        ) {
          map[lp.courseId] = {
            courseId: lp.courseId,
            enrolled: true,
            completed: lp.completedLessons.length,
            total: lp.totalLessons,
            percent: lp.percentage,
            isComplete: lp.percentage >= 100,
          };
        } else if (
          existing &&
          existing.enrolled &&
          lp.completedLessons.length > existing.completed
        ) {
          // localStorage has more progress than on-chain (on-chain might be stale)
          map[lp.courseId] = {
            ...existing,
            completed: lp.completedLessons.length,
            percent: lp.percentage,
            isComplete: lp.percentage >= 100 || existing.isComplete,
          };
        }
      }
    } catch (error) {
      console.error("[useAllEnrollments] localStorage fallback failed:", error);
    }

    setProgressMap(map);
    setLoading(false);
  }, [publicKey, connection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { progressMap, loading, refresh };
}
