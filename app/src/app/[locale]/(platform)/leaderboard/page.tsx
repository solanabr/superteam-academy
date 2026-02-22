"use client";

import { useEffect, useState } from "react";
import { useAppUser } from "@/hooks/useAppUser";
import { Loader2, Trophy } from "lucide-react";
import clsx from "clsx";
import type { LeaderboardEntry } from "@/lib/learning-progress/types";

export default function LeaderboardPage() {
  const { user } = useAppUser();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEntries(data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="text-solana h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="font-display text-text-primary text-3xl font-semibold">Leaderboard</h1>
        <p className="text-text-secondary mt-2">Top learners by XP</p>
      </div>

      <div className="glass-panel overflow-hidden rounded-lg border border-white/5">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 border-b border-white/5 bg-white/5 px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
          <div className="w-8 text-center">#</div>
          <div>User</div>
          <div className="text-right">Level</div>
          <div className="w-24 text-right">XP</div>
        </div>

        <div className="divide-y divide-white/5">
          {entries.map((entry) => {
            const isMe = user?.walletAddress === entry.walletAddress;
            return (
              <div
                key={entry.userId}
                className={clsx(
                  "grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-4 transition-colors",
                  isMe ? "bg-solana/10" : "hover:bg-white/5"
                )}
              >
                <div className="w-8 text-center font-mono text-sm text-text-secondary">
                  {entry.rank === 1 ? (
                    <Trophy className="mx-auto h-4 w-4 text-yellow-500" />
                  ) : entry.rank === 2 ? (
                    <Trophy className="mx-auto h-4 w-4 text-gray-400" />
                  ) : entry.rank === 3 ? (
                    <Trophy className="mx-auto h-4 w-4 text-amber-700" />
                  ) : (
                    entry.rank
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10">
                    <img
                      src={`https://api.dicebear.com/9.x/bottts/svg?seed=${entry.walletAddress}&backgroundColor=0a0a0b&baseColor=14f195&radius=50&sidesProbability=0&topProbability=0`}
                      alt="avatar"
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className={clsx("text-sm font-medium", isMe ? "text-solana" : "text-text-primary")}>
                      {entry.walletAddress.slice(0, 4)}...{entry.walletAddress.slice(-4)}
                      {isMe && " (You)"}
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono text-sm text-text-secondary">
                  Lv{entry.level}
                </div>
                <div className="w-24 text-right font-mono text-sm font-bold text-solana">
                  {entry.xp.toLocaleString()}
                </div>
              </div>
            );
          })}
          {entries.length === 0 && (
            <div className="p-8 text-center text-text-secondary">
              No records found. Start learning to appear here!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
