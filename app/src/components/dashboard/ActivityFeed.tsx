"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppUser } from "@/hooks/useAppUser";
import { Clock } from "lucide-react";
import { useUserStore } from "@/store/user-store";

export function ActivityFeed() {
    const t = useTranslations("dashboard");
    const { user } = useAppUser();

    // Wire to Zustand Cache
    const activities = useUserStore((s) => s.recentActivities);
    const isLoading = useUserStore((s) => s.isActivitiesLoading);
    const fetchActivities = useUserStore((s) => s.fetchActivities);

    useEffect(() => {
        if (!user?.walletAddress) return;

        // Tells Zustand to fetch data (only hits the network if the cache is empty)
        fetchActivities(user.walletAddress);
    }, [user?.walletAddress, fetchActivities]);

    return (
        <div className="glass-panel p-6 rounded-xl flex flex-col h-[340px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold text-white">{t("recentActivity", { fallback: "Recent Activity" })}</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-white/5 rounded-lg w-full"></div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                        <p className="text-sm text-text-muted">No recent activity.</p>
                        <p className="text-xs text-text-muted/60 mt-1">Complete a lesson to earn XP!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activities.map((act) => (
                            <div
                                key={act.id}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/5 transition-colors"
                            >
                                <div className="h-2 w-2 rounded-full bg-solana shrink-0 shadow-[0_0_8px_rgba(20,241,149,0.5)]" />
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium text-white">{act.title}</span>
                                    {act.description && (
                                        <span className="text-text-muted ml-2 text-xs">
                                            — {act.description}
                                        </span>
                                    )}
                                </div>
                                {act.xp > 0 && (
                                    <span className="text-xs font-mono font-bold text-solana bg-solana/10 px-2 py-0.5 rounded shrink-0 border border-solana/20">
                                        +{act.xp} XP
                                    </span>
                                )}
                                <span className="text-xs text-text-muted shrink-0 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(act.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
