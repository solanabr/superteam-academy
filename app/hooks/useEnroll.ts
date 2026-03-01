"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { toast } from "sonner";
import type { AnchorError } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { getCoursePda, getEnrollmentPda } from "@/lib/program";
import { getAnchorErrorMessage } from "@/lib/anchor-error-messages";
import { indexEnrollment } from "@/lib/services/backend-api";

export interface EnrollParams {
  courseId: string;
  prereqCoursePda?: PublicKey;
  prereqEnrollmentPda?: PublicKey;
}

export function useEnroll() {
  const program = useProgram();
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, prereqCoursePda, prereqEnrollmentPda }: EnrollParams) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      const coursePda = getCoursePda(courseId, program.programId);
      const enrollmentPda = getEnrollmentPda(courseId, publicKey, program.programId);

      const builder = program.methods
        .enroll(courseId)
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: publicKey,
          systemProgram: SystemProgram.programId,
        });

      if (prereqCoursePda && prereqEnrollmentPda) {
        return builder
          .remainingAccounts([
            { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
            { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false },
          ])
          .rpc();
      }
      return builder.rpc();
    },
    onSuccess: async (txSignature, { courseId }) => {
      const walletKey = publicKey?.toBase58() ?? "";
      void indexEnrollment({ learner: walletKey, courseId, txSignature });
      void queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      void queryClient.invalidateQueries({ queryKey: ["xpBalance", walletKey] });
      void queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("Enrolled successfully.");
    },
    onError: (err: unknown) => {
      const code = (err as AnchorError)?.error?.errorCode?.code;
      toast.error(getAnchorErrorMessage(String(code ?? "")));
    },
  });
}
