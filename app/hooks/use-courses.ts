"use client";

import { useQuery } from "@tanstack/react-query";
import { useProgram } from "./use-program";
import { getTypedAccounts } from "@/anchor/idl";

export interface CourseAccount {
  publicKey: string;
  courseId: string;
  creator: string;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: string | null;
  creatorRewardXp: number;
  totalCompletions: number;
  totalEnrollments: number;
  isActive: boolean;
  createdAt: number;
}

export function useCourses(initialData?: CourseAccount[]) {
  const program = useProgram();

  return useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<CourseAccount[]> => {
      if (!program) return [];
      const accounts = getTypedAccounts(program);
      const all = await accounts.course.all();
      return all
        .filter((c) => c.account.isActive)
        .map((c) => ({
          publicKey: c.publicKey.toBase58(),
          courseId: c.account.courseId,
          creator: c.account.creator.toBase58(),
          lessonCount: c.account.lessonCount,
          difficulty: c.account.difficulty,
          xpPerLesson: c.account.xpPerLesson,
          trackId: c.account.trackId,
          trackLevel: c.account.trackLevel,
          prerequisite: c.account.prerequisite?.toBase58() ?? null,
          creatorRewardXp: c.account.creatorRewardXp,
          totalCompletions: c.account.totalCompletions,
          totalEnrollments: c.account.totalEnrollments,
          isActive: c.account.isActive,
          createdAt: c.account.createdAt?.toNumber() ?? 0,
        }));
    },
    enabled: !!program,
    staleTime: 30_000,
    initialData,
  });
}
