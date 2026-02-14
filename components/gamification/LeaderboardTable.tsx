"use client";

import { levelProgress } from "@/lib/gamification/levels";

type LeaderboardEntry = {
  rank: number;
  username: string;
  xp: number;
  level: number;
  streak: number;
};

type LeaderboardTableProps = {
  entries: LeaderboardEntry[];
  currentUsername?: string;
  labels: {
    rank: string;
    user: string;
    xp: string;
    level: string;
    streak: string;
  };
};

const rankMedals: Record<number, string> = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };

const avatarColors = [
  "bg-solana-purple/20 text-solana-purple",
  "bg-solana-green/20 text-solana-green",
  "bg-blue-500/20 text-blue-400",
  "bg-amber-500/20 text-amber-400",
  "bg-pink-500/20 text-pink-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-orange-500/20 text-orange-400",
  "bg-cyan-500/20 text-cyan-400",
  "bg-red-500/20 text-red-400",
  "bg-violet-500/20 text-violet-400",
];

function getInitials(username: string): string {
  return username
    .replace(/[._-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function LeaderboardTable({ entries, currentUsername, labels }: LeaderboardTableProps): JSX.Element {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[3rem_1fr_5rem_5rem_4.5rem] items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid-cols-[3rem_1fr_6rem_6rem_5rem]">
        <span>{labels.rank}</span>
        <span>{labels.user}</span>
        <span className="text-right">{labels.xp}</span>
        <span className="text-center">{labels.level}</span>
        <span className="text-right">{labels.streak}</span>
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {entries.map((entry, i) => {
          const isCurrentUser = currentUsername !== undefined && entry.username === currentUsername;
          const medal = rankMedals[entry.rank];
          const progress = levelProgress(entry.xp);
          const color = avatarColors[i % avatarColors.length];
          const initials = getInitials(entry.username);

          return (
            <div
              key={entry.username}
              className={`grid grid-cols-[3rem_1fr_5rem_5rem_4.5rem] items-center gap-2 rounded-lg border px-4 py-3 transition-colors md:grid-cols-[3rem_1fr_6rem_6rem_5rem] ${
                isCurrentUser
                  ? "border-solana-purple/40 bg-solana-purple/5"
                  : entry.rank <= 3
                    ? "border-border bg-muted/30"
                    : "border-border"
              }`}
            >
              {/* Rank */}
              <span className="text-center text-lg">
                {medal ?? (
                  <span className="text-sm font-medium text-muted-foreground">{entry.rank}</span>
                )}
              </span>

              {/* User (avatar + name + XP bar) */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
                  {initials}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className={`truncate text-sm font-medium ${isCurrentUser ? "text-solana-purple" : ""}`}>
                    {isCurrentUser ? `${entry.username} (you)` : entry.username}
                  </span>
                  {/* XP progress bar to next level */}
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-20 overflow-hidden rounded-full bg-muted md:w-28">
                      <div
                        className="h-full rounded-full bg-solana-green/70 transition-all"
                        style={{ width: `${progress.progressPercent}%` }}
                      />
                    </div>
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                      {progress.progressPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* XP */}
              <span className="text-right text-sm font-semibold tabular-nums">
                {entry.xp.toLocaleString()}
              </span>

              {/* Level badge */}
              <div className="flex justify-center">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  entry.level >= 8
                    ? "bg-solana-purple/15 text-solana-purple"
                    : entry.level >= 5
                      ? "bg-solana-green/15 text-solana-green"
                      : "bg-muted text-muted-foreground"
                }`}>
                  Lv.{entry.level}
                </span>
              </div>

              {/* Streak */}
              <span className="text-right text-sm tabular-nums">
                {entry.streak > 0 && <span className="mr-0.5">{"\u{1F525}"}</span>}
                {entry.streak}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
