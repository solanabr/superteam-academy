"use client";

import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { ACHIEVEMENTS, type Achievement } from "@/lib/achievements";
import { Loader2, CheckCircle, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import confetti from "canvas-confetti";

type ToastState = {
    type: "success" | "info";
    message: string;
} | null;

export function AchievementList() {
    const { authenticated, user } = usePrivy();
    const { wallets } = useWallets();
    const linkedAddress =
        user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
    const walletAddress = linkedAddress ?? wallets?.[0]?.address;

    const [claimedFlags, setClaimedFlags] = useState<boolean[]>(
        new Array(ACHIEVEMENTS.length).fill(false)
    );
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastState>(null);

    const fetchProgress = useCallback(async () => {
        if (!walletAddress) return;
        try {
            const res = await fetch(`/api/progress?wallet=${encodeURIComponent(walletAddress)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.achievementFlags) {
                    const flagsBytes = data.achievementFlags.data ? data.achievementFlags.data : Object.values(data.achievementFlags);

                    const newClaimed = ACHIEVEMENTS.map(a => {
                        const byteIndex = Math.floor(a.bitIndex / 8);
                        const bitIndex = a.bitIndex % 8;
                        return ((flagsBytes[byteIndex] as number) & (1 << bitIndex)) !== 0;
                    });
                    setClaimedFlags(newClaimed);
                }
            }
        } catch (e) {
            console.error("Failed to fetch progress", e);
        } finally {
            setLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        if (authenticated && walletAddress) {
            fetchProgress();
        } else {
            setLoading(false);
        }
    }, [authenticated, walletAddress, fetchProgress]);

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleClaim = async (achievement: Achievement) => {
        if (claimingId) return;
        setClaimingId(achievement.id);
        setToast(null);

        try {
            const res = await fetch("/api/onchain/claim-achievement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: walletAddress,
                    achievementId: achievement.id,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error ?? "Failed to claim");
            }

            const data = await res.json();

            if (data.claimed) {
                // Actually claimed — fire confetti and show success
                confetti({
                    particleCount: 120,
                    spread: 80,
                    origin: { y: 0.6 },
                });
                setToast({
                    type: "success",
                    message: "🎉 Congrats, continue on your journey soldier!",
                });
                await fetchProgress();
            } else {
                // Requirements not met — show friendly message
                setToast({
                    type: "info",
                    message: "Complete courses to earn XP and unlock this achievement.",
                });
            }
        } catch (e: any) {
            console.error(e);
            setToast({
                type: "info",
                message: e.message || "Something went wrong. Please try again later.",
            });
        } finally {
            setClaimingId(null);
        }
    };

    if (loading) return <Loader2 className="h-8 w-8 animate-spin text-solana mx-auto" />;

    return (
        <div className="space-y-4">
            {/* Inline Toast */}
            {toast && (
                <div
                    className={clsx(
                        "flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all animate-in fade-in slide-in-from-top-2 duration-300",
                        toast.type === "success"
                            ? "bg-solana/10 border-solana/30 text-solana"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    )}
                >
                    <span>{toast.message}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setToast(null)}
                        className="text-current opacity-60 hover:opacity-100 shrink-0"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </Button>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ACHIEVEMENTS.map((a, i) => {
                    const isClaimed = claimedFlags[i];

                    return (
                        <div
                            key={a.id}
                            className={clsx(
                                "glass-panel flex flex-col gap-4 rounded-lg border p-6 transition-all duration-300 hover:bg-white/[0.03]",
                                isClaimed ? "border-solana/50 bg-solana/5 hover:border-solana" : "border-white/5 opacity-80 hover:border-white/20 hover:opacity-100"
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div className="text-4xl">{a.icon}</div>
                                {isClaimed ? (
                                    <CheckCircle className="h-6 w-6 text-solana" />
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleClaim(a)}
                                        disabled={!!claimingId}
                                        className="text-text-secondary hover:text-white"
                                        title="Try to unlock"
                                    >
                                        {claimingId === a.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Unlock className="h-5 w-5" />}
                                    </Button>
                                )}
                            </div>
                            <div>
                                <h3 className={clsx("font-bold", isClaimed ? "text-white" : "text-text-secondary")}>
                                    {a.title}
                                </h3>
                                <p className="text-text-secondary text-sm mt-1">{a.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
