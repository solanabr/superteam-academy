"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN, web3, type Idl, type Wallet as AnchorWallet } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { getConnection, PROGRAM_ID } from "@/lib/solana";
import { findEnrollmentPDA, findCoursePDA } from "@/lib/pda";
import { getProgress } from "@/services/learning-progress";
import type { CourseProgress, TxResult } from "@/types";

export function useEnrollment(courseId: string | undefined) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey || !courseId) return;
    setLoading(true);
    try {
      const p = await getProgress(publicKey.toBase58(), courseId);
      setProgress(p);
    } finally {
      setLoading(false);
    }
  }, [publicKey, courseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enroll = useCallback(async (): Promise<TxResult> => {
    if (!publicKey || !courseId || !signTransaction || !signAllTransactions) {
      return { success: false, error: "Wallet not connected" };
    }
    setEnrolling(true);
    try {
      // Verify connection is reachable and get fresh blockhash
      let latestBlockhash;
      try {
        latestBlockhash = await connection.getLatestBlockhash("finalized");
      } catch {
        return { success: false, error: "Cannot reach Solana devnet. Check your connection." };
      }

      const wallet = {
        publicKey,
        signTransaction: signTransaction as AnchorWallet["signTransaction"],
        signAllTransactions: signAllTransactions as AnchorWallet["signAllTransactions"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any as AnchorWallet;

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      // Dynamically import IDL to avoid SSR issues
      const { IDL } = await import("@/lib/idl").catch(() => ({ IDL: null }));
      if (!IDL) {
        return { success: false, error: "IDL not available" };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const program = new Program(IDL as unknown as Idl, provider);
      const [coursePda] = findCoursePDA(courseId);
      const [enrollmentPda] = findEnrollmentPDA(courseId, publicKey);

      const sig = await (program.methods as unknown as {
        enroll: (id: string) => {
          accountsPartial: (accounts: Record<string, unknown>) => {
            rpc: (opts?: Record<string, unknown>) => Promise<string>;
          };
        };
      })
        .enroll(courseId)
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({
          commitment: "confirmed",
          skipPreflight: false,
          maxRetries: 3,
          // Pass the fresh blockhash we already fetched
          minContextSlot: latestBlockhash.lastValidBlockHeight,
        });

      await refresh();
      return { success: true, signature: sig };
    } catch (err) {
      return { success: false, error: String(err) };
    } finally {
      setEnrolling(false);
    }
  }, [publicKey, courseId, signTransaction, signAllTransactions, connection, refresh]);

  return { progress, loading, enrolling, enroll, refresh };
}
