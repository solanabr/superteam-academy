"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClaimStreakXp } from "@/hooks/useClaimStreakXp";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

const STORAGE_KEY = "superteam-daily-reward-date";

/** XP = 10 × streak, capped at 50 (streak bonus) */
function streakXp(streak: number) {
    return Math.min(10 * streak, 50);
}

export function DailyReward({ streakCount }: { streakCount: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const { publicKey } = useWallet();
    const claimStreakXp = useClaimStreakXp();

    useEffect(() => {
        const today = new Date().toDateString();
        const lastClaimed = localStorage.getItem(STORAGE_KEY);
        if (lastClaimed !== today) {
            setIsOpen(true);
        }
    }, []);

    const xpAmount = streakXp(streakCount || 1);

    const handleClaim = async () => {
        // Mark as claimed locally immediately — prevents double-claim regardless of tx result
        localStorage.setItem(STORAGE_KEY, new Date().toDateString());
        setClaimed(true);

        if (publicKey) {
            try {
                await claimStreakXp.mutateAsync(xpAmount);
                toast.success(`+${xpAmount} XP claimed! Streak: Day ${streakCount}`);
            } catch {
                // Error already shown by hook; still close modal
            }
        }

        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-2xl border-4 border-yellow-400/60 bg-zinc-900 p-8 shadow-2xl max-w-sm mx-4 animate-achievement-bounce">
                <div className="animate-badge-shake">
                    <Image src="/fire.png" alt="fire" width={80} height={80} />
                </div>
                <h2 className="font-game text-4xl text-yellow-400">
                    Day {streakCount} Streak!
                </h2>
                <p className="font-game text-xl text-gray-400 text-center">
                    Welcome back! Keep the streak going and earn bonus XP.
                </p>
                <div className="flex items-center gap-2 bg-zinc-800 rounded-2xl px-4 py-2">
                    <Image src="/star.png" alt="star" width={24} height={24} />
                    <span className="font-game text-2xl text-yellow-400">+{xpAmount} XP</span>
                </div>
                <Button
                    variant="pixel"
                    className="font-game text-2xl mt-2"
                    size="lg"
                    disabled={claimStreakXp.isPending || claimed}
                    onClick={handleClaim}
                >
                    {claimStreakXp.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Claiming…
                        </>
                    ) : "Claim Reward"}
                </Button>
            </div>
        </div>
    );
}
