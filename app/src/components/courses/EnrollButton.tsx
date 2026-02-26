"use client";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignTransaction } from "@privy-io/react-auth/solana";
import { Button } from "@/components/ui/button";
import { useEnrollmentStore } from "@/store/enrollment-store";
import { useTranslations } from "next-intl";

type EnrollButtonProps = {
  courseId: string;
  courseTitle: string;
  className?: string;
};

import { Wallet, Loader2 } from "lucide-react";

export function EnrollButton({ courseId, courseTitle, className }: EnrollButtonProps) {
  const t = useTranslations("course_detail");
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();

  // Determine the active wallet address from Privy
  const linkedAddress = user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
  const walletAddress = linkedAddress ?? wallets?.[0]?.address;

  // Find the actual Solana wallet object that matches our target address
  const activeWallet = wallets.find(w => w.address === walletAddress) ?? wallets[0];

  // Get state from Zustand store
  const enrollment = useEnrollmentStore((state) => state.enrollments[courseId]);
  const loading = useEnrollmentStore((state) => state.loading[courseId] ?? false);
  const error = useEnrollmentStore((state) => state.errors[courseId]);
  const enroll = useEnrollmentStore((state) => state.enroll);
  const unenroll = useEnrollmentStore((state) => state.unenroll);

  const handleEnroll = async () => {
    if (!authenticated) return;

    if (!activeWallet || !walletAddress) {
      // If authenticated but no wallet found, we might need to prompt connection
      // or handle the case where Privy hasn't initialized the wallet yet.
      console.error("No Solana wallet found for authenticated user");
      useEnrollmentStore.getState().setError(courseId, "Solana wallet not found. Please ensure your wallet is connected.");
      return;
    }

    try {
      const enrollUiOptions = {
        title: "Course Enrollment",
        description: `Enrolling in ${courseTitle}. This requires a one-time rent deposit for on-chain progress tracking.`,
        buttonText: "Approve Enrollment",
        transactionInfo: {
          action: "0.003 SOL",
          title: "Wallet Balance"
        }
      };
      await enroll(walletAddress, courseId, signTransaction as any, activeWallet, enrollUiOptions);
    } catch (e) {
      // Error is handled by store
      console.error("Enrollment error:", e);
    }
  };

  const handleUnenroll = async () => {
    if (!authenticated || !walletAddress) return;

    try {
      const unenrollUiOptions = {
        title: "Rent Reclamation",
        description: `Closing enrollment for ${courseTitle}. You will reclaim your rent deposit.`,
        buttonText: "Reclaim Rent",
        transactionInfo: {
          action: "Reclaim 0.003 SOL",
          title: "Wallet Balance"
        }
      };
      // Update off-chain and on-chain state via store
      await unenroll(walletAddress, courseId, signTransaction as any, activeWallet, unenrollUiOptions);
    } catch (e: any) {
      console.error("Unenrollment error:", e);
      let msg = e.message || "Failed to close enrollment";
      if (msg.includes("Close cooldown not met")) {
        msg = "You must wait 24h after enrolling to close an active uncompleted course.";
      }
      alert(msg);
    }
  };

  if (!authenticated) {
    return (
      <p className="text-text-secondary text-sm">
        {t("login_to_enroll", { title: courseTitle })}
      </p>
    );
  }

  const enrolled = !!enrollment;
  const isComplete = enrollment && (enrollment.completedAt || enrollment.completedCount >= enrollment.totalLessons);

  if (enrolled) {
    return (
      <div className="flex flex-col gap-3 w-full items-start">
        <Button disabled className={className}>
          {t("enrolled")}
        </Button>
        <div className="flex flex-col gap-1.5">
          <Button
            variant="solana-ghost"
            size="sm"
            onClick={async () => {
              setIsUnenrolling(true);
              try {
                await handleUnenroll();
              } finally {
                setIsUnenrolling(false);
              }
            }}
            disabled={loading || isUnenrolling}
            className="font-mono text-[10px] uppercase font-bold tracking-tight"
          >
            {isUnenrolling ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wallet size={16} />
            )}
            {isComplete ? "Reclaim Enrollment Rent" : "Close Enrollment & Reclaim"}
          </Button>
          {!isComplete && !isUnenrolling && (
            <p className="text-[10px] text-text-muted italic max-w-[200px] leading-tight">
              Note: Unfinished courses require a 24h cooldown after enrollment before rent can be reclaimed.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleEnroll}
        disabled={loading}
        className={`${className ?? ""} bg-solana/80 hover:bg-solana hover:shadow-[0_0_24px_-4px_rgba(20,240,148,0.5)] transition-all duration-200`}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {t("enrolling")}
          </>
        ) : (
          t("enroll_cta")
        )}
      </Button>
      {error && <p className="text-rust text-sm">{error}</p>}
    </div>
  );
}
