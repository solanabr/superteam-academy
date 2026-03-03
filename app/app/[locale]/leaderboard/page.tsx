"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const MOCK_LEADERS = [
  { rank: 1, address: "9xQe...F3mK", name: "sol_master_br", xp: 12500, level: 11, streak: 45 },
  { rank: 2, address: "7hJk...P2nL", name: "anchor_wizard", xp: 9800, level: 9, streak: 32 },
  { rank: 3, address: "3mNp...Q8sW", name: "latam_builder", xp: 8200, level: 9, streak: 28 },
  { rank: 4, address: "5rTy...H6vB", name: "defi_dev_mx", xp: 7100, level: 8, streak: 15 },
  { rank: 5, address: "2wXz...K4cD", name: "rust_rookie", xp: 5600, level: 7, streak: 21 },
  { rank: 6, address: "8pLm...J9qE", name: "nft_builder", xp: 4200, level: 6, streak: 8 },
  { rank: 7, address: "1vCb...R7tF", name: "crypto_learn", xp: 3100, level: 5, streak: 12 },
  { rank: 8, address: "6nHs...U3wG", name: "solana_noob", xp: 2400, level: 4, streak: 5 },
  { rank: 9, address: "4kGf...Y1xH", name: "web3_latam", xp: 1800, level: 4, streak: 3 },
  { rank: 10, address: "0jDe...M5yI", name: "anchor_dev", xp: 1200, level: 3, streak: 7 },
];

const RANK_COLORS = ["text-yellow-400", "text-gray-300", "text-amber-600"];
const RANK_EMOJI = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [filter, setFilter] = useState("all-time");
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
        {MOCK_LEADERS.map((user) => (
          <div key={user.rank} className={"flex items-center gap-4 p-4 rounded-xl border transition-all " + (user.rank <= 3 ? "border-primary/30 bg-primary/5" : "border-border bg-card")}>
            <div className={"text-xl font-bold w-8 text-center " + (RANK_COLORS[user.rank-1] || "text-muted-foreground")}>
              {user.rank <= 3 ? RANK_EMOJI[user.rank-1] : user.rank}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.address}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-primary">{user.xp.toLocaleString()} XP</div>
              <div className="text-xs text-muted-foreground">Level {user.level} · 🔥 {user.streak}d</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}