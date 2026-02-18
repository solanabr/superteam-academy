"use client";

import { type LeaderboardEntry } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { cn, formatXP, shortenAddress } from "@/lib/utils";
import { Flame, Trophy, Medal, Award } from "lucide-react";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserAddress?: string;
}

function getRankDisplay(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-400" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-300" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm text-muted-foreground font-mono">#{rank}</span>;
  }
}

export function LeaderboardTable({
  entries,
  currentUserAddress,
}: LeaderboardTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="grid grid-cols-[60px_1fr_100px_80px_80px_100px] gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
        <div>Rank</div>
        <div>Learner</div>
        <div className="text-right">XP</div>
        <div className="text-center">Level</div>
        <div className="text-center">Streak</div>
        <div className="text-right">Courses</div>
      </div>

      {entries.map((entry) => {
        const isCurrentUser = entry.address === currentUserAddress;
        return (
          <div
            key={entry.address}
            className={cn(
              "grid grid-cols-[60px_1fr_100px_80px_80px_100px] gap-2 px-4 py-3 items-center border-b last:border-b-0 transition-colors",
              isCurrentUser && "bg-primary/5",
              entry.rank <= 3 && "bg-muted/30"
            )}
          >
            <div className="flex items-center justify-center">
              {getRankDisplay(entry.rank)}
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                  entry.rank === 1
                    ? "bg-yellow-500/20 text-yellow-400"
                    : entry.rank === 2
                    ? "bg-gray-300/20 text-gray-300"
                    : entry.rank === 3
                    ? "bg-amber-600/20 text-amber-500"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {entry.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {entry.displayName}
                  {isCurrentUser && (
                    <span className="text-xs text-primary ml-1">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {shortenAddress(entry.address)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-semibold gradient-text">
                {formatXP(entry.xp)}
              </span>
            </div>

            <div className="text-center">
              <Badge variant="secondary" className="font-mono">
                Lv.{entry.level}
              </Badge>
            </div>

            <div className="flex items-center justify-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-sm">{entry.streak}</span>
            </div>

            <div className="text-right text-sm text-muted-foreground">
              {entry.coursesCompleted}
            </div>
          </div>
        );
      })}
    </div>
  );
}
