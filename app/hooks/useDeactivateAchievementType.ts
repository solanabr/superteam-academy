"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deactivateAchievementType,
  type DeactivateAchievementTypeParams,
} from "@/lib/services/backend-api";
import { useAdminAuth } from "@/providers/AdminAuthProvider";

export function useDeactivateAchievementType() {
  const { token } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: DeactivateAchievementTypeParams) => {
      const result = await deactivateAchievementType(params, token);
      if (result.error) throw new Error(result.error);
      return result.tx!;
    },
    onSuccess: (_, params) => {
      toast.success(`Achievement type "${params.achievementId}" deactivated.`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
