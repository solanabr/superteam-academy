"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  updateCourse,
  type UpdateCourseParams as ApiParams,
} from "@/lib/services/backend-api";
import { useAdminAuth } from "@/providers/AdminAuthProvider";

export interface UpdateCourseParams extends Partial<ApiParams> {
  courseId?: string;
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const { token } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: UpdateCourseParams) => {
      const result = await updateCourse(
        {
          courseId: params.courseId ?? "test-course-1",
          newContentTxId: params.newContentTxId,
          newIsActive: params.newIsActive,
          newXpPerLesson: params.newXpPerLesson,
          newCreatorRewardXp: params.newCreatorRewardXp,
          newMinCompletionsForReward: params.newMinCompletionsForReward,
        },
        token
      );
      if (result.error) throw new Error(result.error);
      return result.tx!;
    },
    onSuccess: (_, params) => {
      void queryClient.invalidateQueries({
        queryKey: ["course", params.courseId ?? "test-course-1"],
      });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
