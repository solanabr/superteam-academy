"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { completeLesson } from "@/lib/services/backend-api";

export interface CompleteLessonParams {
  courseId?: string;
  learner?: string;
  lessonIndex?: number;
}

export function useCompleteLesson() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CompleteLessonParams) => {
      const learner = params.learner ?? publicKey?.toBase58();
      if (!learner) throw new Error("Learner wallet required");
      const result = await completeLesson({
        courseId: params.courseId ?? "test-course-1",
        learner,
        lessonIndex: params.lessonIndex ?? 0,
      });
      if (result.error) throw new Error(result.error);
      if (!result.tx) throw new Error("No transaction signature returned");
      return result.tx;
    },
    onSuccess: (_, params) => {
      const walletKey = publicKey?.toBase58() ?? params.learner ?? "";
      void queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      void queryClient.invalidateQueries({ queryKey: ["xpBalance", walletKey] });
      toast.success("Lesson completed.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
