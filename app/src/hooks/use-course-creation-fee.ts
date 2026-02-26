"use client";

import { useState, useCallback, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { toast } from "sonner";
import { ADMIN_WALLETS } from "@/lib/admin";

const FEE_SOL = Number(
  process.env.NEXT_PUBLIC_CREATE_COURSE_TRANSFER_SIZE ?? "0.01",
);

/**
 * Hook to send the course-creation fee (SOL transfer) to the treasury wallet.
 * Returns the transaction signature on success.
 */
export function useCourseCreationFee() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [paying, setPaying] = useState(false);

  const treasury = useMemo(() => {
    const addr =
      process.env.NEXT_PUBLIC_TREASURY_WALLET ?? ADMIN_WALLETS[0] ?? null;
    if (!addr) return null;
    try {
      return new PublicKey(addr);
    } catch {
      return null;
    }
  }, []);

  const payFee = useCallback(async (): Promise<string> => {
    if (!publicKey) throw new Error("Wallet not connected");
    if (!treasury) throw new Error("Treasury wallet not configured");

    setPaying(true);
    try {
      const lamports = Math.round(FEE_SOL * LAMPORTS_PER_SOL);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: treasury,
          lamports,
        }),
      );

      tx.feePayer = publicKey;
      tx.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const sig = await sendTransaction(tx, connection);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      toast.success(`Payment of ${FEE_SOL} SOL confirmed`, {
        description: `${sig.slice(0, 8)}...`,
        action: {
          label: "View",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${sig}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet"}`,
              "_blank",
            ),
        },
      });

      return sig;
    } finally {
      setPaying(false);
    }
  }, [connection, publicKey, sendTransaction, treasury]);

  return { payFee, paying, feeSol: FEE_SOL, ready: !!publicKey && !!treasury };
}
