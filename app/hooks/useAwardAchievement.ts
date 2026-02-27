"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  awardAchievement,
  type AwardAchievementParams,
} from "@/lib/services/backend-api";
import { useAdminAuth } from "@/providers/AdminAuthProvider";

export function useAwardAchievement() {
  const queryClient = useQueryClient();
  const { token } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: AwardAchievementParams) => {
      const result = await awardAchievement(params, token);
      if (result.error) throw new Error(result.error);
      return { tx: result.tx!, asset: result.asset };
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["xpBalance", variables.recipient],
      });
      toast.success("Achievement awarded.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
