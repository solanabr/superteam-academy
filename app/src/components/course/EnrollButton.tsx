"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getLearningProgressService } from "@/lib/services/learning-progress";
import {
  isOnChainBridgeStrict,
  shouldUseOnChainBridge,
} from "@/lib/onchain/client-bridge";
import { submitEnrollTx } from "@/lib/onchain/learner-tx";
import { CloseEnrollmentButton } from "@/components/course/CloseEnrollmentButton";

interface EnrollButtonProps {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  totalLessons: number;
  onChainCourseId?: string;
}

export function EnrollButton({
  courseId,
  courseTitle,
  courseSlug,
  totalLessons,
  onChainCourseId,
}: EnrollButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const router = useRouter();
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveBridgeCourseId = (...candidates: Array<string | undefined>) => {
    const encoder = new TextEncoder();
    for (const candidate of candidates) {
      if (!candidate) continue;
      const normalized = candidate.trim();
      if (!normalized) continue;
      if (encoder.encode(normalized).length > 32) continue;
      return normalized;
    }
    return null;
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      setEnrolled(false);
      return;
    }

    setChecking(true);
    const service = getLearningProgressService();

    service
      .getProgress(user.id, courseId)
      .then((progress) => {
        if (progress) {
          setEnrolled(true);
        } else {
          setEnrolled(false);
        }
      })
      .catch((err) => {
        console.error("[EnrollButton] getProgress error:", err);
        setEnrolled(false);
      })
      .finally(() => setChecking(false));
  }, [user, courseId, authLoading]);

  const handleEnroll = async () => {
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    setEnrolling(true);
    setError(null);

    try {
      let skipOnChainBridge = false;
      if (shouldUseOnChainBridge()) {
        // This component owns learner-signed enroll submissions.
        skipOnChainBridge = true;
        const bridgeCourseId = resolveBridgeCourseId(
          onChainCourseId,
          courseSlug,
          courseId
        );

        if (!bridgeCourseId) {
          if (isOnChainBridgeStrict()) {
            throw new Error(
              "On-chain course ID is missing or exceeds 32 bytes."
            );
          }
          console.warn(
            "[onchain-bridge][enroll] No valid on-chain courseId (<=32 bytes)."
          );
        } else if (!connected || !publicKey || !sendTransaction) {
          if (isOnChainBridgeStrict()) {
            throw new Error(
              "Wallet connection is required to sign on-chain enrollment."
            );
          }
          console.warn(
            "[onchain-bridge][enroll] Wallet not connected. Skipping on-chain enrollment."
          );
        } else {
          try {
            const tx = await submitEnrollTx({
              courseId: bridgeCourseId,
              learner: publicKey,
              connection,
              sendTransaction,
            });
            console.info(
              `[onchain-bridge][enroll] submitted ${tx.signature}; syncing local projection.`
            );
          } catch (onChainError) {
            const message =
              onChainError instanceof Error
                ? onChainError.message
                : "Unknown learner signing failure";
            if (isOnChainBridgeStrict()) {
              throw new Error(`[onchain-bridge][enroll] ${message}`);
            }
            console.warn(
              `[onchain-bridge][enroll] ${message}. Falling back to Supabase projection.`
            );
          }
        }
      }

      const service = getLearningProgressService();
      await service.enroll(user.id, courseId, {
        courseTitle,
        courseSlug,
        totalLessons,
        onChainCourseId,
        skipOnChainBridge,
      });
      setEnrolled(true);
    } catch (err) {
      console.error("[EnrollButton] Enrollment failed:", err);
      setError(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  if (checking) {
    return (
      <div className="h-12 w-48 rounded-full bg-neutral-100 animate-pulse" />
    );
  }

  if (enrolled) {
    return (
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-3">
          <span className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
            Enrolled!
          </span>
          <Link
            href={`/courses/${courseSlug}`}
            className="px-5 py-2.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Continue Course &rarr;
          </Link>
          <CloseEnrollmentButton
            courseId={courseId}
            courseSlug={courseSlug}
            onChainCourseId={onChainCourseId}
            onClosed={() => setEnrolled(false)}
            onError={(message) => setError(message)}
            className="px-4 py-2.5 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleEnroll}
        disabled={enrolling}
        className="px-6 py-3 bg-neutral-900 text-white rounded-full text-sm font-semibold hover:bg-neutral-700 hover:scale-105 transition-all duration-300 shadow-lg shadow-neutral-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {enrolling ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Enrolling...
          </span>
        ) : user ? (
          "Enroll in this Course"
        ) : (
          "Sign in to Enroll"
        )}
      </button>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
