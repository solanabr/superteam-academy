"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { MeshGradient } from "@/components/MeshGradient";
import { GridPattern } from "@/components/GridPattern";
import { 
  Trophy, Medal, Crown, TrendingUp, Flame
} from "lucide-react";
import { useState } from "react";

const LEADERBOARD_DATA = [
  { rank: 1, name: "solanadev_eth", xp: 15420, level: 12, streak: 45, avatar: "🔷" },
  { rank: 2, name: "anchor_master", xp: 12850, level: 11, streak: 32, avatar: "🟢" },
  { rank: 3, name: "defi_queen", xp: 11200, level: 10, streak: 28, avatar: "👑" },
  { rank: 4, name: "nft_builder", xp: 9870, level: 9, streak: 21, avatar: "🎨" },
  { rank: 5, name: "rust_wizard", xp: 8540, level: 9, streak: 18, avatar: "🧙" },
  { rank: 6, name: "solana_hunter", xp: 7230, level: 8, streak: 14, avatar: "🎯" },
  { rank: 7, name: "code_ninja", xp: 6100, level: 7, streak: 12, avatar: "🥷" },
  { rank: 8, name: "dev_token", xp: 5420, level: 7, streak: 10, avatar: "💎" },
  { rank: 9, name: "blockchain_pro", xp: 4890, level: 6, streak: 8, avatar: "⛓️" },
  { rank: 10, name: "web3_dev", xp: 4250, level: 6, streak: 7, avatar: "🌐" },
];

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-white/40 font-medium">{rank}</span>;
}

export default function LeaderboardPage() {
  const { connected, publicKey } = useWallet();
  const [timeframe, setTimeframe] = useState<"alltime" | "monthly" | "weekly">("alltime");
  
  const userRank = connected ? { rank: 42, name: "You", xp: 2450, level: 4, streak: 7, avatar: "🧑‍💻" } : null;

  return (
    <div className="min-h-screen bg-black text-white relative">
      <MeshGradient />
      <GridPattern />
      
      <main className="pt-14 relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold mb-2">Leaderboard</h1>
              <p className="text-white/60">Top learners by XP</p>
            </div>
          </div>

          {/* Timeframe Filter */}
          <div className="flex gap-2 mb-8">
            {(["alltime", "monthly", "weekly"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeframe === t
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {t === "alltime" ? "All Time" : t === "monthly" ? "This Month" : "This Week"}
              </button>
            ))}
          </div>

          {/* Top 3 Podium */}
          {timeframe === "alltime" && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* 2nd Place */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center mt-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-2xl mb-4">
                  {LEADERBOARD_DATA[1].avatar}
                </div>
                <h3 className="font-medium mb-1">{LEADERBOARD_DATA[1].name}</h3>
                <div className="text-white/40 text-sm mb-2">Level {LEADERBOARD_DATA[1].level}</div>
                <div className="text-xl font-semibold text-gray-300">{LEADERBOARD_DATA[1].xp.toLocaleString()} XP</div>
              </div>
              
              {/* 1st Place */}
              <div className="bg-white/5 border border-yellow-400/30 rounded-xl p-6 flex flex-col items-center">
                <Crown className="w-8 h-8 text-yellow-400 mb-2" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl mb-4">
                  {LEADERBOARD_DATA[0].avatar}
                </div>
                <h3 className="font-medium mb-1">{LEADERBOARD_DATA[0].name}</h3>
                <div className="text-white/40 text-sm mb-2">Level {LEADERBOARD_DATA[0].level}</div>
                <div className="text-2xl font-semibold text-yellow-400">{LEADERBOARD_DATA[0].xp.toLocaleString()} XP</div>
              </div>
              
              {/* 3rd Place */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center mt-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-2xl mb-4">
                  {LEADERBOARD_DATA[2].avatar}
                </div>
                <h3 className="font-medium mb-1">{LEADERBOARD_DATA[2].name}</h3>
                <div className="text-white/40 text-sm mb-2">Level {LEADERBOARD_DATA[2].level}</div>
                <div className="text-xl font-semibold text-amber-600">{LEADERBOARD_DATA[2].xp.toLocaleString()} XP</div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/10 text-sm text-white/40 font-medium">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">User</div>
              <div className="col-span-2 text-right">Level</div>
              <div className="col-span-2 text-right">Streak</div>
              <div className="col-span-2 text-right">XP</div>
            </div>
            
            {LEADERBOARD_DATA.slice(timeframe === "alltime" ? 3 : 0).map((user, i) => (
              <div 
                key={user.rank}
                className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${
                  connected && userRank && user.xp < userRank.xp ? "opacity-60" : ""
                }`}
              >
                <div className="col-span-1 flex items-center">
                  {getRankIcon(user.rank)}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    {user.avatar}
                  </div>
                  <span className="font-medium">{user.name}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <span className="text-white/60">{user.level}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame className="w-4 h-4" />
                    {user.streak}
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-end font-medium">
                  {user.xp.toLocaleString()}
                </div>
              </div>
            ))}

            {/* Current User */}
            {userRank && (
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-t border-white/10 bg-yellow-400/10">
                <div className="col-span-1 flex items-center">
                  <span className="text-yellow-400 font-medium">{userRank.rank}</span>
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    {userRank.avatar}
                  </div>
                  <span className="font-medium text-yellow-400">{userRank.name}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <span className="text-white/60">{userRank.level}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame className="w-4 h-4" />
                    {userRank.streak}
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-end font-medium">
                  {userRank.xp.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
