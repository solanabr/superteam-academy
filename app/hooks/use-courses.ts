"use client";

import { useQuery } from "@tanstack/react-query";
import { useProgram } from "./use-program";

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

export function useCourses() {
  const program = useProgram();

  return useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<CourseAccount[]> => {
      if (!program) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all: any[] = await (program.account as any).course.all();
      return all
        .filter((c: any) => c.account.isActive)
        .map((c: any) => ({
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
          createdAt: c.account.createdAt
            ? (c.account.createdAt as unknown as { toNumber(): number }).toNumber()
            : 0,
        }));
    },
    enabled: !!program,
    staleTime: 30_000,
  });
}
