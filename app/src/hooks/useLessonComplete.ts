"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { completeLessonWithProgress } from "@/lib/services/LearningProgressService";
import { useProgressStore } from "@/stores/progress-store";

export interface UseLessonCompleteResult {
  completing: boolean;
  isCompleted: (courseId: string, lessonIndex: number) => boolean;
  markComplete: (params: {
    courseId: string;
    courseTitle?: string;
    lessonIndex: number;
    lessonTitle?: string;
    xpPerLesson?: number;
  }) => Promise<string | null>;
}

export function useLessonComplete(): UseLessonCompleteResult {
  const { publicKey, signMessage } = useWallet();
  const [completing, setCompleting] = useState(false);
  const isLessonComplete = useProgressStore((s) => s.isLessonComplete);

  const markComplete = useCallback(
    async ({
      courseId,
      courseTitle,
      lessonIndex,
      lessonTitle,
      xpPerLesson = 0,
    }: {
      courseId: string;
      courseTitle?: string;
      lessonIndex: number;
      lessonTitle?: string;
      xpPerLesson?: number;
    }): Promise<string | null> => {
      if (!publicKey) throw new Error("Wallet not connected");
      if (!signMessage) throw new Error("Wallet does not support message signing");

      setCompleting(true);
      try {
        const result = await completeLessonWithProgress({
          learner: publicKey.toBase58(),
          courseId,
          courseTitle,
          lessonIndex,
          lessonTitle,
          xpEarned: xpPerLesson,
          signMessage,
        });
        return result.signature;
      } finally {
        setCompleting(false);
      }
    },
    [publicKey, signMessage]
  );

  return {
    completing,
    isCompleted: isLessonComplete,
    markComplete,
  };
}
