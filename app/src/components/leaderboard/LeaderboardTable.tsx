"use client";

import { LevelBadge } from "@/components/gamification/LevelBadge";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentWallet?: string;
}

const RANK_COLORS = ["#F5A623", "#AAAAAA", "#B87333"];
const RANK_LABELS = ["🥇", "🥈", "🥉"];

export function LeaderboardTable({ entries, currentWallet }: LeaderboardTableProps) {
  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
        <div className="col-span-1">#</div>
        <div className="col-span-6">Learner</div>
        <div className="col-span-2 text-center">Level</div>
        <div className="col-span-3 text-right">XP</div>
      </div>

      {entries.map((entry, i) => {
        const isTop3 = entry.rank <= 3;
        const isYou = currentWallet === entry.walletAddress;

        return (
          <div
            key={entry.walletAddress}
            className={cn(
              "grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-0 font-mono items-center transition-colors",
              isYou
                ? "bg-[#14F195]/5 border-l-2 border-l-[#14F195]"
                : "hover:bg-elevated"
            )}
          >
            {/* Rank */}
            <div className="col-span-1 text-sm">
              {isTop3 ? (
                <span>{RANK_LABELS[entry.rank - 1]}</span>
              ) : (
                <span className="text-muted-foreground text-xs">{entry.rank}</span>
              )}
            </div>

            {/* Wallet/username */}
            <div className="col-span-6 flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-elevated flex items-center justify-center text-[10px] flex-shrink-0">
                {(entry.username ?? entry.walletAddress)[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                {entry.username ? (
                  <span className="text-sm text-foreground truncate block">
                    {entry.username}
                  </span>
                ) : (
                  <span
                    className="text-xs text-muted-foreground truncate block"
                    title={entry.walletAddress}
                  >
                    {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                  </span>
                )}
                {isYou && (
                  <span className="text-[9px] text-[#14F195]">You</span>
                )}
              </div>
            </div>

            {/* Level */}
            <div className="col-span-2 flex justify-center">
              <LevelBadge level={entry.level} size="sm" />
            </div>

            {/* XP */}
            <div
              className={cn(
                "col-span-3 text-right text-sm mono-numbers",
                isTop3 ? "font-bold" : "",
                isTop3 ? `text-[${RANK_COLORS[entry.rank - 1]}]` : "text-foreground"
              )}
            >
              {entry.xpBalance.toLocaleString()}
            </div>
          </div>
        );
      })}

      {entries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground font-mono text-sm">
          No data yet
        </div>
      )}
    </div>
  );
}
