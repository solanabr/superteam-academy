"use client";

import { useCallback, useState } from "react";
import { useKitTransactionSigner, useSolanaClient } from "@solana/connector/react";
import { sendEnrollTransaction } from "@/lib/academy/enroll";

function mapEnrollErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Failed to enroll";
  const message = error.message;
  if (message.includes("#3012")) {
    return "Enrollment failed: required on-chain account is not initialized on this network.";
  }
  if (message.includes("Transaction simulation failed")) {
    return "Enrollment simulation failed. Verify network/RPC and course setup.";
  }
  return message;
}

export function useEnroll() {
  const { signer, ready } = useKitTransactionSigner();
  const { client, ready: clientReady } = useSolanaClient();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enroll = useCallback(
    async (courseId: string) => {
      if (!ready || !clientReady || !signer || !client) {
        throw new Error("Wallet not ready for enrollment");
      }

      setIsEnrolling(true);
      setError(null);
      try {
        const signature = await sendEnrollTransaction({
          courseId,
          signer,
          rpc: client.rpc,
          rpcSubscriptions: client.rpcSubscriptions,
        });
        setLastSignature(signature);
        return signature;
      } catch (enrollError) {
        const message = mapEnrollErrorMessage(enrollError);
        setError(message);
        throw enrollError;
      } finally {
        setIsEnrolling(false);
      }
    },
    [client, clientReady, ready, signer]
  );

  return {
    enroll,
    isEnrolling,
    lastSignature,
    error,
    ready: ready && clientReady && !!signer && !!client,
  };
}
