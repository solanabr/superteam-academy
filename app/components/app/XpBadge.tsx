"use client";

import { useXpBalance } from "@/hooks";
import { Sparkles } from "lucide-react";

export function XpBadge() {
    const { data: xp } = useXpBalance();

    return (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-sm font-semibold text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            <span>{(xp ?? 0).toLocaleString()} XP</span>
        </div>
    );
}
