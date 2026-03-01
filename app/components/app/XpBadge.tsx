"use client";

import { useXpBalance } from "@/hooks";
import { Sparkles } from "lucide-react";

export function XpBadge() {
    const { data: xp } = useXpBalance();

    return (
        <div className="inline-flex items-center gap-1.5 rounded-lg border-2 border-border bg-yellow-400/10 px-3 py-1 font-game text-sm text-yellow-600 dark:text-yellow-400">
            <Sparkles className="h-3.5 w-3.5 text-yellow-500 dark:text-yellow-400" />
            <span>{(xp ?? 0).toLocaleString()} XP</span>
        </div>
    );
}
