"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useEnrollmentStore } from "@/store/enrollment-store";
import { Loader2, Trophy, CheckCircle } from "lucide-react";

type CourseCompletionProps = {
    courseId: string;
    totalLessons: number;
};

export function CourseCompletion({ courseId, totalLessons }: CourseCompletionProps) {
    const { authenticated, user } = usePrivy();
    const { wallets } = useWallets();

    const linkedAddress =
        user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
    const walletAddress = linkedAddress ?? wallets?.[0]?.address;

    // Use atomic selectors to prevent re-render issues
    const completedCount = useEnrollmentStore((state) =>
        state.enrollments[courseId]?.completedCount ?? 0
    );
    const completedAt = useEnrollmentStore((state) =>
        state.enrollments[courseId]?.completedAt ?? null
    );
    const bonusClaimed = useEnrollmentStore((state) =>
        state.enrollments[courseId]?.bonusClaimed ?? false
    );
    const loading = useEnrollmentStore((state) => state.loading[courseId] ?? false);
    const finalize = useEnrollmentStore((state) => state.finalize);
    const claimBonus = useEnrollmentStore((state) => state.claimBonus);

    const [isActionLoading, setIsActionLoading] = useState(false);

    if (!authenticated || !walletAddress || completedCount === 0) return null;

    const isComplete = completedCount >= totalLessons;

    const handleFinalize = async () => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        try {
            await finalize(walletAddress, courseId, totalLessons);
        } catch (error) {
            console.error("Finalize failed", error);
            alert("Failed to finalize course. Please try again.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleClaim = async () => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        try {
            await claimBonus(walletAddress, courseId, 500);
        } catch (error) {
            console.error("Claim failed", error);
            alert("Failed to claim bonus. Please try again.");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (!isComplete) return null;

    return (
        <div className="mt-6 border-t border-white/10 pt-6">
            {!completedAt ? (
                <div className="flex flex-col gap-4 items-start">
                    <h3 className="text-xl font-bold text-white">Course Complete!</h3>
                    <p className="text-text-secondary">You have finished all lessons.</p>
                    <button
                        onClick={handleFinalize}
                        disabled={isActionLoading || loading}
                        className="flex items-center gap-2 rounded-md bg-solana px-4 py-2 text-sm font-medium text-black hover:bg-solana/90 disabled:opacity-50"
                    >
                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Finalize Course
                    </button>
                </div>
            ) : !bonusClaimed ? (
                <div className="flex flex-col gap-4 items-start bg-solana/10 p-4 rounded-lg border border-solana/20">
                    <h3 className="text-xl font-bold text-solana flex items-center gap-2">
                        <Trophy className="h-6 w-6" />
                        Completion Bonus Available!
                    </h3>
                    <p className="text-text-secondary">Claim your 500 XP reward for completing this course.</p>
                    <button
                        onClick={handleClaim}
                        disabled={isActionLoading || loading}
                        className="flex items-center gap-2 rounded-md bg-solana px-4 py-2 text-sm font-medium text-black hover:bg-solana/90 disabled:opacity-50"
                    >
                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim 500 XP"}
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-solana">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Course Complete & Bonus Claimed</span>
                </div>
            )}
        </div>
    );
}
