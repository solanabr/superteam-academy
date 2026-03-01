"use client";

import { enrollOnChain } from "@/lib/solana/enroll-course";
import { useUserStore } from "@/lib/store/user-store";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const useEnrollment = () => {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();
  const enrollments = useUserStore((state) => state.enrollments);
  const enroll = useUserStore((state) => state.enroll);
  const recordActivity = useUserStore((state) => state.recordActivity);
  const [pending, setPending] = useState(false);
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  const enrollInCourse = async (courseId: string): Promise<void> => {
    if (!wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }

    setPending(true);
    setPendingCourseId(courseId);
    try {
      if (anchorWallet) {
        try {
          const signature = await enrollOnChain(anchorWallet, courseId);
          setLastSignature(signature);
          queryClient.invalidateQueries({ queryKey: ["onchain-enrollment"] });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          const isNotInitialized = msg.includes("AccountNotInitialized") || msg.includes("not found");
          if (!isNotInitialized) {
            console.warn("On-chain enrollment failed:", msg);
          }
        }
      }
      enroll(courseId);
      recordActivity();
      toast.success("Successfully enrolled!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setPending(false);
      setPendingCourseId(null);
    }
  };

  return {
    enrollments,
    pending,
    pendingCourseId,
    lastSignature,
    isEnrolled: (courseId: string) => enrollments.includes(courseId),
    enrollInCourse,
  };
};
