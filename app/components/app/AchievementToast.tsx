"use client";

import Image from "next/image";
import { toast } from "sonner";

/**
 * Show an achievement toast with the star.png icon, font-game text,
 * and a bounce animation.
 */
export function showAchievement(title: string, xp: number) {
    toast.custom(
        (id) => (
            <div className="flex items-center gap-3 rounded-2xl border-4 border-yellow-400/60 bg-zinc-900 px-5 py-3 shadow-lg animate-achievement-bounce">
                <Image
                    src="/star.png"
                    alt="star"
                    width={40}
                    height={40}
                    className="animate-spin-slow"
                    unoptimized
                />
                <div>
                    <p className="font-game text-xl text-yellow-400">{title}</p>
                    <p className="font-game text-lg text-gray-400">+{xp} XP earned!</p>
                </div>
            </div>
        ),
        { duration: 3500 }
    );
}

/**
 * Component version — renders nothing, just exports the function.
 * Import { showAchievement } from this file.
 */
export function AchievementToast() {
    return null;
}
