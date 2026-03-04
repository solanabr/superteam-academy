"use client";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignTransaction } from "@privy-io/react-auth/solana";
import { Button } from "@/components/ui/button";
import { useCourseStore } from "@/store/course-store";
import { useTranslations } from "next-intl";

type EnrollButtonProps = {
  courseId: string;
  courseTitle: string;
  className?: string;
};

import { Wallet, Loader2 } from "lucide-react";

import { SolanaTransactionModal } from "@/components/ui/SolanaTransactionModal";

export function EnrollButton({ courseId, courseTitle, className }: EnrollButtonProps) {
  const t = useTranslations("course_detail");
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [activeTx, setActiveTx] = useState<any>(null);
  const [txDetails, setTxDetails] = useState({ title: "", description: "", amount: 0, type: 'enroll' as 'enroll' | 'unenroll' });

  const { authenticated, user, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();

  // Determine the active wallet address from Privy
  const linkedAddress = user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
  const walletAddress = linkedAddress ?? wallets?.[0]?.address;

  // Find the actual Solana wallet object that matches our target address
  const activeWallet = wallets.find(w => w.address === walletAddress) ?? wallets[0];

  // Get state from consolidated courseStore
  const progress = useCourseStore((s) => s.progress);
  const loading = useCourseStore((s) => s.isLoading || s.isEnrolling);
  const txSuccess = useCourseStore((s) => s.txSuccess);
  const txError = useCourseStore((s) => s.txError);
  const clearTxFeedback = useCourseStore((s) => s.clearTxFeedback);
  const enroll = useCourseStore((s) => s.enroll);
  const unenroll = useCourseStore((s) => s.unenroll);

  const handleEnrollInitiate = async () => {
    if (!authenticated) return;
    if (!activeWallet || !walletAddress) {
      connectWallet();
      return;
    }

    try {
      const { useEnrollmentStore } = await import("@/store/enrollment-store");
      const tx = await useEnrollmentStore.getState().prepareEnrollment(walletAddress, courseId);
      setActiveTx(tx);
      setTxDetails({
        title: "Course Enrollment",
        description: `Enrolling in ${courseTitle}. This requires a one-time rent deposit for on-chain progress tracking.`,
        amount: 0.003,
        type: 'enroll'
      });
      clearTxFeedback();
      setTxModalOpen(true);
    } catch (e) {
      console.error("Preparation error:", e);
    }
  };

  const handleUnenrollInitiate = async () => {
    if (!authenticated) return;
    if (!activeWallet || !walletAddress) {
      connectWallet();
      return;
    }

    try {
      const { useEnrollmentStore } = await import("@/store/enrollment-store");
      const tx = await useEnrollmentStore.getState().prepareCloseEnrollment(walletAddress, courseId);
      setActiveTx(tx);
      setTxDetails({
        title: "Rent Reclamation",
        description: `Closing enrollment for ${courseTitle}. You will reclaim your rent deposit.`,
        amount: 0.003,
        type: 'unenroll'
      });
      clearTxFeedback();
      setTxModalOpen(true);
    } catch (e) {
      console.error("Preparation error:", e);
    }
  };

  const handleConfirmTransaction = async () => {
    // Keep modal open to show status

    // Check if embedded wallet to suppress Privy UI
    const isEmbeddedWallet =
      user?.linkedAccounts?.some((a) => a.type === "wallet" && (a as any).walletClientType === "privy") ||
      (user?.wallet as any)?.walletClientType === "privy";

    const uiOptions = {
      showWalletUIs: !isEmbeddedWallet, // Only show Privy UI for external wallets
    };

    try {
      if (txDetails.type === 'enroll') {
        await enroll(walletAddress!, courseId, signTransaction as any, activeWallet, uiOptions);
      } else {
        if (!!progress?.completedAt) {
          const { useCourseStore } = await import("@/store/course-store");
          await useCourseStore.getState().reclaimRent(walletAddress!, courseId, signTransaction as any, activeWallet, uiOptions);
        } else {
          await unenroll(walletAddress!, courseId, signTransaction as any, activeWallet, uiOptions);
        }
      }
    } catch (e) {
      console.error("Transaction confirmation failed:", e);
    }
  };

  const renderEnrollButton = () => {
    if (!authenticated) {
      return (
        <p className="text-text-secondary text-sm">
          {t("login_to_enroll", { title: courseTitle })}
        </p>
      );
    }

    const enrolled = !!progress;
    const isComplete = !!progress?.completedAt;
    const onChainActive = progress?.onChainActive ?? false;

    // Scenario 1: Truly Finished (Completed + Reclaimed)
    if (isComplete && !onChainActive) {
      return null;
    }

    // Scenario 2: Enrolled (Active or Completed-but-not-reclaimed)
    if (enrolled) {
      return (
        <div className="flex flex-col gap-3 w-full items-start">
          {!isComplete && (
            <Button disabled className={`w-fit ${className ?? ""}`}>
              {t("enrolled")}
            </Button>
          )}
          <div className="flex flex-col gap-1.5">
            <Button
              variant="solana-ghost"
              size="sm"
              onClick={handleUnenrollInitiate}
              disabled={loading || isUnenrolling}
              className="w-fit font-mono text-[10px] uppercase font-bold tracking-tight"
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
            {txError && !txModalOpen && <p className="text-rust text-[10px]">{txError}</p>}
          </div>
        </div>
      );
    }

    // Scenario 2.5: Successfully Reclaimed Rent (progress is null, but success flag is true)
    const store = useCourseStore.getState();
    if (store.txSuccess && store.lastMutation === 'unenroll') {
      return (
        <div className="flex flex-col gap-2">
          <Button disabled variant="outline" className={`w-fit ${className ?? ""} border-solana text-solana bg-solana/10`}>
            <Wallet size={16} className="mr-2" />
            Rent Reclaimed
          </Button>
          <p className="text-[10px] text-text-muted italic max-w-[200px] leading-tight">
            Rent has been reclaimed successfully.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleEnrollInitiate}
          disabled={loading}
          className={`w-fit ${className ?? ""} bg-solana/80 hover:bg-solana hover:shadow-[0_0_24px_-4px_rgba(20,240,148,0.5)] transition-all duration-200`}
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
        {txError && !txModalOpen && <p className="text-rust text-sm">{txError}</p>}
      </div>
    );
  };

  return (
    <>
      {renderEnrollButton()}

      <SolanaTransactionModal
        isOpen={txModalOpen}
        onClose={() => {
          setTxModalOpen(false);
          clearTxFeedback();
        }}
        onConfirm={handleConfirmTransaction}
        title={txDetails.title}
        description={txDetails.description}
        amount={txDetails.amount}
        programId="AVES32TXPwZ7kuVizTZsqzBr1UVYrcZyqQ6BxHaGchWU"
        transaction={activeTx}
        isLoading={loading}
        success={txSuccess}
        error={txError}
        isReclaim={txDetails.type === 'unenroll'}
        successMessage={txDetails.type === 'enroll'
          ? "Enrollment is successful, continue learning, and rent is reclaimable after course's completion."
          : "rent reclaimed successfully"
        }
      />
    </>
  );
}
