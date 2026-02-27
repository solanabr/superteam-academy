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
    const { authenticated, user, connectWallet } = usePrivy();
    const { wallets } = useWallets();

    const linkedAddress =
        user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
    const walletAddress = linkedAddress ?? wallets?.[0]?.address;

    // Find the actual Solana wallet object that matches our target address
    const activeWallet = wallets.find(w => w.address === walletAddress) ?? wallets[0];

    // Use atomic selectors to prevent re-render issues
    const completedCount = useEnrollmentStore((state) =>
        state.enrollments[courseId]?.completedCount ?? 0
    );
    const mintedAt = useEnrollmentStore((state) =>
        state.enrollments[courseId]?.completedAt ?? null
    );
    const mintAddress = useEnrollmentStore((state) =>
        state.enrollments[courseId]?.mintAddress ?? null
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

    // Persists after API success — prevents button from reverting to "Get Certificate"
    const [graduated, setGraduated] = useState(false);

    const isComplete = completedCount >= totalLessons || !!mintedAt;

    // Condition for "Truly Finished": 
    // If on-chain is active, we wait for mintAddress. Otherwise just mintedAt.
    const USE_ONCHAIN = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true";
    const isMinted = USE_ONCHAIN ? !!mintAddress : !!mintedAt;

    // Once the graduation API returns success, poll until isMinted is true
    useEffect(() => {
        if (!graduated || isMinted || !walletAddress) return;
        const interval = setInterval(() => {
            fetchEnrollment(walletAddress, courseId, true);
        }, 3000);
        return () => clearInterval(interval);
    }, [graduated, isMinted, walletAddress, courseId, fetchEnrollment]);

    if (!authenticated || !walletAddress || (completedCount === 0 && !mintedAt)) return null;

    const handleFinalize = async () => {
        if (isActionLoading || graduated) return;

        if (!walletAddress) {
            const isEmbeddedWallet =
                user?.linkedAccounts?.some((a) => a.type === "wallet" && (a as any).walletClientType === "privy") ||
                (user?.wallet as any)?.walletClientType === "privy";
            if (!isEmbeddedWallet) {
                alert("Please connect your Solana wallet to get your certificate.");
                connectWallet();
            } else {
                alert("Wallet is still initializing. Please wait a moment and try again.");
            }
            return;
        }

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

            // Mark as graduated — this prevents the button from ever reverting
            setGraduated(true);

            const data = await res.json();
            if (data.warning || data.message) {
                alert(data.warning || data.message);
            }

            // Refresh state (may or may not have completedAt yet — polling handles the rest)
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

        if (!activeWallet || !walletAddress) {
            const isEmbeddedWallet =
                user?.linkedAccounts?.some((a) => a.type === "wallet" && (a as any).walletClientType === "privy") ||
                (user?.wallet as any)?.walletClientType === "privy";
            if (!isEmbeddedWallet) {
                alert("Please connect your Solana wallet to reclaim rent.");
                connectWallet();
            } else {
                alert("Wallet is still initializing. Please wait a moment and try again.");
            }
            return;
        }

        const confirm = window.confirm("Reclaiming rent will close your on-chain enrollment account and return approximately 0.003 SOL to your wallet. Your progress will remain archived in our database. Proceed?");
        if (!confirm) return;

        setIsReclaimLoading(true);
        try {
            await reclaimRent(walletAddress, courseId, activeWallet.signTransaction as any, activeWallet);
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
            {!isMinted && !graduated ? (
                <div className="flex flex-col gap-4 items-start">
                    <h3 className="text-xl font-bold text-white">{t("completion_title")}</h3>
                    <p className="text-text-secondary">{t("completion_info")}</p>
                    <Button
                        onClick={handleFinalize}
                        disabled={isActionLoading || loading}
                        variant="solana-ghost"
                        className="flex items-center gap-2"
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
            ) : !isMinted && graduated ? (
                <div className="flex flex-col gap-4 items-start">
                    <h3 className="text-xl font-bold text-white">{t("completion_title")}</h3>
                    <p className="text-text-secondary">Your certificate is being minted on-chain. This may take a moment...</p>
                    <Button
                        disabled
                        variant="default"
                        className="flex items-center gap-2 rounded-md bg-solana/70 px-4 py-2 text-sm font-medium text-black disabled:opacity-80"
                    >
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Finalizing & Minting...
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
