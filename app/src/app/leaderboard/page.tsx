"use client";

import { useEffect, useState } from "react";
import { LeaderboardEntry } from "@/types/academy";
import { fetchLeaderboard } from "@/lib/services/xp-service";
import { useWallet } from "@solana/wallet-adapter-react";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { publicKey } = useWallet();

  useEffect(() => {
    fetchLeaderboard().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `#${rank}`;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-500/10 border-yellow-500/20";
      case 2: return "bg-gray-400/10 border-gray-400/20";
      case 3: return "bg-amber-600/10 border-amber-600/20";
      default: return "bg-white/[0.02] border-white/5";
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/3 w-72 h-72 bg-[#14F195]/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Leaderboard</h1>
          <p className="text-white/50">
            Rankings based on soulbound XP token balances. Powered by Token-2022 on Solana Devnet.
          </p>
        </div>

        {/* Top 3 Podium */}
        {!loading && entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            {/* 2nd place */}
            <div className="glass-card p-6 text-center mt-8">
              <div className="text-3xl mb-2">🥈</div>
              <div className="text-sm font-semibold text-white/80 truncate">
                {entries[1].displayName || entries[1].wallet}
              </div>
              <div className="text-lg font-bold text-[#14F195] mt-1">
                {entries[1].xpBalance.toLocaleString()} XP
              </div>
            </div>
            
            {/* 1st place */}
            <div className="glass-card p-6 text-center glow-purple border-[#9945FF]/20">
              <div className="text-4xl mb-2">🥇</div>
              <div className="text-sm font-semibold text-white truncate">
                {entries[0].displayName || entries[0].wallet}
              </div>
              <div className="text-2xl font-bold text-[#14F195] mt-1">
                {entries[0].xpBalance.toLocaleString()} XP
              </div>
            </div>
            
            {/* 3rd place */}
            <div className="glass-card p-6 text-center mt-8">
              <div className="text-3xl mb-2">🥉</div>
              <div className="text-sm font-semibold text-white/80 truncate">
                {entries[2].displayName || entries[2].wallet}
              </div>
              <div className="text-lg font-bold text-[#14F195] mt-1">
                {entries[2].xpBalance.toLocaleString()} XP
              </div>
            </div>
          </div>
        )}

        {/* Full List */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/70">All Rankings</h2>
            <span className="text-xs text-white/30">{entries.length} learners</span>
          </div>

          {loading ? (
            <div className="divide-y divide-white/5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="w-8 h-8 bg-white/5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-white/5 rounded" />
                  </div>
                  <div className="h-4 w-20 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {entries.map((entry) => {
                const isCurrentUser = publicKey && entry.wallet.includes(publicKey.toBase58().slice(0, 4));
                return (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02] ${
                      isCurrentUser ? "bg-[#9945FF]/5 border-l-2 border-l-[#9945FF]" : ""
                    } ${getRankStyle(entry.rank)}`}
                  >
                    <div className="flex-shrink-0 w-10 text-center">
                      <span className={`text-lg ${entry.rank <= 3 ? "" : "text-white/40 text-sm"}`}>
                        {getRankBadge(entry.rank)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white/80 truncate">
                          {entry.displayName || entry.wallet}
                        </span>
                        {isCurrentUser && (
                          <span className="text-xs bg-[#9945FF]/20 text-[#9945FF] px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      {entry.displayName && (
                        <p className="text-xs text-white/30 truncate">{entry.wallet}</p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <span className="text-sm font-bold text-[#14F195]">
                        {entry.xpBalance.toLocaleString()}
                      </span>
                      <span className="text-xs text-white/30 ml-1">XP</span>
                    </div>

                    {/* XP bar visualization */}
                    <div className="hidden sm:block flex-shrink-0 w-24">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-full"
                          style={{ width: `${(entry.xpBalance / entries[0].xpBalance) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-8 glass-card p-6">
          <h3 className="text-sm font-semibold text-white/70 mb-2">How rankings work</h3>
          <p className="text-sm text-white/40 leading-relaxed">
            XP is a soulbound Token-2022 token — it cannot be transferred or burned. Rankings are computed
            by querying all XP token account balances via the Helius DAS API. Earn XP by completing
            lessons, finishing courses, and collecting achievements.
          </p>
        </div>
      </div>
    </div>
  );
}
