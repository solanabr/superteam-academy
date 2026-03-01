"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCredentialCollection,
  type CreateCredentialCollectionParams,
} from "@/lib/services/backend-api";
import { useAdminAuth } from "@/providers/AdminAuthProvider";

export function useCreateCredentialCollection() {
  const queryClient = useQueryClient();
  const { token } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: CreateCredentialCollectionParams) => {
      const result = await createCredentialCollection(params, token);
      if (result.error) throw new Error(result.error);
      return {
        tx: result.tx!,
        collection: result.collection!,
        trackId: result.trackId ?? 0,
      };
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["credential-collections"] });
      toast.success(`Collection created (Track ${data.trackId}). Saved for automation.`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
