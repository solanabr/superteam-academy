"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useEnrollmentStore } from "@/store/enrollment-store";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, CheckCircle, Medal } from "lucide-react";
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
    const onChainActive = useEnrollmentStore((state) =>
        state.enrollments[courseId]?.onChainActive ?? false
    );
    const bonusClaimed = useEnrollmentStore((state) =>
        state.enrollments[courseId]?.bonusClaimed ?? false
    );
    const loading = useEnrollmentStore((state) => state.loading[courseId] ?? false);
    const finalize = useEnrollmentStore((state) => state.finalize);
    const fetchEnrollment = useEnrollmentStore((state) => state.fetchEnrollment);
    const reclaimRent = useEnrollmentStore((state) => state.reclaimRent);

    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isReclaimLoading, setIsReclaimLoading] = useState(false);

    // State for tracking the newly minted Certificate NFT
    const [mintedCredentialId, setMintedCredentialId] = useState<string | null>(null);

    const isComplete = completedCount >= totalLessons || !!completedAt;

    if (!authenticated || !walletAddress || (completedCount === 0 && !completedAt)) return null;

    const handleFinalize = async () => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        try {
            console.log(`[CourseCompletion] Requesting graduation for course ${courseId}`);
            const res = await fetch(`/api/graduation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: walletAddress,
                    courseId: courseId,
                    lessonCount: totalLessons
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error ?? "Finalize failed");
            }

            const data = await res.json();
            if (data.mintAddress) {
                setMintedCredentialId(data.mintAddress);
            }
            if (data.warning || data.message) {
                alert(data.warning || data.message);
            }

            // Refresh state
            await fetchEnrollment(walletAddress, courseId, true);
        } catch (error: any) {
            console.error("Finalize failed", error);
            const errorMsg = error instanceof Error ? error.message : t("finalize_failed");
            alert(errorMsg);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleReclaimRent = async () => {
        if (isReclaimLoading) return;
        const confirm = window.confirm("Reclaiming rent will close your on-chain enrollment account and return approximately 0.003 SOL to your wallet. Your progress will remain archived in our database. Proceed?");
        if (!confirm) return;

        setIsReclaimLoading(true);
        try {
            const { wallet } = wallets[0] as any; // Privy wallet for signing
            await reclaimRent(walletAddress, courseId, wallets[0]?.signTransaction as any, wallets[0]);
            alert("Rent reclaimed successfully!");
        } catch (error: any) {
            console.error("Reclaim rent failed", error);
            alert(error instanceof Error ? error.message : "Reclaim rent failed");
        } finally {
            setIsReclaimLoading(false);
        }
    };

    if (!isComplete) return null;

    return (
        <div className="mt-6 border-t border-white/10 pt-6">
            {!completedAt ? (
                <div className="flex flex-col gap-4 items-start">
                    <h3 className="text-xl font-bold text-white">{t("completion_title")}</h3>
                    <p className="text-text-secondary">{t("completion_info")}</p>
                    <Button
                        onClick={handleFinalize}
                        disabled={isActionLoading || loading}
                        variant="default"
                        className="flex items-center gap-2 rounded-md bg-solana px-4 py-2 text-sm font-medium text-black hover:bg-solana/90 disabled:opacity-50"
                    >
                        {isActionLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Finalizing & Minting...
                            </>
                        ) : (
                            <>
                                <Medal className="h-4 w-4" />
                                Get Certificate
                            </>
                        )}
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-6 items-start bg-solana/10 p-6 rounded-xl border border-solana/30 shadow-[0_0_30px_-5px_rgba(20,240,148,0.2)] w-full">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-solana flex items-center gap-2">
                            <CheckCircle className="h-6 w-6" />
                            Course Complete & Graduation NFT Issued!
                        </h3>
                        <p className="text-text-secondary leading-relaxed text-sm max-w-lg">
                            You have successfully completed this course. A unique <strong>Metaplex Core NFT Certificate</strong> has been minted and permanently written to the Solana blockchain to verify your accomplishment!
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Button
                            asChild
                            variant="default"
                            className={`flex items-center gap-3 rounded-lg bg-solana text-[#0A0A0B] hover:brightness-110 shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)] px-6 py-3 font-bold transition-all h-auto`}
                        >
                            <Link href={`/profile/${walletAddress}`}>
                                <Medal className="h-5 w-5" />
                                View Your Certificate
                            </Link>
                        </Button>

                        {onChainActive && (
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleReclaimRent}
                                    disabled={isReclaimLoading}
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-rust hover:bg-rust/10 hover:border-rust/30 transition-all"
                                    title="Reclaim Rent & Close Enrollment"
                                >
                                    {isReclaimLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <span className="material-symbols-outlined text-xl">delete_forever</span>
                                    )}
                                </Button>
                                <span className="flex items-center gap-1 bg-solana/10 text-solana px-2 py-1 rounded text-[10px] font-bold border border-solana/20 uppercase tracking-tight">
                                    <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                                    Rent Reclaimable
                                </span>
                            </div>
                        )}
                    </div>

                    {!onChainActive && (
                        <p className="text-white/40 text-xs italic">
                            On-chain enrollment account closed. Progress archived off-chain.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
