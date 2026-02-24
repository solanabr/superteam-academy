"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useProgram } from "./use-program";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getEnrollmentPda } from "@/lib/pda";
import { getTypedAccounts } from "@/anchor/idl";
import { useEffect, useMemo } from "react";
import BN from "bn.js";

export interface EnrollmentAccount {
  course: string;
  enrolledAt: number;
  completedAt: number | null;
  lessonFlags: BN[];
  credentialAsset: string | null;
}

export function useEnrollment(courseId: string | undefined) {
  const program = useProgram();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  const walletBase58 = publicKey?.toBase58();
  const queryKey = useMemo(() => ["enrollment", courseId, walletBase58], [courseId, walletBase58]);

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<EnrollmentAccount | null> => {
      if (!program || !courseId || !publicKey) return null;
      const pda = getEnrollmentPda(courseId, publicKey);
      const accounts = getTypedAccounts(program);
      const enrollment = await accounts.enrollment.fetchNullable(pda);
      if (!enrollment) return null;
      return {
        course: enrollment.course.toBase58(),
        enrolledAt: enrollment.enrolledAt.toNumber(),
        completedAt: enrollment.completedAt?.toNumber() ?? null,
        lessonFlags: enrollment.lessonFlags as BN[],
        credentialAsset: enrollment.credentialAsset?.toBase58() ?? null,
      };
    },
    enabled: !!program && !!courseId && !!publicKey,
    staleTime: 5_000,
  });

  // WebSocket subscription for real-time updates
  useEffect(() => {
    if (!courseId || !publicKey) return;
    const pda = getEnrollmentPda(courseId, publicKey);
    const subId = connection.onAccountChange(pda, () => {
      queryClient.invalidateQueries({ queryKey });
    });
    return () => {
      connection.removeAccountChangeListener(subId);
    };
  }, [courseId, publicKey, connection, queryClient, queryKey]);

  return query;
}
