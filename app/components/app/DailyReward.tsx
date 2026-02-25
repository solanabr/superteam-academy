"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "superteam-daily-reward-date";

export function DailyReward({ streakCount }: { streakCount: number }) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const today = new Date().toDateString();
        const lastClaimed = localStorage.getItem(STORAGE_KEY);
        if (lastClaimed !== today) {
            setIsOpen(true);
        }
    }, []);

    const handleClaim = () => {
        localStorage.setItem(STORAGE_KEY, new Date().toDateString());
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
                    <span className="font-game text-2xl text-yellow-400">+10 XP</span>
                </div>
                <Button
                    variant="pixel"
                    className="font-game text-2xl mt-2"
                    size="lg"
                    onClick={handleClaim}
                >
                    Claim Reward
                </Button>
            </div>
        </div>
    );
}
