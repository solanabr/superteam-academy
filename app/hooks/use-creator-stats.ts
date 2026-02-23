"use client";

import { useQuery } from "@tanstack/react-query";
import { useProgram } from "./use-program";
import { useWallet } from "@solana/wallet-adapter-react";

export interface CreatorCourseStats {
  courseId: string;
  enrollments: number;
  completions: number;
  xpPerLesson: number;
  lessonCount: number;
}

export interface CreatorStats {
  totalCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  courses: CreatorCourseStats[];
}

export function useCreatorStats() {
  const program = useProgram();
  const { publicKey } = useWallet();

  return useQuery<CreatorStats>({
    queryKey: ["creatorStats", publicKey?.toBase58()],
    queryFn: async () => {
      if (!program || !publicKey) {
        return { totalCourses: 0, totalEnrollments: 0, totalCompletions: 0, courses: [] };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all: any[] = await (program.account as any).course.all();
      const myCourses = all.filter(
        (c: any) => c.account.creator.toBase58() === publicKey.toBase58()
      );

      const courses: CreatorCourseStats[] = myCourses.map((c: any) => ({
        courseId: c.account.courseId,
        enrollments: c.account.totalEnrollments,
        completions: c.account.totalCompletions,
        xpPerLesson: c.account.xpPerLesson,
        lessonCount: c.account.lessonCount,
      }));

      return {
        totalCourses: courses.length,
        totalEnrollments: courses.reduce((s, c) => s + c.enrollments, 0),
        totalCompletions: courses.reduce((s, c) => s + c.completions, 0),
        courses,
      };
    },
    enabled: !!program && !!publicKey,
    staleTime: 60_000,
  });
}
