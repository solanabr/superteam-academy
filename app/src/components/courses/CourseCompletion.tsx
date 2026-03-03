"use client";

import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useCourseStore } from "@/store/course-store";
import { useLessonStore } from "@/store/lesson-store";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Medal } from "lucide-react";
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

    // Use the new consolidated courseStore
    const progress = useCourseStore((s) => s.progress);
    const isLoading = useCourseStore((s) => s.isLoading || s.isGraduating);
    const fetchProgress = useCourseStore((s) => s.fetchProgress);
    const graduate = useCourseStore((s) => s.graduate);

    const completedCount = progress?.completedCount ?? 0;
    const mintedAt = progress?.completedAt ?? null;
    const mintAddress = progress?.mintAddress ?? null;
    const credentialId = progress?.credentialId ?? null;

    // The certificate identifier: prefer mintAddress (on-chain NFT), fall back to credentialId (Prisma DB)
    const certificateId = mintAddress || credentialId;

    // Use optimistic lesson state for immediate redirects where DB sync via Inngest is still processing
    const optimisticCompletions = useLessonStore((s) => s.completions[courseId]);
    const optimisticCompletedCount = optimisticCompletions?.lessonFlags
        ? optimisticCompletions.lessonFlags.reduce((count, byte) => {
            let n = byte;
            let c = 0;
            while (n > 0) { c += n & 1; n >>= 1; }
            return count + c;
        }, 0)
        : completedCount;

    const effectiveCompletedCount = Math.max(completedCount, optimisticCompletedCount);

    const [isActionLoading, setIsActionLoading] = useState(false);

    // Poll for certificate ID after graduation completes (Inngest mints asynchronously)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        // Only poll when: course is minted but we don't have a certificate link yet
        if (mintedAt && !certificateId && walletAddress) {
            pollRef.current = setInterval(() => {
                fetchProgress(walletAddress, courseId, true, true);
            }, 4000); // Poll every 4 seconds
        }

        // Stop polling once we have a certificate identifier
        if (certificateId && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [mintedAt, certificateId, walletAddress, courseId, fetchProgress]);

    const handleFinalize = async () => {
        if (isActionLoading) return;

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
            await graduate(walletAddress, courseId, totalLessons);
        } catch (error: any) {
            console.error("Finalize failed", error);
            const errorMsg = error instanceof Error ? error.message : t("finalize_failed");
            alert(errorMsg);
        } finally {
            setIsActionLoading(false);
        }
    };

    const isComplete = effectiveCompletedCount >= totalLessons || !!mintedAt;
    const isMinted = !!mintedAt;

    if (!authenticated || !walletAddress || (effectiveCompletedCount === 0 && !mintedAt)) return null;
    if (!isComplete) return null;

    return (
        <div className="mt-6 border-t border-white/10 pt-6">
            {!isMinted ? (
                <div className="flex flex-col gap-4 items-start">
                    <h3 className="text-xl font-bold text-white">{t("completion_title")}</h3>
                    <p className="text-text-secondary">
                        {isLoading
                            ? "Your certificate is being minted on-chain. This may take a moment..."
                            : t("completion_info")
                        }
                    </p>
                    <Button
                        onClick={handleFinalize}
                        disabled={isActionLoading || isLoading}
                        variant={isLoading ? "default" : "solana-ghost"}
                        className={`flex items-center gap-2 ${isLoading ? "bg-solana/70 text-black cursor-wait" : ""}`}
                    >
                        {(isActionLoading || isLoading) ? (
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
                        {certificateId ? (
                            <Button
                                asChild
                                variant="default"
                                className={`flex items-center gap-3 rounded-lg bg-solana text-[#0A0A0B] hover:brightness-110 shadow-[0_0_20px_-5px_rgba(20,240,148,0.4)] px-6 py-3 font-bold transition-all h-auto`}
                            >
                                <Link href={`/certificates/${certificateId}`}>
                                    <Medal className="h-5 w-5" />
                                    View Your Certificate
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                disabled
                                variant="default"
                                className="flex items-center gap-3 rounded-lg bg-solana/60 text-[#0A0A0B] px-6 py-3 font-bold h-auto cursor-wait"
                            >
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Preparing Certificate...
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
