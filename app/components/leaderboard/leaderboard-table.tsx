import type { LeaderboardEntry } from "@/lib/leaderboard";
import { Crown, Medal, Trophy } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const topThreeStyles = [
  {
    row: "bg-amber-500/10 dark:bg-amber-500/15 border-l-4 border-l-amber-500",
    badge:
      "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40",
    icon: Crown,
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  {
    row: "bg-slate-400/10 dark:bg-slate-400/15 border-l-4 border-l-slate-400",
    badge:
      "bg-slate-400/20 text-slate-700 dark:text-slate-300 border-slate-400/40",
    icon: Medal,
    iconClass: "text-slate-600 dark:text-slate-400",
  },
  {
    row: "bg-amber-700/10 dark:bg-amber-700/15 border-l-4 border-l-amber-700",
    badge:
      "bg-amber-700/20 text-amber-800 dark:text-amber-500 border-amber-700/40",
    icon: Trophy,
    iconClass: "text-amber-700 dark:text-amber-500",
  },
] as const;

export function LeaderboardTable({
  entries,
  formatXp,
}: {
  entries: LeaderboardEntry[];
  formatXp: (xp: number) => string;
}) {
  return (
    <div className="overflow-hidden rounded-lg">
      <div className="min-w-[320px]">
        {/* Header */}
        <div className="grid grid-cols-[minmax(4rem,1fr)_1fr_minmax(5rem,1fr)] gap-4 border-b border-border bg-muted/40 px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
          <span>Rank</span>
          <span>Builder</span>
          <span className="text-right">XP</span>
        </div>

        {/* Rows */}
        <ul className="divide-y divide-border">
          {entries.map((entry) => {
            const isTopThree = entry.rank >= 1 && entry.rank <= 3;
            const style = isTopThree ? topThreeStyles[entry.rank - 1] : null;
            const Icon = style?.icon;

            return (
              <li
                key={`${entry.rank}-${entry.wallet}`}
                className={cn(
                  "grid grid-cols-[minmax(4rem,1fr)_1fr_minmax(5rem,1fr)] items-center gap-4 px-4 py-3.5 transition-colors sm:px-6",
                  "hover:bg-muted/30",
                  style?.row,
                )}
              >
                {/* Rank */}
                <div className="flex items-center gap-2">
                  {isTopThree && Icon ? (
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-heading font-bold",
                        style.badge,
                      )}
                      aria-hidden
                    >
                      <Icon
                        size={20}
                        weight="fill"
                        className={style.iconClass}
                      />
                    </span>
                  ) : (
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-sm font-medium tabular-nums text-muted-foreground"
                      aria-hidden
                    >
                      {entry.rank}
                    </span>
                  )}
                  {isTopThree && (
                    <span className="font-heading text-sm font-bold text-foreground">
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Wallet */}
                <span
                  className={cn(
                    "font-mono text-sm tabular-nums",
                    isTopThree
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {truncateAddress(entry.wallet)}
                </span>

                {/* XP */}
                <span
                  className={cn(
                    "text-right font-mono text-sm tabular-nums",
                    isTopThree
                      ? "font-bold text-primary"
                      : "font-medium text-muted-foreground",
                  )}
                >
                  {formatXp(entry.xp)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
