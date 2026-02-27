"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCourse } from "@/lib/services/backend-api";
import { useAdminAuth } from "@/providers/AdminAuthProvider";

export interface CreateCourseParams {
  courseId?: string;
  lessonCount?: number;
  xpPerLesson?: number;
  creator?: string;
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { token } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: CreateCourseParams) => {
      const result = await createCourse(
        {
          courseId: params.courseId ?? "test-course-1",
          lessonCount: params.lessonCount ?? 3,
          xpPerLesson: params.xpPerLesson ?? 100,
          creator: params.creator,
        },
        token
      );
      if (result.error) throw new Error(result.error);
      return result.tx!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course created.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
