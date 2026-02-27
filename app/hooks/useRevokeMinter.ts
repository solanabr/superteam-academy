"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { revokeMinter } from "@/lib/services/backend-api";
import { useAdminAuth } from "@/providers/AdminAuthProvider";

export interface RevokeMinterParams {
  minter: string;
}

export function useRevokeMinter() {
  const { token } = useAdminAuth();

  return useMutation({
    mutationFn: async (params: RevokeMinterParams) => {
      const result = await revokeMinter(params, token);
      if (result.error) throw new Error(result.error);
      return result.tx!;
    },
    onSuccess: () => {
      toast.success("Minter revoked.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
