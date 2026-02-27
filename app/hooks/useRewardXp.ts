"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rewardXp } from "@/lib/services/backend-api";
import { useAdminAuth } from "@/providers/AdminAuthProvider";

export interface RewardXpParams {
  recipient: string;
  amount: number;
  memo?: string;
}

export function useRewardXp() {
  const queryClient = useQueryClient();
  const { token } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: RewardXpParams) => {
      const result = await rewardXp(params, token);
      if (result.error) throw new Error(result.error);
      return result.tx!;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["xpBalance", variables.recipient],
      });
      toast.success("XP rewarded.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
