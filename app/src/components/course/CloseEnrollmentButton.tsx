"use client";

import { type MouseEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getLearningProgressService } from "@/lib/services/learning-progress";
import {
  isOnChainBridgeStrict,
  shouldUseOnChainBridge,
} from "@/lib/onchain/client-bridge";
import { submitCloseEnrollmentTx } from "@/lib/onchain/learner-tx";

interface CloseEnrollmentButtonProps {
  courseId: string;
  courseSlug?: string;
  onChainCourseId?: string;
  className?: string;
  label?: string;
  loadingLabel?: string;
  confirmMessage?: string;
  onClosed?: () => void;
  onError?: (message: string) => void;
}

function resolveBridgeCourseId(...candidates: Array<string | undefined>): string | null {
  const encoder = new TextEncoder();
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = candidate.trim();
    if (!normalized) continue;
    if (encoder.encode(normalized).length > 32) continue;
    return normalized;
  }
  return null;
}

export function CloseEnrollmentButton({
  courseId,
  courseSlug,
  onChainCourseId,
  className,
  label = "Unenroll",
  loadingLabel = "Closing...",
  confirmMessage = "Unenroll from this course? Your local progress for this course will be cleared.",
  onClosed,
  onError,
}: CloseEnrollmentButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const [closing, setClosing] = useState(false);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setClosing(true);
    try {
      let skipOnChainBridge = false;
      if (shouldUseOnChainBridge()) {
        // Learner-signed close_enrollment is executed directly from wallet UI.
        skipOnChainBridge = true;
        const bridgeCourseId = resolveBridgeCourseId(
          onChainCourseId,
          courseSlug,
          courseId
        );

        if (!bridgeCourseId) {
          if (isOnChainBridgeStrict()) {
            throw new Error("On-chain course ID is missing or exceeds 32 bytes.");
          }
          console.warn(
            "[onchain-bridge][close_enrollment] No valid on-chain courseId (<=32 bytes)."
          );
        } else if (!connected || !publicKey || !sendTransaction) {
          if (isOnChainBridgeStrict()) {
            throw new Error(
              "Wallet connection is required to sign close enrollment."
            );
          }
          console.warn(
            "[onchain-bridge][close_enrollment] Wallet not connected. Skipping on-chain close."
          );
        } else {
          try {
            const tx = await submitCloseEnrollmentTx({
              courseId: bridgeCourseId,
              learner: publicKey,
              connection,
              sendTransaction,
            });
            console.info(
              `[onchain-bridge][close_enrollment] submitted ${tx.signature}; syncing local projection.`
            );
          } catch (txError) {
            const message =
              txError instanceof Error
                ? txError.message
                : "Unknown learner signing failure";
            if (isOnChainBridgeStrict()) {
              throw new Error(`[onchain-bridge][close_enrollment] ${message}`);
            }
            console.warn(
              `[onchain-bridge][close_enrollment] ${message}. Falling back to Supabase projection.`
            );
          }
        }
      }

      const service = getLearningProgressService();
      await service.closeEnrollment(user.id, courseId, {
        onChainCourseId,
        skipOnChainBridge,
      });
      onClosed?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to close enrollment";
      console.error("[CloseEnrollmentButton] close enrollment failed:", error);
      onError?.(message);
    } finally {
      setClosing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={closing}
      className={
        className ||
        "px-4 py-2 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      }
    >
      {closing ? loadingLabel : label}
    </button>
  );
}
