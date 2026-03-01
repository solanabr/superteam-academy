"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { issueCredentialForCompletion } from "@/lib/services/backend-api";
import { useAdminAuth } from "@/providers/AdminAuthProvider";

export function useIssueCredentialForCompletion() {
  const queryClient = useQueryClient();
  const { token } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: { courseId: string; learner: string; trackCollection?: string }) => {
      const result = await issueCredentialForCompletion(params, token);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      void queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credential issued or upgraded.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
