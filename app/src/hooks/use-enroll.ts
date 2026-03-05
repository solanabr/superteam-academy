"use client";

import { useState, useCallback } from "react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useSignTransaction } from "@privy-io/react-auth/solana";
import { useAuth } from "@/hooks/use-auth";
import { isEnrolledOnChain } from "@/services/onchain";
import { getConnection } from "@/lib/program";
import IDL from "@/lib/idl.json";
import type { OnchainAcademy } from "@/lib/onchain_academy";

interface UseEnrollResult {
  enroll: (courseId: string) => Promise<string | null>;
  closeEnrollment: (courseId: string) => Promise<string | null>;
  checkEnrolled: (courseId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useEnroll(): UseEnrollResult {
  const { publicKey, solanaWallet } = useAuth();
  const { signTransaction } = useSignTransaction();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enroll = useCallback(
    async (courseId: string): Promise<string | null> => {
      if (!publicKey || !solanaWallet) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const connection = getConnection();

        const dummyWallet = {
          publicKey,
          signTransaction: async <T extends Transaction | VersionedTransaction>(
            tx: T,
          ): Promise<T> => tx,
          signAllTransactions: async <
            T extends Transaction | VersionedTransaction,
          >(
            txs: T[],
          ): Promise<T[]> => txs,
        };

        const provider = new AnchorProvider(connection, dummyWallet, {
          commitment: "confirmed",
        });
        const program = new Program(IDL as OnchainAcademy, provider);

        const tx = await program.methods.enroll(courseId).transaction();

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = publicKey;

        // Sign via Privy, then send via our own Connection
        const serialized = tx.serialize({ requireAllSignatures: false });
        const { signedTransaction } = await signTransaction({
          transaction: serialized,
          wallet: solanaWallet,
        });

        const txSig = await connection.sendRawTransaction(signedTransaction, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        await connection.confirmTransaction(
          { signature: txSig, blockhash, lastValidBlockHeight },
          "confirmed",
        );

        return txSig;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Enrollment failed";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, solanaWallet, signTransaction],
  );

  const checkEnrolled = useCallback(
    async (courseId: string): Promise<boolean> => {
      if (!publicKey) return false;
      try {
        return await isEnrolledOnChain(courseId, publicKey);
      } catch {
        return false;
      }
    },
    [publicKey],
  );

  const closeEnrollment = useCallback(
    async (courseId: string): Promise<string | null> => {
      if (!publicKey || !solanaWallet) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const connection = getConnection();

        const dummyWallet = {
          publicKey,
          signTransaction: async <T extends Transaction | VersionedTransaction>(
            tx: T,
          ): Promise<T> => tx,
          signAllTransactions: async <
            T extends Transaction | VersionedTransaction,
          >(
            txs: T[],
          ): Promise<T[]> => txs,
        };

        const provider = new AnchorProvider(connection, dummyWallet, {
          commitment: "confirmed",
        });
        const program = new Program(IDL as OnchainAcademy, provider);

        const tx = await program.methods.closeEnrollment().transaction();

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = publicKey;

        const serialized = tx.serialize({ requireAllSignatures: false });
        const { signedTransaction } = await signTransaction({
          transaction: serialized,
          wallet: solanaWallet,
        });

        const txSig = await connection.sendRawTransaction(signedTransaction, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        await connection.confirmTransaction(
          { signature: txSig, blockhash, lastValidBlockHeight },
          "confirmed",
        );

        return txSig;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Close enrollment failed";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, solanaWallet, signTransaction],
  );

  return { enroll, closeEnrollment, checkEnrolled, loading, error };
}
