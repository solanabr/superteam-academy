"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateConfig } from "@/lib/services/backend-api";
import { useAdminAuth } from "@/providers/AdminAuthProvider";

export interface UpdateConfigParams {
  newBackendSigner: string;
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  const { token } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: UpdateConfigParams) => {
      const result = await updateConfig(params, token);
      if (result.error) throw new Error(result.error);
      return result.tx!;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["config"] });
      toast.success("Config updated (backend signer rotated).");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
