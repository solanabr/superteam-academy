"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useEnrollmentStore } from "@/store/enrollment-store";
import { Loader2, Trophy, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

type CourseCompletionProps = {
    courseId: string;
    totalLessons: number;
};

export function CourseCompletion({ courseId, totalLessons }: CourseCompletionProps) {
    const t = useTranslations("course_detail");
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
            alert(t("finalize_failed"));
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
            alert(t("claim_failed"));
        } finally {
            setIsActionLoading(false);
        }
    };

    if (!isComplete) return null;

    return (
        <div className="mt-6 border-t border-white/10 pt-6">
            {!completedAt ? (
                <div className="flex flex-col gap-4 items-start">
                    <h3 className="text-xl font-bold text-white">{t("completion_title")}</h3>
                    <p className="text-text-secondary">{t("completion_info")}</p>
                    <button
                        onClick={handleFinalize}
                        disabled={isActionLoading || loading}
                        className="flex items-center gap-2 rounded-md bg-solana px-4 py-2 text-sm font-medium text-black hover:bg-solana/90 disabled:opacity-50"
                    >
                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        {t("finalize_button")}
                    </button>
                </div>
            ) : !bonusClaimed ? (
                <div className="flex flex-col gap-4 items-start bg-solana/10 p-4 rounded-lg border border-solana/20">
                    <h3 className="text-xl font-bold text-solana flex items-center gap-2">
                        <Trophy className="h-6 w-6" />
                        {t("bonus_available")}
                    </h3>
                    <p className="text-text-secondary">{t("bonus_info", { xp: 500 })}</p>
                    <button
                        onClick={handleClaim}
                        disabled={isActionLoading || loading}
                        className="flex items-center gap-2 rounded-md bg-solana px-4 py-2 text-sm font-medium text-black hover:bg-solana/90 disabled:opacity-50"
                    >
                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("claim_button", { xp: 500 })}
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-solana">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">{t("course_finished_claimed")}</span>
                </div>
            )}
        </div>
    );
}
