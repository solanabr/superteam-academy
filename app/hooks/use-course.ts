"use client";

import { useQuery } from "@tanstack/react-query";
import { useProgram } from "./use-program";
import { getCoursePda } from "@/lib/pda";
import { getTypedAccounts } from "@/anchor/idl";
import type { CourseAccount } from "./use-courses";

export function useCourse(courseId: string | undefined) {
  const program = useProgram();

  return useQuery({
    queryKey: ["course", courseId],
    queryFn: async (): Promise<CourseAccount | null> => {
      if (!program || !courseId) return null;
      const pda = getCoursePda(courseId);
      try {
        const accounts = getTypedAccounts(program);
        const c = await accounts.course.fetch(pda);
        return {
          publicKey: pda.toBase58(),
          courseId: c.courseId,
          creator: c.creator.toBase58(),
          lessonCount: c.lessonCount,
          difficulty: c.difficulty,
          xpPerLesson: c.xpPerLesson,
          trackId: c.trackId,
          trackLevel: c.trackLevel,
          prerequisite: c.prerequisite?.toBase58() ?? null,
          creatorRewardXp: c.creatorRewardXp,
          totalCompletions: c.totalCompletions,
          totalEnrollments: c.totalEnrollments,
          isActive: c.isActive,
          createdAt: c.createdAt?.toNumber() ?? 0,
        };
      } catch {
        return null;
      }
    },
    enabled: !!program && !!courseId,
    staleTime: 30_000,
  });
}
