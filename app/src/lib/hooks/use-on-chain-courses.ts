"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect, useCallback } from "react";
import { getReadonlyProgram } from "@/lib/solana/program";

export interface OnChainCourse {
  publicKey: any; // PublicKey
  courseId: string;
  creator: any;
  contentTxId: number[];
  version: number;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: any | null;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  totalCompletions: number;
  totalEnrollments: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  bump: number;
}

export function useOnChainCourses() {
  const { connection } = useConnection();
  const [courses, setCourses] = useState<OnChainCourse[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const program = getReadonlyProgram(connection);
      const allCourses = await (program.account as any).course.all();
      setCourses(
        allCourses.map((acc: any) => ({
          publicKey: acc.publicKey,
          ...(acc.account as any),
        })),
      );
    } catch {
      setCourses([]);
    }
    setLoading(false);
  }, [connection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { courses, loading, refresh };
}
