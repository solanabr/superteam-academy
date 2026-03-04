"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { onChainLeaderboardService, leaderboardService } from "@/lib/services";

const RANK_COLORS = ["text-yellow-400", "text-gray-300", "text-amber-600"];
const RANK_EMOJI = ["🥇", "🥈", "🥉"];

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  username?: string;
  xp: number;
  level: number;
  credentialCount: number;
}

export default function LeaderboardPage() {
  const [filter, setFilter] = useState("all-time");
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      try {
        const data = await onChainLeaderboardService.getLeaderboard(20);
        if (data.length > 0) {
          setLeaders(data);
        } else {
          const fallback = await leaderboardService.getLeaderboard(20);
          setLeaders(fallback);
        }
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
        const fallback = await leaderboardService.getLeaderboard(20);
        setLeaders(fallback);
      }
      setLoading(false);
    }
    loadLeaderboard();
  }, [filter]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Top Solana builders ranked by XP</p>
        </div>
        <div className="flex gap-2 mb-6">
          {["weekly", "monthly", "all-time"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={"px-4 py-1.5 rounded-full text-sm border transition-all capitalize " + (filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50")}
            >{f}</button>
          ))}
        </div>
        <div className="animate-pulse space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Top Solana builders ranked by XP</p>
      </div>
      <div className="flex gap-2 mb-6">
        {["weekly", "monthly", "all-time"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={"px-4 py-1.5 rounded-full text-sm border transition-all capitalize " + (filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50")}
          >{f}</button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {leaders.map((user) => (
          <div key={user.rank} className={"flex items-center gap-4 p-4 rounded-xl border transition-all " + (user.rank <= 3 ? "border-primary/30 bg-primary/5" : "border-border bg-card")}>
            <div className={"text-xl font-bold w-8 text-center " + (RANK_COLORS[user.rank-1] || "text-muted-foreground")}>
              {user.rank <= 3 ? RANK_EMOJI[user.rank-1] : user.rank}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{user.username || user.wallet.slice(0,6) + "..." + user.wallet.slice(-4)}</div>
              <div className="text-xs text-muted-foreground">{user.wallet.slice(0,8)}...{user.wallet.slice(-6)}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-primary">{user.xp.toLocaleString()} XP</div>
              <div className="text-xs text-muted-foreground">Level {user.level} · 🔥 {user.credentialCount}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}